import { createClient } from "@/lib/supabase/server";
import type { FileRecord } from "@/types/cms";

/**
 * Every row in the `files` table, newest first - the CMS file library.
 *
 * @remarks
 * A plain server function rather than a Server Action: call it from a Server Component.
 * The table is publicly readable, so this works for any caller. Resolve each `file_ref`
 * to a URL with `getFileUrl` from `src/lib/cms/files.ts`.
 *
 * @throws If the Supabase query fails.
 */
export async function getFiles(): Promise<FileRecord[]> {
    const supabase = await createClient();

    const { data, error } = await supabase.from("files").select().order("created_at", { ascending: false });

    if (error) {
        console.error("[getFiles]", error);
        throw new Error(`Failed to load files: ${error.message}`);
    }

    return data;
}