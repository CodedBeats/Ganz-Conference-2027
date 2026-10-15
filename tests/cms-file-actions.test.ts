import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";

const mocks = vi.hoisted(() => ({
    getCurrentUser: vi.fn(),
    createClient: vi.fn(),
    revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/auth", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@/lib/auth")>()),
    getCurrentUser: mocks.getCurrentUser,
}));

import { createFile, createFileUpload, deleteFile, getFileUsages, updateFile } from "../src/lib/cms/actions";

const FILE_ID = "6f1c2a8e-4b3d-4e7f-9a2b-1c3d4e5f6a7b";
const STORAGE_PATH = "0b8f3c1e-2d4a-4b6c-8e9f-a1b2c3d4e5f6.png";

type Result = { data: unknown; error: unknown };

interface FakeSupabaseOptions {
    /** Rows each usage query returns, keyed by table. */
    usages?: Partial<Record<"sections" | "people" | "stat_items", unknown[]>>;
    /** Error returned by every usage query. */
    usageError?: unknown;
    /** What `.single()` resolves to - the files insert/update/delete. */
    single?: Result;
}

/**
 * A stand-in for the Supabase client: `from()` builders resolve to the usage rows when
 * awaited directly and to `single` via `.single()`; `storage.from()` returns `bucket`.
 */
const makeSupabase = ({ usages = {}, usageError = null, single = { data: null, error: null } }: FakeSupabaseOptions = {}) => {
    const builders: Record<string, ReturnType<typeof makeBuilder>> = {};

    function makeBuilder(table: string) {
        const builder = {
            insert: vi.fn(() => builder),
            update: vi.fn(() => builder),
            delete: vi.fn(() => builder),
            select: vi.fn(() => builder),
            eq: vi.fn(() => builder),
            single: vi.fn(() => Promise.resolve(single)),
            then: (resolve: (value: Result) => unknown) =>
                resolve({ data: usageError ? null : (usages[table as keyof typeof usages] ?? []), error: usageError }),
        };
        return builder;
    }

    const bucket = {
        createSignedUploadUrl: vi.fn((path: string) =>
            Promise.resolve({ data: { path, token: "token-123", signedUrl: "https://x" }, error: null }),
        ),
        info: vi.fn(() => Promise.resolve<Result>({ data: { contentType: "image/png" }, error: null })),
        remove: vi.fn(() => Promise.resolve<Result>({ data: [], error: null })),
    };

    return {
        from: vi.fn((table: string) => (builders[table] = makeBuilder(table))),
        storage: { from: vi.fn(() => bucket) },
        builders,
        bucket,
    };
};

const useSupabase = (options?: FakeSupabaseOptions) => {
    const supabase = makeSupabase(options);
    mocks.createClient.mockResolvedValue(supabase);
    return supabase;
};

beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getCurrentUser.mockResolvedValue({ email: "admin@example.com", app_metadata: { role: "admin" } } as Partial<User>);
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
});

