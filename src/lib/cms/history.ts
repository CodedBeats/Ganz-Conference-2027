import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { isEditableTable } from "@/lib/cms/fields";
import { getSessionEdits, getUndoState } from "@/lib/cms/editSession";
import type { Json } from "@/types/database";
import type {
    CmsEditEntry,
    CmsEditRecord,
    CmsEditSession,
    CmsRowValues,
    EditableTable,
    PersonRecord,
    SectionRecord,
    StatItemRecord,
} from "@/types/cms";

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** A row of any table the homepage editor writes to. */
export type EditableRecord = SectionRecord | PersonRecord | StatItemRecord;

/** How far back to look for the start of a session - far longer than any realistic editing stretch. */
const HISTORY_LOOKBACK_MS = 24 * 60 * 60_000;
const HISTORY_LIMIT = 200;

const EMPTY_SESSION: CmsEditSession = { edits: [], expiresAt: null };

/** Reads a `before` / `after` jsonb snapshot, dropping anything that isn't a plain column value. */
function toRowValues(json: Json): CmsRowValues {
    if (typeof json !== "object" || json === null || Array.isArray(json)) return {};

    const values: CmsRowValues = {};
    for (const [field, value] of Object.entries(json)) {
        if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
            values[field] = value;
        }
    }
    return values;
}

/** Maps a `cms_edits` row to its camelCase shape - `null` for a table name the editor doesn't know. */
function toEditEntry(row: CmsEditRecord): CmsEditEntry | null {
    if (!isEditableTable(row.table_name)) return null;

    return {
        id: row.id,
        table: row.table_name,
        rowId: row.row_id,
        label: row.label,
        before: toRowValues(row.before),
        after: toRowValues(row.after),
        createdAt: row.created_at,
        revertedAt: row.reverted_at,
    };
}

/**
 * Reads rows of one editable table by id.
 *
 * @remarks
 * Spelt out per table because supabase-js can't type `.from()` over a union of table names.
 * Used both for the panel's undo states and by the CMS actions to snapshot a row before saving.
 */
export function selectEditableRows(supabase: SupabaseServerClient, table: EditableTable, ids: string[]) {
    switch (table) {
        case "sections":
            return supabase.from("sections").select().in("id", ids);
        case "people":
            return supabase.from("people").select().in("id", ids);
        case "stat_items":
            return supabase.from("stat_items").select().in("id", ids);
    }
}

/**
 * The user's edits in their current session.
 *
 * @remarks
 * Shared by the panel loader and `undoCmsEdit`, so both agree on what's still undoable.
 * Filters on `user_id` explicitly - RLS only checks the caller is *an* admin.
 *
 * @throws If the query fails.
 * @see {@link getSessionEdits} for how a session is cut.
 */
export async function fetchSessionEdits(
    supabase: SupabaseServerClient,
    userId: string,
    now: Date = new Date(),
): Promise<{ edits: CmsEditEntry[]; expiresAt: string | null }> {
    const { data, error } = await supabase
        .from("cms_edits")
        .select()
        .eq("user_id", userId)
        .gte("created_at", new Date(now.getTime() - HISTORY_LOOKBACK_MS).toISOString())
        .order("created_at", { ascending: false })
        .limit(HISTORY_LIMIT);

    if (error) throw new Error(`Failed to load edit history: ${error.message}`);

    const entries = data.map(toEditEntry).filter((entry) => entry !== null);
    return getSessionEdits(entries, now);
}

/** Current values of every row the session touched, keyed `table:id`. */
async function fetchCurrentRows(supabase: SupabaseServerClient, edits: CmsEditEntry[]) {
    const idsByTable = new Map<EditableTable, Set<string>>();
    for (const edit of edits) {
        idsByTable.set(edit.table, (idsByTable.get(edit.table) ?? new Set()).add(edit.rowId));
    }

    const rows = new Map<string, EditableRecord>();
    await Promise.all(
        [...idsByTable].map(async ([table, ids]) => {
            const { data, error } = await selectEditableRows(supabase, table, [...ids]);
            if (error) throw new Error(`Failed to load ${table}: ${error.message}`);
            for (const row of data) rows.set(`${table}:${row.id}`, row);
        }),
    );
    return rows;
}

/**
 * The signed-in admin's editing session, for the Recent changes panel.
 *
 * @remarks
 * A plain server function like `getFiles` - call it from a Server Component. Every save and
 * undo revalidates the page, which keeps it fresh without any client-side fetching.
 *
 * History is a convenience, so a failure here (e.g. the `cms_edits` migration not applied yet)
 * is logged and shows an empty panel rather than breaking the page for the editor.
 */
export async function getCmsEditSession(): Promise<CmsEditSession> {
    const user = await getCurrentUser();
    if (!user) return EMPTY_SESSION;

    try {
        const supabase = await createClient();
        const session = await fetchSessionEdits(supabase, user.id);
        const rows = await fetchCurrentRows(supabase, session.edits);

        return {
            expiresAt: session.expiresAt,
            edits: session.edits.map((edit) => ({
                ...edit,
                undoState: getUndoState(edit, rows.get(`${edit.table}:${edit.rowId}`) ?? null),
            })),
        };
    } catch (error) {
        console.error("[getCmsEditSession]", error);
        return EMPTY_SESSION;
    }
}