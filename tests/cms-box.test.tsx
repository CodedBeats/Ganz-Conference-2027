import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({ updateCmsRow: vi.fn() }));
vi.mock("@/lib/cms/actions", () => ({ updateCmsRow: mocks.updateCmsRow }));

import { CmsEditorProvider } from "../src/components/cms/CmsEditorProvider";
import { CmsBoxClient } from "../src/components/cms/CmsBoxClient";
import { CmsTextClient } from "../src/components/cms/CmsTextClient";

const FIRST_ID = "6f1c2a8e-4b3d-4e7f-9a2b-1c3d4e5f6a7b";
const SECOND_ID = "7a2d3b9f-5c4e-4f80-8b3c-2d4e5f6a7b8c";

const renderEditor = () =>
    render(
        <CmsEditorProvider>
            <CmsBoxClient table="sections" rowId={FIRST_ID} label="Hero section" values={{ heading: "Hello", body: "Body" }}>
                <CmsTextClient field="heading" label="Heading">
                    <h1>Hello</h1>
                </CmsTextClient>
                <CmsTextClient field="body" label="Body" multiline>
                    <p>Body</p>
                </CmsTextClient>
            </CmsBoxClient>
            <CmsBoxClient table="people" rowId={SECOND_ID} label="Keynote: Ada" values={{ name: "Ada" }}>
                <CmsTextClient field="name" label="Name">
                    <h3>Ada</h3>
                </CmsTextClient>
            </CmsBoxClient>
        </CmsEditorProvider>,
    );

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("CmsBoxClient", () => {
    it("turns its fields into inputs seeded with the saved values when the pen is clicked", () => {
        renderEditor();

        fireEvent.click(screen.getByRole("button", { name: "Edit Hero section" }));

        expect(screen.getByLabelText("Heading")).toHaveProperty("value", "Hello");
        expect(screen.getByLabelText("Body")).toHaveProperty("value", "Body");
        expect(screen.getByLabelText("Heading").closest("[data-cms-box]")?.className).toContain("cms-box-editing");
        expect(screen.getByRole("button", { name: "Save Hero section" })).toBeTruthy();
        expect(screen.getByRole("button", { name: "Cancel editing Hero section" })).toBeTruthy();
    });

    it("throws the draft away on cancel", () => {
        renderEditor();

        fireEvent.click(screen.getByRole("button", { name: "Edit Hero section" }));
        fireEvent.change(screen.getByLabelText("Heading"), { target: { value: "Changed" } });
        fireEvent.click(screen.getByRole("button", { name: "Cancel editing Hero section" }));

        expect(screen.queryByLabelText("Heading")).toBeNull();
        expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Hello");
        expect(mocks.updateCmsRow).not.toHaveBeenCalled();
    });

    it("cancels on Escape", () => {
        renderEditor();

        fireEvent.click(screen.getByRole("button", { name: "Edit Hero section" }));
        fireEvent.keyDown(screen.getByLabelText("Heading"), { key: "Escape" });

        expect(screen.queryByLabelText("Heading")).toBeNull();
    });

    it("saves only the changed fields, then leaves edit mode", async () => {
        mocks.updateCmsRow.mockResolvedValue({ data: { id: FIRST_ID }, error: null });
        renderEditor();

        fireEvent.click(screen.getByRole("button", { name: "Edit Hero section" }));
        fireEvent.change(screen.getByLabelText("Heading"), { target: { value: "Changed" } });
        await act(async () => fireEvent.click(screen.getByRole("button", { name: "Save Hero section" })));

        expect(mocks.updateCmsRow).toHaveBeenCalledWith("sections", FIRST_ID, { heading: "Changed" });
        await waitFor(() => expect(screen.queryByLabelText("Heading")).toBeNull());
    });

    it("saves on Ctrl+Enter", async () => {
        mocks.updateCmsRow.mockResolvedValue({ data: { id: FIRST_ID }, error: null });
        renderEditor();

        fireEvent.click(screen.getByRole("button", { name: "Edit Hero section" }));
        fireEvent.change(screen.getByLabelText("Body"), { target: { value: "New body" } });
        await act(async () => fireEvent.keyDown(screen.getByLabelText("Body"), { key: "Enter", ctrlKey: true }));

        expect(mocks.updateCmsRow).toHaveBeenCalledWith("sections", FIRST_ID, { body: "New body" });
    });

    it("treats saving an untouched draft as cancel", () => {
        renderEditor();

        fireEvent.click(screen.getByRole("button", { name: "Edit Hero section" }));
        fireEvent.click(screen.getByRole("button", { name: "Save Hero section" }));

        expect(mocks.updateCmsRow).not.toHaveBeenCalled();
        expect(screen.queryByLabelText("Heading")).toBeNull();
    });

    it("shows the error dialog and keeps the draft when a save fails", async () => {
        mocks.updateCmsRow.mockResolvedValue({
            data: null,
            error: {
                message: "Another item already uses this value, and it has to be unique.",
                hint: "Change the value so it's different from the other item, then save again.",
                code: "23505",
                codeMeaning: "Unique value conflict - the database only allows one item with this value.",
            },
        });
        renderEditor();

        fireEvent.click(screen.getByRole("button", { name: "Edit Hero section" }));
        fireEvent.change(screen.getByLabelText("Heading"), { target: { value: "Changed" } });
        await act(async () => fireEvent.click(screen.getByRole("button", { name: "Save Hero section" })));

        const dialog = await screen.findByRole("dialog");
        expect(dialog.textContent).toContain("Couldn't save “Hero section”");
        expect(dialog.textContent).toContain("has to be unique");
        expect(dialog.textContent).toContain("then save again");
        expect(dialog.textContent).toContain("Error code 23505: Unique value conflict");
        expect(screen.getByLabelText("Heading")).toHaveProperty("value", "Changed");
    });

    it("refuses to open a second box while one is being edited", async () => {
        renderEditor();

        fireEvent.click(screen.getByRole("button", { name: "Edit Hero section" }));
        fireEvent.click(screen.getByRole("button", { name: "Edit Keynote: Ada" }));

        const dialog = await screen.findByRole("dialog");
        expect(dialog.textContent).toContain("Finish your current edit first");
        expect(dialog.textContent).toContain("“Hero section”");
        expect(screen.queryByLabelText("Name")).toBeNull();
        expect(screen.getByLabelText("Heading")).toBeTruthy();
    });

    it("lets another box open once the first is closed", () => {
        renderEditor();

        fireEvent.click(screen.getByRole("button", { name: "Edit Hero section" }));
        fireEvent.click(screen.getByRole("button", { name: "Cancel editing Hero section" }));
        fireEvent.click(screen.getByRole("button", { name: "Edit Keynote: Ada" }));

        expect(screen.getByLabelText("Name")).toHaveProperty("value", "Ada");
    });
});