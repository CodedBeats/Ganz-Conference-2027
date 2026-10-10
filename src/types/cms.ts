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

import type { CmsStyle } from "@/types/content";
import type { Tables, TablesInsert } from "@/types/database";

/**
 * What every CMS action resolves to. Narrow on `error` before touching `data`.
 *
 * @example
 * ```ts
 * const result = await updatePerson(id, { name });
 * if (result.error) return setError(result.error);
 * console.log(result.data.updated_at);
 * ```
 */
export type CmsActionResult<T> = { data: T; error: null } | { data: null; error: string };

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

// ---- images ----

/** `file_ref` is a `/public` path for now - Storage uploads come later. */
export type ImageCreateInput = Pick<TablesInsert<"images">, "name" | "file_ref">;

export type ImageUpdateInput = Partial<ImageCreateInput>;

export type ImageRecord = Tables<"images">;