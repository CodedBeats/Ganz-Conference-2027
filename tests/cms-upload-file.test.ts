import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createFileUpload: vi.fn(),
    createFile: vi.fn(),
    uploadToSignedUrl: vi.fn(),
}));

vi.mock("@/lib/cms/actions", () => ({ createFileUpload: mocks.createFileUpload, createFile: mocks.createFile }));
vi.mock("@/lib/supabase/client", () => ({
    createClient: () => ({ storage: { from: () => ({ uploadToSignedUrl: mocks.uploadToSignedUrl }) } }),
}));

import { uploadFile } from "../src/lib/cms/uploadFile";

const TICKET = { path: "0b8f3c1e-2d4a-4b6c-8e9f-a1b2c3d4e5f6.png", token: "token-123" };
const makeFile = () => new File(["png bytes"], "logo.png", { type: "image/png" });

beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.createFileUpload.mockResolvedValue({ data: TICKET, error: null });
    mocks.uploadToSignedUrl.mockResolvedValue({ data: { path: TICKET.path }, error: null });
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
});

describe("uploadFile", () => {
    it("asks for a ticket, uploads with it, then registers the row", async () => {
        const row = { id: "f1", name: "GANZ logo" };
        mocks.createFile.mockResolvedValue({ data: row, error: null });
        const file = makeFile();

        const result = await uploadFile(file, "GANZ logo");

        expect(result).toEqual({ data: row, error: null });
        expect(mocks.createFileUpload).toHaveBeenCalledWith({ name: "GANZ logo", mimeType: "image/png", size: file.size });
        expect(mocks.uploadToSignedUrl).toHaveBeenCalledWith(TICKET.path, TICKET.token, file);
        expect(mocks.createFile).toHaveBeenCalledWith({ name: "GANZ logo", file_ref: TICKET.path });
    });

    it("defaults the name to the file's own name", async () => {
        mocks.createFile.mockResolvedValue({ data: {}, error: null });

        await uploadFile(makeFile());

        expect(mocks.createFile).toHaveBeenCalledWith({ name: "logo.png", file_ref: TICKET.path });
    });

    it("stops if the ticket is refused", async () => {
        const error = { message: "Only PNG, JPG, WebP and PDF files can be uploaded.", hint: null, code: null, codeMeaning: null };
        mocks.createFileUpload.mockResolvedValue({ data: null, error });

        const result = await uploadFile(makeFile());

        expect(result.error).toBe(error);
        expect(mocks.uploadToSignedUrl).not.toHaveBeenCalled();
        expect(mocks.createFile).not.toHaveBeenCalled();
    });

    // shapes copied from the local Storage API - both arrive as HTTP 400
    it.each([
        ["EntityTooLarge", "The object exceeded the maximum allowed size", /at most 20MB/],
        ["InvalidMimeType", "mime type text/plain is not supported", /Only PNG, JPG, WebP and PDF/],
    ])("explains the bucket's %s rejection, and doesn't register the file", async (code, raw, message) => {
        const error = Object.assign(new Error(raw), { name: "StorageApiError", status: 400, code });
        mocks.uploadToSignedUrl.mockResolvedValue({ data: null, error });

        const result = await uploadFile(makeFile());

        expect(result.error?.message).toMatch(message);
        expect(result.error?.code).toBe(code);
        expect(result.error?.codeMeaning).toBe(raw);
        expect(mocks.createFile).not.toHaveBeenCalled();
    });

    it("catches network failures during the upload", async () => {
        mocks.uploadToSignedUrl.mockRejectedValue(new Error("Failed to fetch"));

        const result = await uploadFile(makeFile());

        expect(result.error?.message).toBe("Something went wrong. Please try again.");
        expect(result.error?.codeMeaning).toBe("Failed to fetch");
    });
});