describe("createFileUpload", () => {
    it("rejects non-admins before touching storage", async () => {
        mocks.getCurrentUser.mockResolvedValue({ email: "x@example.com", app_metadata: {} });

        const result = await createFileUpload({ name: "Logo", mimeType: "image/png", size: 100 });

        expect(result.error?.message).toMatch(/doesn't have permission/);
        expect(mocks.createClient).not.toHaveBeenCalled();
    });

    it.each([
        [{ name: "Logo", mimeType: "image/svg+xml", size: 100 }, /Only PNG, JPG, WebP and PDF/],
        [{ name: "Logo", mimeType: "image/png", size: 50 * 1024 * 1024 }, /at most 20MB/],
        [{ name: "  ", mimeType: "image/png", size: 100 }, /Name is required/],
    ])("rejects %o without asking storage", async (input, message) => {
        const supabase = useSupabase();

        const result = await createFileUpload(input);

        expect(result.error?.message).toMatch(message);
        expect(supabase.bucket.createSignedUploadUrl).not.toHaveBeenCalled();
    });

    it("hands back a ticket for a fresh, generated path without revalidating", async () => {
        useSupabase();

        const result = await createFileUpload({ name: "Program", mimeType: "application/pdf", size: 100 });

        expect(result.error).toBeNull();
        expect(result.data?.path).toMatch(/^[0-9a-f-]{36}\.pdf$/);
        expect(result.data?.token).toBe("token-123");
        expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });
});

describe("createFile", () => {
    it.each(["/design/imgs/welcome.jpg", "somewhere/else.png"])(
        "refuses to register %s, which wasn't handed out by createFileUpload",
        async (fileRef) => {
            const supabase = useSupabase();

            const result = await createFile({ name: "Logo", file_ref: fileRef });

            expect(result.error?.message).toMatch(/couldn't be found/);
            expect(supabase.bucket.info).not.toHaveBeenCalled();
            expect(supabase.from).not.toHaveBeenCalled();
        },
    );

    it("refuses when the upload never landed", async () => {
        const supabase = useSupabase();
        supabase.bucket.info.mockResolvedValue({ data: null, error: { message: "Object not found", status: 404 } });

        const result = await createFile({ name: "Logo", file_ref: STORAGE_PATH });

        expect(result.error?.message).toMatch(/uploaded file couldn't be found/);
        expect(supabase.from).not.toHaveBeenCalled();
    });

    it("stores the type from the uploaded object, ignoring what the caller sent", async () => {
        const row = { id: FILE_ID, name: "Logo", file_ref: STORAGE_PATH, mime_type: "image/png" };
        const supabase = useSupabase({ single: { data: row, error: null } });

        const result = await createFile({ name: " Logo ", file_ref: STORAGE_PATH, ...{ mime_type: "application/pdf" } });

        expect(result).toEqual({ data: row, error: null });
        expect(supabase.bucket.info).toHaveBeenCalledWith(STORAGE_PATH);
        expect(supabase.builders.files.insert).toHaveBeenCalledWith({
            name: "Logo",
            file_ref: STORAGE_PATH,
            mime_type: "image/png",
        });
        expect(mocks.revalidatePath).toHaveBeenCalled();
    });

    it("refuses objects whose stored type isn't allowed", async () => {
        const supabase = useSupabase();
        supabase.bucket.info.mockResolvedValue({ data: { contentType: "text/html" }, error: null });

        const result = await createFile({ name: "Logo", file_ref: STORAGE_PATH });

        expect(result.error?.message).toMatch(/Only PNG, JPG, WebP and PDF/);
        expect(supabase.from).not.toHaveBeenCalled();
    });
});

describe("updateFile", () => {
    it("only ever changes the name", async () => {
        const supabase = useSupabase({ single: { data: { id: FILE_ID }, error: null } });

        await updateFile(FILE_ID, { name: "New name", ...{ file_ref: "/etc/passwd" } });

        expect(supabase.builders.files.update).toHaveBeenCalledWith({ name: "New name" });
    });

    it("treats a file_ref-only update as nothing to save", async () => {
        const supabase = useSupabase();

        const result = await updateFile(FILE_ID, JSON.parse('{ "file_ref": "x.png" }'));

        expect(result.error?.message).toBe("Nothing to save.");
        expect(supabase.from).not.toHaveBeenCalled();
    });
});

describe("deleteFile", () => {
    it("refuses while the file is in use, naming every place, and deletes nothing", async () => {
        const supabase = useSupabase({
            usages: { people: [{ id: "p1", name: "Michael Clemmens" }], sections: [{ id: "s1", type: "welcome" }] },
        });

        const result = await deleteFile(FILE_ID);

        expect(result.error?.message).toBe(
            'This file is still used in 2 places: Section "welcome", Person "Michael Clemmens".',
        );
        expect(result.error?.hint).toMatch(/swap in a different file/);
        expect(supabase.from).not.toHaveBeenCalledWith("files");
        expect(supabase.bucket.remove).not.toHaveBeenCalled();
        expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });

    it("checks every column that can point at a file", async () => {
        const supabase = useSupabase({ single: { data: { id: FILE_ID, file_ref: STORAGE_PATH }, error: null } });

        await deleteFile(FILE_ID);

        expect(supabase.builders.sections.eq).toHaveBeenCalledWith("image_id", FILE_ID);
        expect(supabase.builders.people.eq).toHaveBeenCalledWith("image", FILE_ID);
        expect(supabase.builders.stat_items.eq).toHaveBeenCalledWith("image", FILE_ID);
    });

    it("deletes the row, then the stored object", async () => {
        const supabase = useSupabase({ single: { data: { id: FILE_ID, file_ref: STORAGE_PATH }, error: null } });

        const result = await deleteFile(FILE_ID);

        expect(result).toEqual({ data: { id: FILE_ID }, error: null });
        expect(supabase.builders.files.delete).toHaveBeenCalled();
        expect(supabase.bucket.remove).toHaveBeenCalledWith([STORAGE_PATH]);
        expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
    });

    it("leaves /public files alone", async () => {
        const supabase = useSupabase({ single: { data: { id: FILE_ID, file_ref: "/design/imgs/welcome.jpg" }, error: null } });

        const result = await deleteFile(FILE_ID);

        expect(result.error).toBeNull();
        expect(supabase.bucket.remove).not.toHaveBeenCalled();
    });

    it("still succeeds if the object can't be removed", async () => {
        const supabase = useSupabase({ single: { data: { id: FILE_ID, file_ref: STORAGE_PATH }, error: null } });
        supabase.bucket.remove.mockResolvedValue({ data: null, error: new Error("storage down") });

        const result = await deleteFile(FILE_ID);

        expect(result).toEqual({ data: { id: FILE_ID }, error: null });
        expect(console.error).toHaveBeenCalled();
    });

    it("maps the database's foreign key error if a reference sneaks in mid-delete", async () => {
        useSupabase({
            single: { data: null, error: { message: "violates foreign key", code: "23503", details: null, hint: null } },
        });

        const result = await deleteFile(FILE_ID);

        expect(result.error?.code).toBe("23503");
        expect(result.error?.message).toMatch(/linked to something else/);
    });

    it("reports failed usage lookups instead of deleting", async () => {
        const supabase = useSupabase({
            usageError: { message: "boom", code: "XX000", details: null, hint: null },
        });

        const result = await deleteFile(FILE_ID);

        expect(result.error?.code).toBe("XX000");
        expect(supabase.from).not.toHaveBeenCalledWith("files");
    });
});

describe("getFileUsages", () => {
    it("lists usages without revalidating", async () => {
        useSupabase({ usages: { stat_items: [{ id: "st1", label: "Days" }] } });

        const result = await getFileUsages(FILE_ID);

        expect(result).toEqual({ data: [{ table: "stat_items", id: "st1", label: "Days" }], error: null });
        expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });

    it("rejects malformed ids as not found", async () => {
        const supabase = useSupabase();

        const result = await getFileUsages("nope");

        expect(result.error?.message).toMatch(/couldn't be found/);
        expect(supabase.from).not.toHaveBeenCalled();
    });
});