import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { LibraryFile } from "@/types/cms";

const mocks = vi.hoisted(() => ({
    updateFile: vi.fn(),
    deleteFile: vi.fn(),
    uploadFile: vi.fn(),
}));
vi.mock("@/lib/cms/actions", () => ({ updateFile: mocks.updateFile, deleteFile: mocks.deleteFile }));
vi.mock("@/lib/cms/uploadFile", () => ({ uploadFile: mocks.uploadFile }));

import { FileManager, type FilePicker } from "../src/components/files/FileManager";

const makeFile = (overrides: Partial<LibraryFile> & Pick<LibraryFile, "id" | "name">): LibraryFile => ({
    file_ref: `/design/${overrides.id}.jpg`,
    mime_type: "image/jpeg",
    folder: "general",
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
    usages: [],
    ...overrides,
});

const MICHAEL = makeFile({
    id: "file-michael",
    name: "Michael Clemmens",
    folder: "keynotes",
    usages: [{ table: "people", id: "p1", label: "Michael Clemmens" }],
});
const SPARE = makeFile({ id: "file-spare", name: "Spare photo", folder: "keynotes", mime_type: "image/png" });
const PROGRAM = makeFile({ id: "file-program", name: "Program", file_ref: "/design/program.pdf", mime_type: "application/pdf" });
const FILES = [MICHAEL, SPARE, PROGRAM];

const ok = (data: unknown) => ({ data, error: null });

