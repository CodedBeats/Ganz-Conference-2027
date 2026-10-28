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

import { createPerson, deleteStatItem, undoCmsEdit, updateCmsRow, updateSection } from "../src/lib/cms/actions";

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

type QueryOp = "select" | "insert" | "update";
type Responses = Record<string, Partial<Record<QueryOp, { data: unknown; error: unknown }>>>;

/**
 * A Supabase stand-in that answers per table and operation, for actions that run several
 * queries. Every builder is awaitable and records what was written and filtered on.
 */
const makeTableSupabase = (responses: Responses) => {
    const writes: { table: string; op: QueryOp; payload: unknown }[] = [];
    const filters: { table: string; column: string; value: unknown }[] = [];

    const from = vi.fn((table: string) => {
        let op: QueryOp = "select";
        const result = () => Promise.resolve(responses[table]?.[op] ?? { data: null, error: null });
        const write = (nextOp: QueryOp) => (payload: unknown) => {
            op = nextOp;
            writes.push({ table, op, payload });
            return builder;
        };
        const filter = (column: string, value: unknown) => {
            filters.push({ table, column, value });
            return builder;
        };
        const builder = {
            select: () => builder,
            insert: write("insert"),
            update: write("update"),
            eq: filter,
            in: filter,
            gte: () => builder,
            order: () => builder,
            limit: () => builder,
            single: result,
            then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => result().then(resolve, reject),
        };
        return builder;
    });

    return { from, writes, filters };
};

const USER_ID = "0d4c1b2a-3e5f-4a6b-9c7d-8e9f0a1b2c3d";
const EDIT_ID = "1e5d2c3b-4f6a-4b7c-8d9e-0f1a2b3c4d5e";

const makeAdmin = (): Partial<User> => ({ ...makeUser("admin"), id: USER_ID });

/** ISO time `minutes` ago. */
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

