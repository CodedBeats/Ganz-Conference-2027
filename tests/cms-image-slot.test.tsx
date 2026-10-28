import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { LibraryFile } from "@/types/cms";

const mocks = vi.hoisted(() => ({ updateCmsRow: vi.fn() }));
vi.mock("@/lib/cms/actions", () => ({ updateCmsRow: mocks.updateCmsRow, undoCmsEdit: vi.fn(), updateFile: vi.fn(), deleteFile: vi.fn() }));
vi.mock("@/lib/cms/uploadFile", () => ({ uploadFile: vi.fn() }));

import { CmsEditorProvider } from "../src/components/cms/CmsEditorProvider";
import { CmsImageSlotClient } from "../src/components/cms/CmsImageSlotClient";
import { CmsBoxClient } from "../src/components/cms/CmsBoxClient";

const PERSON_ID = "6f1c2a8e-4b3d-4e7f-9a2b-1c3d4e5f6a7b";

const FILES: LibraryFile[] = [
    {
        id: "file-ada",
        name: "Ada",
        file_ref: "/design/ada.jpg",
        mime_type: "image/jpeg",
        folder: "keynotes",
        created_at: "",
        updated_at: "",
        usages: [],
    },
];

const SECTION_ID = "0b9d1e2f-3a4b-4c5d-8e6f-7a8b9c0d1e2f";

const GUIDELINES: LibraryFile = {
    id: "file-guidelines",
    name: "Guidelines",
    file_ref: "/design/guidelines.pdf",
    mime_type: "application/pdf",
    folder: "general",
    created_at: "",
    updated_at: "",
    usages: [],
};

const renderSlot = ({ fileId = null as string | null, withPlaceholder = false } = {}) =>
    render(
        <CmsEditorProvider files={FILES}>
            <CmsBoxClient table="people" rowId={PERSON_ID} label="Keynote: Ada" values={{ name: "Ada" }}>
                <CmsImageSlotClient
                    table="people"
                    rowId={PERSON_ID}
                    field="image"
                    fileId={fileId}
                    folder="keynotes"
                    label="Keynote: Ada"
                    placeholder={withPlaceholder ? <span>Placeholder</span> : undefined}
                >
                    <span>Current photo</span>
                </CmsImageSlotClient>
            </CmsBoxClient>
        </CmsEditorProvider>,
    );

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("CmsImageSlotClient", () => {
    it("opens the picker in the slot's folder and saves the chosen image straight away", async () => {
        mocks.updateCmsRow.mockResolvedValue({ data: { id: PERSON_ID }, error: null });
        renderSlot();

        fireEvent.click(screen.getByRole("button", { name: "Change image for Keynote: Ada" }));
        expect(screen.getByRole("dialog", { name: "Choose an image" })).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Ada.jpg" }));
        fireEvent.click(screen.getByRole("button", { name: "Insert image" }));

        await waitFor(() => expect(mocks.updateCmsRow).toHaveBeenCalledWith("people", PERSON_ID, { image: "file-ada" }, "Keynote: Ada image"));
        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });

    it("keeps the picker open with the error when the save fails", async () => {
        const error = { message: "Your session has expired.", hint: null, code: null, codeMeaning: null };
        mocks.updateCmsRow.mockResolvedValue({ data: null, error });
        renderSlot({ fileId: "file-ada" });

        fireEvent.click(screen.getByRole("button", { name: "Change image for Keynote: Ada" }));
        fireEvent.click(screen.getByRole("button", { name: "Remove image" }));

        await waitFor(() => expect(mocks.updateCmsRow).toHaveBeenCalledWith("people", PERSON_ID, { image: null }, "Keynote: Ada image"));
        expect((await screen.findByRole("alert")).textContent).toContain("Your session has expired.");
        expect(screen.getByRole("dialog", { name: "Choose an image" })).toBeTruthy();
    });

    it("waits its turn while the card's text box is open", () => {
        renderSlot();

        fireEvent.click(screen.getByRole("button", { name: "Edit Keynote: Ada" }));
        fireEvent.click(screen.getByRole("button", { name: "Change image for Keynote: Ada" }));

        expect(screen.getByRole("dialog").textContent).toMatch(/Finish your current edit first/);
        expect(screen.queryByRole("dialog", { name: "Choose an image" })).toBeNull();
    });

    it("picks and saves a PDF when it accepts PDFs", async () => {
        mocks.updateCmsRow.mockResolvedValue({ data: { id: SECTION_ID }, error: null });
        render(
            <CmsEditorProvider files={[...FILES, GUIDELINES]}>
                <CmsImageSlotClient
                    table="sections"
                    rowId={SECTION_ID}
                    field="image_id"
                    fileId={null}
                    folder="general"
                    accept="pdf"
                    label="Submission guidelines"
                >
                    <span>Guidelines link</span>
                </CmsImageSlotClient>
            </CmsEditorProvider>,
        );

        fireEvent.click(screen.getByRole("button", { name: "Change PDF for Submission guidelines" }));
        expect(screen.getByRole("dialog", { name: "Choose a PDF" })).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Guidelines.pdf" }));
        fireEvent.click(screen.getByRole("button", { name: "Insert PDF" }));

        await waitFor(() =>
            expect(mocks.updateCmsRow).toHaveBeenCalledWith("sections", SECTION_ID, { image_id: "file-guidelines" }, "Submission guidelines PDF"),
        );
    });

    it("shows its placeholder to editors while empty", () => {
        renderSlot({ withPlaceholder: true });

        expect(screen.getByText("Placeholder")).toBeTruthy();
        expect(screen.queryByText("Current photo")).toBeNull();
    });
});