import { createClient } from "@/lib/supabase/server";
import { toFileUsages } from "@/lib/cms/files";
import type { LibraryFile } from "@/types/cms";

/**
 * Every file in the library, newest first, each with the rows that use it.
 *
 * @remarks
 * A plain server function rather than a Server Action: call it from a Server Component.
 * Usages come back in the same request by embedding each table that references `files`
 * (reverse foreign keys), so the CMS can show "Used in" without a call per file. Every
 * file and image-slot action revalidates the page, which keeps them fresh.
 *
 * Unpublished sections only show up as usages for admins (RLS) - which is fine, since
 * only the admin file manager calls this.
 *
 * @throws If the Supabase query fails.
 */
export async function getFiles(): Promise<LibraryFile[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("files")
        .select("*, sections(id, type), people(id, name), stat_items(id, label)")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("[getFiles]", error);
        throw new Error(`Failed to load files: ${error.message}`);
    }

    return data.map(({ sections, people, stat_items, ...file }) => ({
        ...file,
        usages: toFileUsages({ sections, people, stat_items }),
    }));
}