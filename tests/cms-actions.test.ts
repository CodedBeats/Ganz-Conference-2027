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

import { createPerson, deleteStatItem, updateCmsRow, updateSection } from "../src/lib/cms/actions";

const ROW_ID = "6f1c2a8e-4b3d-4e7f-9a2b-1c3d4e5f6a7b";

const makeUser = (role: string | undefined): Partial<User> => ({ email: "admin@example.com", app_metadata: { role } });

/** A chainable stand-in for the Supabase query builder that resolves `.single()` to `result`. */
const makeSupabase = (result: { data: unknown; error: unknown }) => {
    const builder = {
        insert: vi.fn(() => builder),
        update: vi.fn(() => builder),
        delete: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        select: vi.fn(() => builder),
        single: vi.fn(() => Promise.resolve(result)),
    };
    return { from: vi.fn(() => builder), builder };
};

beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
});

describe("CMS actions - auth", () => {
    it("tells signed-out callers their session expired, without touching the DB", async () => {
        mocks.getCurrentUser.mockResolvedValue(null);

        const result = await updateSection(ROW_ID, { heading: "Hi" });

        expect(result.error?.message).toMatch(/session has expired/);
        expect(result.error?.hint).toMatch(/your changes are still here/);
        expect(mocks.createClient).not.toHaveBeenCalled();
        expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });

    it("rejects signed-in non-admins as a permission problem", async () => {
        mocks.getCurrentUser.mockResolvedValue(makeUser(undefined));

        const result = await updateSection(ROW_ID, { heading: "Hi" });

        expect(result.error?.message).toMatch(/doesn't have permission/);
        expect(mocks.createClient).not.toHaveBeenCalled();
    });
});

describe("CMS actions - as admin", () => {
    beforeEach(() => {
        mocks.getCurrentUser.mockResolvedValue(makeUser("admin"));
    });

    it("updates only the sanitised fields, then revalidates", async () => {
        const row = { id: ROW_ID, heading: "Hi" };
        const supabase = makeSupabase({ data: row, error: null });
        mocks.createClient.mockResolvedValue(supabase);

        const result = await updateSection(ROW_ID, { heading: "  Hi  ", ...{ type: "hero" } });

        expect(result).toEqual({ data: row, error: null });
        expect(supabase.from).toHaveBeenCalledWith("sections");
        expect(supabase.builder.update).toHaveBeenCalledWith({ heading: "Hi" });
        expect(supabase.builder.eq).toHaveBeenCalledWith("id", ROW_ID);
        expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
    });

    it("returns validation errors with a hint, without querying", async () => {
        const supabase = makeSupabase({ data: null, error: null });
        mocks.createClient.mockResolvedValue(supabase);

        const result = await createPerson({ section_id: ROW_ID, name: "" });

        expect(result.error).toEqual({
            message: "Name is required.",
            hint: "Fix the field and save again.",
            code: null,
            codeMeaning: null,
        });
        expect(supabase.from).not.toHaveBeenCalled();
        expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });

    it("rejects malformed ids as not found", async () => {
        const supabase = makeSupabase({ data: null, error: null });
        mocks.createClient.mockResolvedValue(supabase);

        const result = await deleteStatItem("not-a-uuid");

        expect(result.error?.message).toMatch(/couldn't be found/);
        expect(supabase.from).not.toHaveBeenCalled();
    });

    it("maps Supabase errors to explained copy and skips revalidation", async () => {
        const supabase = makeSupabase({
            data: null,
            error: { message: "JSON object requested, multiple (or no) rows returned", code: "PGRST116", details: null, hint: null },
        });
        mocks.createClient.mockResolvedValue(supabase);

        const result = await deleteStatItem(ROW_ID);

        expect(result.error?.message).toMatch(/couldn't be found/);
        expect(result.error?.code).toBe("PGRST116");
        expect(result.error?.codeMeaning).toBeTruthy();
        expect(supabase.builder.delete).toHaveBeenCalled();
        expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });

    it("catches thrown errors", async () => {
        mocks.createClient.mockRejectedValue(new Error("network down"));

        const result = await deleteStatItem(ROW_ID);

        expect(result.error?.message).toBe("Something went wrong. Please try again.");
        expect(result.error?.codeMeaning).toBe("network down");
    });
});

describe("updateCmsRow", () => {
    beforeEach(() => {
        mocks.getCurrentUser.mockResolvedValue(makeUser("admin"));
    });

    it.each([
        ["sections", { heading: "Hi" }],
        ["people", { name: "Ada" }],
        ["stat_items", { value: "" }],
    ] as const)("dispatches %s edits to the matching table", async (table, input) => {
        const supabase = makeSupabase({ data: { id: ROW_ID }, error: null });
        mocks.createClient.mockResolvedValue(supabase);

        const result = await updateCmsRow(table, ROW_ID, input);

        expect(result.error).toBeNull();
        expect(supabase.from).toHaveBeenCalledWith(table);
        expect(supabase.builder.update).toHaveBeenCalledWith(input);
    });

    it("refuses tables the editor can't touch", async () => {
        const supabase = makeSupabase({ data: null, error: null });
        mocks.createClient.mockResolvedValue(supabase);

        // simulates a hand-crafted POST - the type system stops this in app code
        const result = await updateCmsRow(JSON.parse('"images"'), ROW_ID, { name: "x" });

        expect(result.error?.message).toMatch(/couldn't be found/);
        expect(supabase.from).not.toHaveBeenCalled();
    });
});
