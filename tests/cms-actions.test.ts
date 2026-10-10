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

import { createPerson, deleteStatItem, updateSection } from "../src/lib/cms/actions";

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
    it.each([
        ["anonymous", null],
        ["non-admin", makeUser(undefined)],
    ])("rejects %s callers without touching the DB", async (_label, user) => {
        mocks.getCurrentUser.mockResolvedValue(user);

        const result = await updateSection(ROW_ID, { heading: "Hi" });

        expect(result).toEqual({ data: null, error: "You don't have permission to do that." });
        expect(mocks.createClient).not.toHaveBeenCalled();
        expect(mocks.revalidatePath).not.toHaveBeenCalled();
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

    it("returns validation errors without querying", async () => {
        const supabase = makeSupabase({ data: null, error: null });
        mocks.createClient.mockResolvedValue(supabase);

        const result = await createPerson({ section_id: ROW_ID, name: "" });

        expect(result).toEqual({ data: null, error: "Name is required." });
        expect(supabase.from).not.toHaveBeenCalled();
        expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });

    it("rejects malformed ids as not found", async () => {
        const supabase = makeSupabase({ data: null, error: null });
        mocks.createClient.mockResolvedValue(supabase);

        const result = await deleteStatItem("not-a-uuid");

        expect(result).toEqual({ data: null, error: "That item couldn't be found." });
        expect(supabase.from).not.toHaveBeenCalled();
    });

    it("maps Supabase errors to friendly copy and skips revalidation", async () => {
        const supabase = makeSupabase({
            data: null,
            error: { message: "JSON object requested, multiple (or no) rows returned", code: "PGRST116", details: null, hint: null },
        });
        mocks.createClient.mockResolvedValue(supabase);

        const result = await deleteStatItem(ROW_ID);

        expect(result).toEqual({ data: null, error: "That item couldn't be found." });
        expect(supabase.builder.delete).toHaveBeenCalled();
        expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });

    it("catches thrown errors", async () => {
        mocks.createClient.mockRejectedValue(new Error("network down"));

        const result = await deleteStatItem(ROW_ID);

        expect(result).toEqual({ data: null, error: "Something went wrong. Please try again." });
    });
});