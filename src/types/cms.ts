/**
 * Input and result shapes for the admin CMS actions.
 *
 * @remarks
 * Each input is the table's generated `Insert` type narrowed to the columns an editor
 * is allowed to touch - `id`, `created_at` and `updated_at` are never editable, and
 * ownership columns (`type`, `section_id`) are fixed after creation. Runtime enforcement
 * of the same rules lives in `src/lib/cms/fields.ts`.
 *
 * @see {@link sanitizeInput} in `src/lib/cms/fields.ts`
 */

import type { HandledError } from "@/lib/errors";
import type { FileFolder } from "@/lib/cms/files";
import type { CmsStyle } from "@/types/content";
import type { Tables, TablesInsert } from "@/types/database";

/** A failed CMS action - plain-English `message` and `hint`, plus the code and its meaning for a details view. */
export type CmsError = HandledError;

/**
 * What every CMS action resolves to. Narrow on `error` before touching `data`.
 *
 * @example
 * ```ts
 * const result = await updatePerson(id, { name });
 * if (result.error) return showError(result.error);
 * console.log(result.data.updated_at);
 * ```
 */
export type CmsActionResult<T> = { data: T; error: null } | { data: null; error: CmsError };

/** Tables the homepage editor can update in place. Files aren't editable from the page yet. */
export type EditableTable = "sections" | "people" | "stat_items";

/** The editable text-ish fields of one row, keyed by column - what an editor box holds as its draft. */
export type CmsFieldValues = Record<string, string | null>;

/** Returned by every delete action. */
export interface DeletedRow {
    id: string;
}

/** Swaps the DB's free-text `style` column for the known variants. */
type WithStyle<T> = Omit<T, "style"> & { style?: CmsStyle };

// ---- sections ----

export type SectionCreateInput = Pick<
    TablesInsert<"sections">,
    "type" | "heading" | "subheading" | "body" | "excerpt" | "sort_order" | "is_published" | "image_id"
>;

/** `type` is left out - the home page maps sections by it, so changing it would orphan the section. */
export type SectionUpdateInput = Partial<Omit<SectionCreateInput, "type">>;

export type SectionRecord = Tables<"sections">;

// ---- people ----

export type PersonCreateInput = WithStyle<
    Pick<
        TablesInsert<"people">,
        "section_id" | "name" | "title" | "location" | "description" | "link" | "style" | "sort_order" | "image"
    >
>;

export type PersonUpdateInput = Partial<Omit<PersonCreateInput, "section_id">>;

export type PersonRecord = Tables<"people">;

// ---- stat items ----

export type StatItemCreateInput = WithStyle<
    Pick<
        TablesInsert<"stat_items">,
        "section_id" | "label" | "value" | "description" | "style" | "sort_order" | "image" | "parent_id"
    >
>;

export type StatItemUpdateInput = Partial<Omit<StatItemCreateInput, "section_id">>;

export type StatItemRecord = Tables<"stat_items">;

// ---- files ----

/**
 * Registers an object already uploaded to the `files` bucket.
 *
 * @remarks
 * `file_ref` is the storage path handed out by `createFileUpload`. `mime_type` is left out -
 * the server reads it from the stored object rather than trusting the caller.
 */
export type FileCreateInput = Pick<TablesInsert<"files">, "name" | "file_ref"> & { folder?: FileFolder };

/** Rename or move a file. `file_ref` isn't editable - it would let a caller point the row at any path. */
export type FileUpdateInput = Partial<Pick<FileCreateInput, "name" | "folder">>;

export type FileRecord = Tables<"files">;

/** What the browser sends before uploading - checked against the allowed types and size. */
export interface FileUploadRequest {
    name: string;
    mimeType: string;
    size: number;
    /** Checked up front so a bad folder fails before the upload, not after. Defaults to `general`. */
    folder?: FileFolder;
}

/** A one-time permit to upload a single object straight to Storage at `path`. */
export interface FileUploadTicket {
    path: string;
    token: string;
}

/** Content tables whose rows can point at a file. */
export type FileUsageTable = "sections" | "people" | "stat_items";

/** One row that still points at a file - what blocks deleting it. */
export interface FileUsage {
    table: FileUsageTable;
    id: string;
    /** Human-readable name of the row, e.g. a person's name or a section's type. */
    label: string;
}

/** A file plus everywhere it's used - what the CMS file manager lists. */
export type LibraryFile = FileRecord & { usages: FileUsage[] };

// ---- edit history ----

export type CmsEditRecord = Tables<"cms_edits">;

/** Column values as stored in an edit's `before` / `after` snapshot. */
export type CmsRowValues = Record<string, string | number | boolean | null>;

/**
 * Whether a recorded edit can still be undone.
 *
 * - `ready` - the row still holds exactly what this edit saved
 * - `stale` - a later save changed one of its fields again, so undoing would clobber that
 * - `missing` - the row has since been deleted
 * - `undone` - already reverted
 */
export type CmsUndoState = "ready" | "stale" | "missing" | "undone";

/** One inline save, as recorded in `cms_edits` - only the fields that changed. */
export interface CmsEditEntry {
    id: string;
    table: EditableTable;
    rowId: string;
    /** The edited box's human name, e.g. "Keynote: Michael Clemmens". */
    label: string;
    before: CmsRowValues;
    after: CmsRowValues;
    createdAt: string;
    revertedAt: string | null;
}

/** A recorded edit plus whether it can still be undone - one entry in the Recent changes panel. */
export interface CmsEdit extends CmsEditEntry {
    undoState: CmsUndoState;
}

/**
 * The signed-in admin's current editing session.
 *
 * @remarks
 * A session is a run of saves and undos with no gap of `SESSION_IDLE_MINUTES` or more
 * (see `src/lib/cms/editSession.ts`). Only edits inside it can be undone.
 */
export interface CmsEditSession {
    /** Newest first. */
    edits: CmsEdit[];
    /** When the session lapses without further activity - `null` when there's no live session. */
    expiresAt: string | null;
}