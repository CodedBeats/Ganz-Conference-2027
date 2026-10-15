/**
 * Shared rules for the `files` table and its Storage bucket.
 *
 * @remarks
 * Safe to import from client and server code - nothing here reads secrets or cookies.
 * The allowed types and size limit are duplicated in the `images_to_files` migration
 * (column check + bucket config), which is what actually enforces them; these copies
 * exist so the CMS can reject a bad file before uploading it.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CmsError, FileUsage, FileUsageTable } from "@/types/cms";
import type { Database } from "@/types/database";

/** The Storage bucket every uploaded file lives in. */
export const FILES_BUCKET = "files";

/** Allowed upload types mapped to the extension their storage path gets. */
export const FILE_MIME_TYPES = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "application/pdf": "pdf",
} as const;

export type FileMimeType = keyof typeof FILE_MIME_TYPES;

/** Folders in the CMS file library, in display order. Matches the `files.folder` check constraint. */
export const FILE_FOLDERS = ["keynotes", "committee", "misc", "general"] as const;

export type FileFolder = (typeof FILE_FOLDERS)[number];

export const FOLDER_LABELS: Record<FileFolder, string> = {
    keynotes: "Keynotes",
    committee: "Committee",
    misc: "Misc",
    general: "General",
};

export function isFileFolder(value: unknown): value is FileFolder {
    return FILE_FOLDERS.some((folder) => folder === value);
}

/** 20MB - matches the bucket's `file_size_limit`. */
export const MAX_FILE_BYTES = 20 * 1024 * 1024;

const STORAGE_PATH_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp|pdf)$/;

export function isFileMimeType(value: unknown): value is FileMimeType {
    return typeof value === "string" && Object.hasOwn(FILE_MIME_TYPES, value);
}

/** Whether a file can go in an image slot - everything allowed except PDFs. */
export function isImageMimeType(mimeType: string): boolean {
    return isFileMimeType(mimeType) && mimeType.startsWith("image/");
}

/**
 * The extension shown after a file's name in the CMS, e.g. `jpg`.
 *
 * @remarks
 * Derived from `mime_type` rather than stored in `name`, so renaming can't break it.
 */
export function getFileExtension(mimeType: string): string {
    return isFileMimeType(mimeType) ? FILE_MIME_TYPES[mimeType] : "";
}

/** `"Team photo.final.jpg"` -> `"Team photo.final"` - the default display name for an upload. */
export function stripExtension(fileName: string): string {
    const dot = fileName.lastIndexOf(".");
    return dot > 0 ? fileName.slice(0, dot) : fileName;
}

/**
 * Whether a `file_ref` points into the Storage bucket.
 *
 * @remarks
 * Legacy rows (the seeded images) hold `/public` paths like `/design/imgs/welcome.jpg`,
 * which always start with `/`. Storage paths never do.
 */
export function isStorageRef(fileRef: string): boolean {
    return !fileRef.startsWith("/");
}

/**
 * The URL a `file_ref` is served from - pass it straight to `<Image src>` or a link.
 *
 * @remarks
 * `/public` paths are returned as-is. Storage paths resolve to the bucket's public URL on
 * whichever Supabase project `NEXT_PUBLIC_SUPABASE_URL` points at, which is why only the
 * path is stored in the DB.
 */
