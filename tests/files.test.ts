import { afterEach, describe, expect, it, vi } from "vitest";
import {
    MAX_FILE_BYTES,
    buildStoragePath,
    describeFileUsages,
    fileInUseError,
    getFileUrl,
    isGeneratedStoragePath,
    isStorageRef,
    validateUpload,
} from "../src/lib/cms/files";

afterEach(() => {
    vi.unstubAllEnvs();
});

describe("getFileUrl", () => {
    it("passes /public paths through untouched", () => {
        expect(getFileUrl("/design/imgs/Michael Clemons.jpg")).toBe("/design/imgs/Michael Clemons.jpg");
        expect(isStorageRef("/design/imgs/welcome.jpg")).toBe(false);
    });

    it("resolves storage paths to the bucket's public URL on the configured project", () => {
        vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");

        expect(getFileUrl("abc.png")).toBe("http://127.0.0.1:54321/storage/v1/object/public/files/abc.png");
        expect(isStorageRef("abc.png")).toBe(true);
    });
});

describe("validateUpload", () => {
    it("accepts the allowed types up to the size limit", () => {
        expect(validateUpload("image/png", 1)).toEqual({ mimeType: "image/png", error: null });
        expect(validateUpload("application/pdf", MAX_FILE_BYTES)).toEqual({ mimeType: "application/pdf", error: null });
    });

    it.each([
        ["image/svg+xml", 10, /Only PNG, JPG, WebP and PDF/],
        ["text/plain", 10, /Only PNG, JPG, WebP and PDF/],
        ["toString", 10, /Only PNG, JPG, WebP and PDF/],
        ["image/png", 0, /empty/],
        ["image/png", Number.NaN, /empty/],
        ["image/png", MAX_FILE_BYTES + 1, /at most 20MB/],
    ])("rejects %s at %s bytes", (mimeType, size, message) => {
        const result = validateUpload(mimeType, size);
        expect(result.mimeType).toBeNull();
        expect(result.error).toMatch(message);
    });
});

describe("storage paths", () => {
    it("builds a random path with the type's extension that passes the shape check", () => {
        const first = buildStoragePath("image/jpeg");
        const second = buildStoragePath("image/jpeg");

        expect(first).toMatch(/^[0-9a-f-]{36}\.jpg$/);
        expect(first).not.toBe(second);
        expect(isGeneratedStoragePath(first)).toBe(true);
        expect(isGeneratedStoragePath(buildStoragePath("application/pdf"))).toBe(true);
    });

    it.each([
        "/design/imgs/welcome.jpg",
        "other-bucket/6f1c2a8e-4b3d-4e7f-9a2b-1c3d4e5f6a7b.png",
        "6f1c2a8e-4b3d-4e7f-9a2b-1c3d4e5f6a7b.svg",
        "../6f1c2a8e-4b3d-4e7f-9a2b-1c3d4e5f6a7b.png",
        "",
    ])("rejects paths the app didn't hand out: %s", (path) => {
        expect(isGeneratedStoragePath(path)).toBe(false);
    });
});

describe("file in use copy", () => {
    it("lists every place the file is used", () => {
        const usages = [
            { table: "people" as const, id: "1", label: "Michael Clemmens" },
            { table: "sections" as const, id: "2", label: "welcome" },
        ];

        expect(describeFileUsages(usages)).toBe('Person "Michael Clemmens", Section "welcome"');
        expect(fileInUseError(usages)).toEqual({
            message: 'This file is still used in 2 places: Person "Michael Clemmens", Section "welcome".',
            hint: "Remove it from each of these, or swap in a different file, then delete it again.",
            code: null,
            codeMeaning: null,
        });
    });

    it("uses the singular for one place", () => {
        const error = fileInUseError([{ table: "stat_items", id: "1", label: "Days" }]);
        expect(error.message).toBe('This file is still used in 1 place: Stat item "Days".');
    });
});
