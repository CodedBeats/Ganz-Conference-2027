import type { CmsEditEntry, CmsRowValues, CmsUndoState } from "@/types/cms";

/** How long an editing session survives without a save or undo. Edits from before such a break can't be undone. */
export const SESSION_IDLE_MINUTES = 10;

const IDLE_MS = SESSION_IDLE_MINUTES * 60_000;

/** The parts of an edit that decide which session it belongs to. */
type SessionEdit = Pick<CmsEditEntry, "createdAt" | "revertedAt">;

/** Friendlier names for columns whose name isn't what an editor would call them. */
const FIELD_LABELS: Record<string, string> = {
    body: "Text",
    excerpt: "Summary",
    image: "Image",
    image_id: "Image",
    sort_order: "Order",
    is_published: "Published",
    parent_id: "Group",
};

/** `null` and `""` both mean "empty" - matches how {@link getChangedFields} compares drafts. */
const normalise = (value: unknown) => value ?? "";

const isSameValue = (a: unknown, b: unknown) => normalise(a) === normalise(b);

/** Narrows a DB value to something an edit snapshot can hold - anything else is recorded as empty. */
const toSnapshotValue = (value: unknown): CmsRowValues[string] =>
    typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? value : null;

/**
 * The before/after snapshot of a save - just the editable fields that actually changed.
 *
 * @remarks
 * Compares the row as read just before the update with the row the update returned, so the
 * snapshot reflects what really landed in the DB (after trimming and `""` → `null`), not what
 * the client sent.
 *
 * @param before - The row before the update.
 * @param after - The row the update returned.
 * @param fields - Columns worth recording, i.e. the table's editable ones.
 * @returns The changed fields on each side, or `null` when nothing changed.
 */
export function getRowChanges(
    before: Readonly<Record<string, unknown>>,
    after: Readonly<Record<string, unknown>>,
    fields: readonly string[],
): { before: CmsRowValues; after: CmsRowValues } | null {
    const changedBefore: CmsRowValues = {};
    const changedAfter: CmsRowValues = {};

    for (const field of fields) {
        if (isSameValue(before[field], after[field])) continue;
        changedBefore[field] = toSnapshotValue(before[field]);
        changedAfter[field] = toSnapshotValue(after[field]);
    }

    return Object.keys(changedAfter).length > 0 ? { before: changedBefore, after: changedAfter } : null;
}

/**
 * Picks out the edits in the current session from a user's recent history.
 *
 * @remarks
 * Every save and every undo counts as activity. Walking back from the newest activity, the
 * session continues while consecutive activities are less than {@link SESSION_IDLE_MINUTES}
 * apart; the first longer gap is where it started. If even the newest activity is that old,
 * there's no live session at all. The undo action applies the same rule, so the panel never
 * offers an undo the server would refuse.
 *
 * @param edits - The user's recent edits, in any order.
 * @param now - The current time.
 * @returns The session's edits (newest first) and when it lapses without more activity.
 */
export function getSessionEdits<T extends SessionEdit>(
    edits: readonly T[],
    now: Date,
): { edits: T[]; expiresAt: string | null } {
    const activity = edits
        .flatMap((edit) => (edit.revertedAt ? [edit.createdAt, edit.revertedAt] : [edit.createdAt]))
        .map((time) => Date.parse(time))
        .sort((a, b) => b - a);

    const latest = activity[0];
    if (latest === undefined || now.getTime() - latest >= IDLE_MS) return { edits: [], expiresAt: null };

    let start = latest;
    for (const time of activity.slice(1)) {
        if (start - time >= IDLE_MS) break;
        start = time;
    }

    return {
        edits: edits
            .filter((edit) => Date.parse(edit.createdAt) >= start)
            .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
        expiresAt: new Date(latest + IDLE_MS).toISOString(),
    };
}

/**
 * Whether an edit can still be undone, given the row as it is now.
 *
 * @remarks
 * Undo writes the edit's `before` values back, so it's only safe while every field still
 * holds the edit's `after` value - otherwise a newer save would be silently overwritten.
 * Undoing that newer edit first puts the field back and makes this one `ready` again.
 *
 * @param edit - The recorded edit.
 * @param current - The row's current values, or `null` if it no longer exists.
 */
export function getUndoState(
    edit: Pick<CmsEditEntry, "after" | "revertedAt">,
    current: Readonly<Record<string, unknown>> | null,
): CmsUndoState {
    if (edit.revertedAt) return "undone";
    if (!current) return "missing";

    const isUnchanged = Object.entries(edit.after).every(([field, value]) => isSameValue(current[field], value));
    return isUnchanged ? "ready" : "stale";
}

/** `sort_order` -> `Order`, `heading` -> `Heading` - how a changed column is named in the panel. */
export function getFieldLabel(field: string): string {
    const label = FIELD_LABELS[field];
    if (label) return label;

    const words = field.replaceAll("_", " ");
    return words.charAt(0).toUpperCase() + words.slice(1);
}