export function getFileUrl(fileRef: string): string {
    if (!isStorageRef(fileRef)) return fileRef;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${FILES_BUCKET}/${encodeURI(fileRef)}`;
}

export type UploadValidation = { mimeType: FileMimeType; error: null } | { mimeType: null; error: string };

/**
 * Checks a file's type and size before asking for an upload slot.
 *
 * @remarks
 * Both values come from the browser, so this is a courtesy check - the bucket enforces
 * the same limits on the real bytes.
 *
 * @returns The narrowed type, or user-facing error copy.
 */
export function validateUpload(mimeType: unknown, size: unknown): UploadValidation {
    const fail = (error: string): UploadValidation => ({ mimeType: null, error });

    if (!isFileMimeType(mimeType)) return fail("Only PNG, JPG, WebP and PDF files can be uploaded.");
    if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) return fail("This file is empty.");
    if (size > MAX_FILE_BYTES) return fail(`Files can be at most ${MAX_FILE_BYTES / 1024 / 1024}MB.`);
    return { mimeType, error: null };
}

/**
 * A fresh, random storage path for an upload of this type, e.g. `3f2c...e1.png`.
 *
 * @remarks
 * Random keys mean two uploads never collide and a replaced file never shows a stale
 * cached copy. The human-readable name lives in the row's `name` column instead.
 */
export function buildStoragePath(mimeType: FileMimeType): string {
    return `${crypto.randomUUID()}.${FILE_MIME_TYPES[mimeType]}`;
}

/**
 * Whether `path` has the shape {@link buildStoragePath} produces.
 *
 * @remarks
 * Stops a caller registering a row against an arbitrary object or a `/public` path -
 * only paths this app handed out can be turned into `files` rows.
 */
export function isGeneratedStoragePath(path: unknown): path is string {
    return typeof path === "string" && STORAGE_PATH_PATTERN.test(path);
}

// ---- usage checks ----

const USAGE_LABELS: Record<FileUsageTable, string> = {
    sections: "Section",
    people: "Person",
    stat_items: "Stat item",
};

/**
 * Every content row that still points at a file.
 *
 * @remarks
 * Covers each foreign key into `files`: `sections.image_id`, `people.image` and
 * `stat_items.image`. Add new referencing columns here too, or `deleteFile` will fall
 * back to the database's less helpful foreign key error. Runs as the caller, so RLS
 * applies - admins see unpublished rows as well.
 *
 * @param supabase - A client for the current request.
 * @param fileId - The `files.id` to look for.
 * @throws If any of the queries fail.
 */
export async function findFileUsages(supabase: SupabaseClient<Database>, fileId: string): Promise<FileUsage[]> {
    const [sections, people, statItems] = await Promise.all([
        supabase.from("sections").select("id, type").eq("image_id", fileId),
        supabase.from("people").select("id, name").eq("image", fileId),
        supabase.from("stat_items").select("id, label").eq("image", fileId),
    ]);

    const error = sections.error ?? people.error ?? statItems.error;
    if (error) throw error;

    return toFileUsages({ sections: sections.data ?? [], people: people.data ?? [], stat_items: statItems.data ?? [] });
}

/** A `files` row with its referencing rows embedded, as `getFiles` selects it. */
export interface FileRowWithReferences {
    sections: { id: string; type: string }[];
    people: { id: string; name: string }[];
    stat_items: { id: string; label: string }[];
}

/** Flattens the embedded references from {@link FileRowWithReferences} into a usage list. */
export function toFileUsages({ sections, people, stat_items }: FileRowWithReferences): FileUsage[] {
    return [
        ...sections.map((row) => ({ table: "sections" as const, id: row.id, label: row.type })),
        ...people.map((row) => ({ table: "people" as const, id: row.id, label: row.name })),
        ...stat_items.map((row) => ({ table: "stat_items" as const, id: row.id, label: row.label })),
    ];
}

/** `Person "Ada"` - one usage, for the file manager's "Used in" list. */
export function describeFileUsage(usage: FileUsage): string {
    return `${USAGE_LABELS[usage.table]} "${usage.label}"`;
}

/** `Person "Ada", Section "welcome"` - for error copy and the CMS delete warning. */
export function describeFileUsages(usages: FileUsage[]): string {
    return usages.map(describeFileUsage).join(", ");
}

/** The error returned when a delete is refused because the file is still in use. */
export function fileInUseError(usages: FileUsage[]): CmsError {
    const places = usages.length === 1 ? "1 place" : `${usages.length} places`;
    return {
        message: `This file is still used in ${places}: ${describeFileUsages(usages)}.`,
        hint: "Remove it from each of these, or swap in a different file, then delete it again.",
        code: null,
        codeMeaning: null,
    };
}