const openFolder = (label: string) => fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${label}`) }));
const selectFile = (name: string) => fireEvent.click(screen.getByRole("button", { name: new RegExp(name) }));

beforeEach(() => {
    mocks.updateFile.mockResolvedValue(ok({}));
    mocks.deleteFile.mockResolvedValue(ok({ id: "x" }));
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("FileManager - browsing", () => {
    it("starts at the four folders with their file counts", () => {
        render(<FileManager files={FILES} />);

        const list = screen.getByRole("list", { name: "Files" });
        const rows = within(list).getAllByRole("button").map((row) => row.textContent);
        expect(rows).toEqual(["Keynotes2 files", "Committee0 files", "Misc0 files", "General1 file"]);
    });

    it("opens a folder to list its files with their extensions, and goes back", () => {
        render(<FileManager files={FILES} />);

        openFolder("Keynotes");

        expect(screen.getByRole("button", { name: "Michael Clemmens.jpg" })).toBeTruthy();
        expect(screen.getByRole("button", { name: "Spare photo.png" })).toBeTruthy();
        expect(screen.queryByText(/Program/)).toBeNull();

        fireEvent.click(screen.getByRole("button", { name: "All folders" }));
        expect(screen.getByRole("button", { name: /^Committee/ })).toBeTruthy();
    });

    it("shows the selected file's name, folder and where it's used", () => {
        render(<FileManager files={FILES} />);
        openFolder("Keynotes");
        selectFile("Michael Clemmens");

        expect(screen.getByLabelText<HTMLInputElement>("Name").value).toBe("Michael Clemmens");
        expect(screen.getByLabelText<HTMLSelectElement>("Folder").value).toBe("keynotes");
        expect(screen.getByText('Person "Michael Clemmens"')).toBeTruthy();
    });
});

describe("FileManager - editing", () => {
    it("renames on blur, trimmed, and skips unchanged names", async () => {
        render(<FileManager files={FILES} />);
        openFolder("Keynotes");
        selectFile("Spare photo");
        const input = screen.getByLabelText("Name");

        fireEvent.blur(input);
        expect(mocks.updateFile).not.toHaveBeenCalled();

        fireEvent.change(input, { target: { value: "  Headshot  " } });
        fireEvent.blur(input);

        await waitFor(() => expect(mocks.updateFile).toHaveBeenCalledWith("file-spare", { name: "Headshot" }));
        expect(await screen.findByText("Saved")).toBeTruthy();
    });

    it("moves a file and follows it into the new folder", async () => {
        render(<FileManager files={FILES} />);
        openFolder("Keynotes");
        selectFile("Spare photo");

        fireEvent.change(screen.getByLabelText("Folder"), { target: { value: "misc" } });

        await waitFor(() => expect(mocks.updateFile).toHaveBeenCalledWith("file-spare", { folder: "misc" }));
        await waitFor(() => expect(screen.getByRole("navigation", { name: "Breadcrumb" }).textContent).toContain("Misc"));
    });

    it("explains why an in-use file can't be deleted, without offering Delete", () => {
        render(<FileManager files={FILES} />);
        openFolder("Keynotes");
        selectFile("Michael Clemmens");

        fireEvent.click(screen.getByRole("button", { name: "Delete" }));

        const dialog = screen.getByRole("dialog");
        expect(within(dialog).getByText(/still used in 1 place: Person "Michael Clemmens"/)).toBeTruthy();
        expect(within(dialog).queryByRole("button", { name: "Delete" })).toBeNull();
        expect(mocks.deleteFile).not.toHaveBeenCalled();
    });

    it("deletes an unused file once confirmed", async () => {
        render(<FileManager files={FILES} />);
        openFolder("Keynotes");
        selectFile("Spare photo");

        fireEvent.click(screen.getByRole("button", { name: "Delete" }));
        const dialog = screen.getByRole("dialog");
        expect(within(dialog).getByText(/Delete .Spare photo.png.\?/)).toBeTruthy();
        fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

        await waitFor(() => expect(mocks.deleteFile).toHaveBeenCalledWith("file-spare"));
    });
});

describe("FileManager - uploading", () => {
    it("uploads several files one after another into the chosen folder, listing failures", async () => {
        const failure = { message: "Files can be at most 20MB.", hint: null, code: null, codeMeaning: null };
        mocks.uploadFile.mockResolvedValueOnce(ok({ id: "new-1" })).mockResolvedValueOnce({ data: null, error: failure });
        render(<FileManager files={FILES} />);
        openFolder("Committee");

        const first = new File(["a"], "ada.jpg", { type: "image/jpeg" });
        const second = new File(["b"], "huge.png", { type: "image/png" });
        fireEvent.change(screen.getByTestId("file-upload-input"), { target: { files: [first, second] } });

        await waitFor(() => expect(mocks.uploadFile).toHaveBeenCalledTimes(2));
        expect(mocks.uploadFile).toHaveBeenNthCalledWith(1, first, { folder: "committee" });
        expect(mocks.uploadFile).toHaveBeenNthCalledWith(2, second, { folder: "committee" });

        const alert = await screen.findByRole("alert");
        expect(alert.textContent).toContain("1 file didn't upload");
        expect(alert.textContent).toContain("huge.png");
        expect(alert.textContent).toContain("at most 20MB");
    });
});

describe("FileManager - picking an image for a slot", () => {
    const makePicker = (overrides: Partial<FilePicker> = {}): FilePicker => ({
        currentFileId: MICHAEL.id,
        initialFolder: "keynotes",
        onInsert: vi.fn(),
        onRemove: vi.fn(),
        isSaving: false,
        error: null,
        ...overrides,
    });

    it("opens in the slot's folder with its current image selected and marked", () => {
        render(<FileManager files={FILES} picker={makePicker()} />);

        expect(screen.getByRole("button", { name: /Michael Clemmens\.jpg.*In this slot/ })).toBeTruthy();
        expect(screen.getByRole<HTMLButtonElement>("button", { name: "Already in use here" }).disabled).toBe(true);
    });

    it("inserts another image", () => {
        const picker = makePicker();
        render(<FileManager files={FILES} picker={picker} />);

        selectFile("Spare photo");
        fireEvent.click(screen.getByRole("button", { name: "Insert image" }));

        expect(picker.onInsert).toHaveBeenCalledWith(SPARE);
    });

    it("won't insert a PDF", () => {
        render(<FileManager files={FILES} picker={makePicker({ initialFolder: "general" })} />);

        selectFile("Program");

        expect(screen.getByRole<HTMLButtonElement>("button", { name: "PDFs can't go here" }).disabled).toBe(true);
    });

    it("removes the current image, and only offers that when there is one", () => {
        const picker = makePicker();
        const { rerender } = render(<FileManager files={FILES} picker={picker} />);

        fireEvent.click(screen.getByRole("button", { name: "Remove image" }));
        expect(picker.onRemove).toHaveBeenCalled();

        rerender(<FileManager files={FILES} picker={makePicker({ currentFileId: null })} />);
        expect(screen.queryByRole("button", { name: "Remove image" })).toBeNull();
    });

    it("shows a failed insert's error", () => {
        const error = { message: "Your session has expired.", hint: "Sign in again.", code: null, codeMeaning: null };
        render(<FileManager files={FILES} picker={makePicker({ error })} />);

        expect(screen.getByRole("alert").textContent).toContain("Your session has expired.");
    });
});