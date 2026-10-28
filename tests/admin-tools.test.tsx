import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { CmsEdit, CmsEditSession } from "@/types/cms";

const mocks = vi.hoisted(() => ({ updateCmsRow: vi.fn(), undoCmsEdit: vi.fn() }));
vi.mock("@/lib/cms/actions", () => ({ updateCmsRow: mocks.updateCmsRow, undoCmsEdit: mocks.undoCmsEdit }));
vi.mock("@/app/login/actions", () => ({ signOutAction: vi.fn() }));

import { CmsEditorProvider } from "../src/components/cms/CmsEditorProvider";
import { CmsBoxClient } from "../src/components/cms/CmsBoxClient";
import { AdminTools } from "../src/components/cms/AdminTools";

const ROW_ID = "6f1c2a8e-4b3d-4e7f-9a2b-1c3d4e5f6a7b";

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

const makeEdit = (overrides: Partial<CmsEdit>): CmsEdit => ({
    id: "edit-1",
    table: "sections",
    rowId: ROW_ID,
    label: "Hero section",
    before: { heading: "Old *heading*" },
    after: { heading: "New heading" },
    createdAt: minutesAgo(2),
    revertedAt: null,
    undoState: "ready",
    ...overrides,
});

const LIVE_SESSION: CmsEditSession = {
    expiresAt: new Date(Date.now() + 8 * 60_000).toISOString(),
    edits: [
        makeEdit({}),
        makeEdit({ id: "edit-2", label: "Keynote: Ada", after: { name: "Ada L." }, before: { name: "Ada" }, undoState: "stale" }),
    ],
};

const renderTools = (editSession: CmsEditSession = LIVE_SESSION) =>
    render(
        <CmsEditorProvider editSession={editSession}>
            <CmsBoxClient table="sections" rowId={ROW_ID} label="Hero section" values={{ heading: "New heading" }}>
                <h1>New heading</h1>
            </CmsBoxClient>
            <AdminTools />
        </CmsEditorProvider>,
    );

const launcher = () => screen.getByRole("button", { name: /Admin Tools/ });

const openPanel = () => {
    fireEvent.click(launcher());
    fireEvent.click(screen.getByRole("button", { name: /Recent changes/ }));
    return screen.getByRole("region", { name: "Recent changes" });
};

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("AdminTools", () => {
    it("expands and collapses on click, keeping the menu inert while closed", () => {
        renderTools();
        const menu = screen.getByRole("navigation", { name: "Admin tools", hidden: true });

        expect(launcher().getAttribute("aria-expanded")).toBe("false");
        expect(menu.hasAttribute("inert")).toBe(true);

        fireEvent.click(launcher());
        expect(launcher().getAttribute("aria-expanded")).toBe("true");
        expect(menu.hasAttribute("inert")).toBe(false);

        fireEvent.click(launcher());
        expect(launcher().getAttribute("aria-expanded")).toBe("false");
    });

    it("counts only the changes that can still be undone", () => {
        renderTools();

        expect(launcher().textContent).toMatch(/1 recent change you can undo/);
    });

    it("lists the session's changes with what they replaced", () => {
        renderTools();
        const panel = openPanel();

        expect(within(panel).getByText("Hero section")).toBeTruthy();
        expect(within(panel).getByText("Old heading")).toBeTruthy();
        expect(within(panel).getByText(/Changed again since/)).toBeTruthy();
        expect(within(panel).getByRole("button", { name: "Undo change to Keynote: Ada" })).toHaveProperty("disabled", true);
        expect(within(panel).getByText(/10-minute break can't be undone/)).toBeTruthy();
    });

    it("undoes a change", async () => {
        mocks.undoCmsEdit.mockResolvedValue({ data: { id: "edit-1" }, error: null });
        renderTools();

        fireEvent.click(within(openPanel()).getByRole("button", { name: "Undo change to Hero section" }));

        await waitFor(() => expect(mocks.undoCmsEdit).toHaveBeenCalledWith("edit-1"));
    });

    it("won't undo while a box is open, and says why", async () => {
        renderTools();

        fireEvent.click(screen.getByRole("button", { name: "Edit Hero section" }));
        fireEvent.click(within(openPanel()).getByRole("button", { name: "Undo change to Hero section" }));

        // the undo runs in a transition, so the notice lands a tick later
        expect((await screen.findByRole("dialog")).textContent).toMatch(/before undoing a change/);
        expect(mocks.undoCmsEdit).not.toHaveBeenCalled();
    });

    it("shows the error dialog when an undo is refused", async () => {
        mocks.undoCmsEdit.mockResolvedValue({
            data: null,
            error: { message: "This change is too old to undo.", hint: null, code: null, codeMeaning: null },
        });
        renderTools();

        fireEvent.click(within(openPanel()).getByRole("button", { name: "Undo change to Hero section" }));

        await waitFor(() => expect(screen.getByRole("dialog").textContent).toMatch(/Couldn't undo the change to/));
    });

    it("closes the panel, then the menu, on Escape", () => {
        renderTools();
        const panel = openPanel();

        fireEvent.keyDown(panel, { key: "Escape" });
        expect(screen.queryByRole("region", { name: "Recent changes" })).toBeNull();
        expect(launcher().getAttribute("aria-expanded")).toBe("true");

        fireEvent.keyDown(launcher(), { key: "Escape" });
        expect(launcher().getAttribute("aria-expanded")).toBe("false");
    });

    it("shows an empty state once the session has lapsed", () => {
        renderTools({ ...LIVE_SESSION, expiresAt: minutesAgo(1) });

        expect(launcher().textContent).not.toMatch(/you can undo/);
        expect(within(openPanel()).getByText(/No changes this session yet/)).toBeTruthy();
    });
});