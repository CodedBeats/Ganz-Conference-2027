import { createClient } from "@/lib/supabase/client";
import { createFile, createFileUpload } from "@/lib/cms/actions";
import { FILES_BUCKET, MAX_FILE_BYTES, stripExtension, type FileFolder } from "@/lib/cms/files";
import { handleError } from "@/lib/errors";
import type { CmsActionResult, CmsError, FileRecord } from "@/types/cms";

const UPLOAD_HINT = "Pick a different file, then try again.";

export interface UploadFileOptions {
    /** Library folder to file it under. */
    folder: FileFolder;
    /** Display name. Defaults to the file's own name without its extension. */
    name?: string;
}

/**
 * The Storage API's error code, e.g. `EntityTooLarge`.
 *
 * @remarks
 * Duck-typed because supabase-js doesn't re-export `isStorageError`. Storage answers both
 * rejections below with HTTP 400, so `code` is the only reliable way to tell them apart.
 */
function getStorageCode(error: unknown): string | undefined {
    if (typeof error !== "object" || error === null || !("code" in error)) return undefined;
    return typeof error.code === "string" ? error.code : undefined;
}

/**
 * Friendlier copy for the bucket rejecting the bytes themselves.
 *
 * @remarks
 * Only reachable when the browser misreported the file - honest files are caught earlier
 * by `createFileUpload`.
 */
function toUploadError(error: unknown): CmsError {
    const handled = handleError(error, "cms:uploadFile");
    const code = getStorageCode(error);

    if (code === "EntityTooLarge") {
        return { ...handled, message: `Files can be at most ${MAX_FILE_BYTES / 1024 / 1024}MB.`, hint: UPLOAD_HINT, code };
    }
    if (code === "InvalidMimeType") {
        return { ...handled, message: "Only PNG, JPG, WebP and PDF files can be uploaded.", hint: UPLOAD_HINT, code };
    }
    return handled;
}

/**
 * Uploads a file from the browser and registers it in the `files` table.
 *
 * @remarks
 * Browser-only - runs the three-step flow so callers don't have to:
 * 1. {@link createFileUpload} validates the file and returns a one-time upload token
 * 2. the bytes go straight to Supabase Storage with that token (never through Next,
 *    which keeps large files clear of Vercel's request size cap)
 * 3. {@link createFile} checks the object landed and creates the row
 *
 * If step 3 fails the object is left in the bucket unreferenced - harmless, just unused.
 *
 * @param file - From an `<input type="file">` or a drop event.
 * @param options - Folder and optional display name - see {@link UploadFileOptions}.
 * @returns The new `files` row, or an error ready to show.
 */
export async function uploadFile(
    file: File,
    { folder, name = stripExtension(file.name) }: UploadFileOptions,
): Promise<CmsActionResult<FileRecord>> {
    const ticket = await createFileUpload({ name, folder, mimeType: file.type, size: file.size });
    if (ticket.error) return ticket;

    try {
        // the stored content type comes from `file.type` - the same value createFileUpload checked
        const { error } = await createClient()
            .storage.from(FILES_BUCKET)
            .uploadToSignedUrl(ticket.data.path, ticket.data.token, file);
        if (error) return { data: null, error: toUploadError(error) };
    } catch (error) {
        return { data: null, error: toUploadError(error) };
    }

    return createFile({ name, folder, file_ref: ticket.data.path });
}