describe("updateCmsRow", () => {
    beforeEach(() => {
        mocks.getCurrentUser.mockResolvedValue(makeAdmin());
    });

    it.each([
        ["sections", { heading: "Hi" }],
        ["people", { name: "Ada" }],
        ["stat_items", { value: "" }],
    ] as const)("dispatches %s edits to the matching table", async (table, input) => {
        const supabase = makeTableSupabase({
            [table]: { select: { data: [{ id: ROW_ID }], error: null }, update: { data: { id: ROW_ID }, error: null } },
        });
        mocks.createClient.mockResolvedValue(supabase);

        const result = await updateCmsRow(table, ROW_ID, input);

        expect(result.error).toBeNull();
        expect(supabase.writes).toContainEqual({ table, op: "update", payload: input });
    });

    it("records only the fields that changed, with the box label", async () => {
        const supabase = makeTableSupabase({
            sections: {
                select: { data: [{ id: ROW_ID, heading: "Old", body: "Same" }], error: null },
                update: { data: { id: ROW_ID, heading: "New", body: "Same" }, error: null },
            },
            cms_edits: { insert: { data: null, error: null } },
        });
        mocks.createClient.mockResolvedValue(supabase);

        const result = await updateCmsRow("sections", ROW_ID, { heading: "New", body: "Same" }, "Hero section");

        expect(result.error).toBeNull();
        expect(supabase.writes).toContainEqual({
            table: "cms_edits",
            op: "insert",
            payload: {
                user_id: USER_ID,
                table_name: "sections",
                row_id: ROW_ID,
                label: "Hero section",
                before: { heading: "Old" },
                after: { heading: "New" },
            },
        });
    });

    it("records nothing when the save didn't change anything", async () => {
        const row = { id: ROW_ID, heading: "Same" };
        const supabase = makeTableSupabase({
            sections: { select: { data: [row], error: null }, update: { data: row, error: null } },
        });
        mocks.createClient.mockResolvedValue(supabase);

        await updateCmsRow("sections", ROW_ID, { heading: "Same" });

        expect(supabase.writes.some((write) => write.table === "cms_edits")).toBe(false);
    });

    it("still reports the save as successful when recording history fails", async () => {
        const supabase = makeTableSupabase({
            sections: {
                select: { data: [{ id: ROW_ID, heading: "Old" }], error: null },
                update: { data: { id: ROW_ID, heading: "New" }, error: null },
            },
            cms_edits: { insert: { data: null, error: { message: "relation does not exist" } } },
        });
        mocks.createClient.mockResolvedValue(supabase);

        const result = await updateCmsRow("sections", ROW_ID, { heading: "New" });

        expect(result.error).toBeNull();
        expect(console.error).toHaveBeenCalled();
        expect(mocks.revalidatePath).toHaveBeenCalled();
    });

    it("reports a row that no longer exists without updating", async () => {
        const supabase = makeTableSupabase({ people: { select: { data: [], error: null } } });
        mocks.createClient.mockResolvedValue(supabase);

        const result = await updateCmsRow("people", ROW_ID, { name: "Ada" });

        expect(result.error?.message).toMatch(/couldn't be found/);
        expect(supabase.writes).toEqual([]);
    });

    it("refuses tables the editor can't touch", async () => {
        const supabase = makeTableSupabase({});
        mocks.createClient.mockResolvedValue(supabase);

        // simulates a hand-crafted POST - the type system stops this in app code
        const result = await updateCmsRow(JSON.parse('"files"'), ROW_ID, { name: "x" });

        expect(result.error?.message).toMatch(/couldn't be found/);
        expect(supabase.from).not.toHaveBeenCalled();
    });
});

describe("undoCmsEdit", () => {
    const editRow = (overrides: Record<string, unknown> = {}) => ({
        id: EDIT_ID,
        user_id: USER_ID,
        table_name: "sections",
        row_id: ROW_ID,
        label: "Hero section",
        before: { heading: "Old" },
        after: { heading: "New" },
        created_at: minutesAgo(2),
        reverted_at: null,
        ...overrides,
    });

    /** History holding `edit`, and the edited section currently reading `heading`. */
    const setup = (edit: Record<string, unknown> | null, heading: string) => {
        const supabase = makeTableSupabase({
            cms_edits: {
                select: { data: edit ? [edit] : [], error: null },
                update: { data: { ...edit, reverted_at: minutesAgo(0) }, error: null },
            },
            sections: {
                select: { data: [{ id: ROW_ID, heading }], error: null },
                update: { data: { id: ROW_ID, heading: "Old" }, error: null },
            },
        });
        mocks.createClient.mockResolvedValue(supabase);
        return supabase;
    };

    beforeEach(() => {
        mocks.getCurrentUser.mockResolvedValue(makeAdmin());
    });

    it("writes the old values back and marks the edit undone", async () => {
        const supabase = setup(editRow(), "New");

        const result = await undoCmsEdit(EDIT_ID);

        expect(result.error).toBeNull();
        expect(supabase.writes).toContainEqual({ table: "sections", op: "update", payload: { heading: "Old" } });
        expect(supabase.writes).toContainEqual({
            table: "cms_edits",
            op: "update",
            payload: { reverted_at: expect.any(String) },
        });
        expect(supabase.filters).toContainEqual({ table: "cms_edits", column: "user_id", value: USER_ID });
        expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
    });

    it("refuses when the field was changed again since", async () => {
        const supabase = setup(editRow(), "Newer");

        const result = await undoCmsEdit(EDIT_ID);

        expect(result.error?.message).toMatch(/changed again/);
        expect(supabase.writes).toEqual([]);
    });

    it("refuses edits from before a 10-minute break", async () => {
        const supabase = setup(editRow({ created_at: minutesAgo(12) }), "New");

        const result = await undoCmsEdit(EDIT_ID);

        expect(result.error?.message).toMatch(/too old/);
        expect(supabase.writes).toEqual([]);
    });

    it("refuses edits that aren't in the caller's history", async () => {
        const supabase = setup(null, "New");

        const result = await undoCmsEdit(EDIT_ID);

        expect(result.error?.message).toMatch(/too old/);
        expect(supabase.writes).toEqual([]);
    });

    it("refuses an edit that's already been undone", async () => {
        const supabase = setup(editRow({ reverted_at: minutesAgo(1) }), "Old");

        const result = await undoCmsEdit(EDIT_ID);

        expect(result.error?.message).toMatch(/already been undone/);
        expect(supabase.writes).toEqual([]);
    });
});
