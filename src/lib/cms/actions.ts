"use server";

/**
 * Admin CMS mutations - create, update and delete for every content table.
 *
 * @remarks
 * Every export here is a Server Action, callable from client components via `onClick`,
 * `startTransition` or a `useActionState` adapter. Each one checks the caller is an admin,
 * sanitises its input with {@link sanitizeInput}, runs a single query and resolves to a
 * {@link CmsActionResult} - they never throw for expected failures.
 *
 * Only async functions may be exported from a `"use server"` file, and every export becomes
 * a public POST endpoint - keep helpers unexported.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { handleError } from "@/lib/errors";
import {
    IMAGE_CREATE_FIELDS,
    IMAGE_UPDATE_FIELDS,
    PERSON_CREATE_FIELDS,
    PERSON_UPDATE_FIELDS,
    SECTION_CREATE_FIELDS,
    SECTION_UPDATE_FIELDS,
    STAT_ITEM_CREATE_FIELDS,
    STAT_ITEM_UPDATE_FIELDS,
    isValidId,
    sanitizeInput,
} from "@/lib/cms/fields";
import type {
    CmsActionResult,
    CmsError,
    DeletedRow,
    EditableTable,
    ImageCreateInput,
    ImageRecord,
    ImageUpdateInput,
    PersonCreateInput,
    PersonRecord,
    PersonUpdateInput,
    SectionCreateInput,
    SectionRecord,
    SectionUpdateInput,
    StatItemCreateInput,
    StatItemRecord,
    StatItemUpdateInput,
} from "@/types/cms";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** The part of a Supabase query response the wrapper cares about. */
interface QueryResult<T> {
    data: T | null;
    error: unknown;
}

const cmsError = (message: string, hint: string | null): CmsError => ({ message, hint, code: null, codeMeaning: null });

const SIGNED_OUT_ERROR = cmsError(
    "Your session has expired, so you're no longer signed in.",
    "Sign in again in a new tab at /login, then come back to this tab and click save - your changes are still here.",
);
const NO_PERMISSION_ERROR = cmsError(
    "Your account doesn't have permission to change content.",
    "Sign in with the admin account, then try again.",
);
const NOT_FOUND_ERROR = cmsError(
    "This item couldn't be found. It may have been deleted or changed since the page loaded.",
    "Refresh the page to load the latest content, then try again.",
);
const VALIDATION_HINT = "Fix the field and save again.";

/** An expected rejection (bad input, malformed id) - returned as-is and not logged as a server error. */
class CmsRejection extends Error {
    constructor(readonly cmsError: CmsError) {
        super(cmsError.message);
    }
}

const reject = (error: CmsError): QueryResult<never> => ({ data: null, error: new CmsRejection(error) });
const invalid = (message: string) => reject(cmsError(message, VALIDATION_HINT));
const notFound = () => reject(NOT_FOUND_ERROR);

/**
 * Shared admin check, error handling and revalidation for every CMS action.
 *
 * @remarks
 * The admin check runs before anything else so unauthorised callers learn nothing about
 * the payload rules. A missing user is reported as an expired session (the editor UI only
 * renders for admins, so that's the realistic cause) rather than a permission problem.
 * `revalidatePath("/", "layout")` covers both the public page and `/admin` - the site is
 * small enough that a blanket refresh is cheaper than tracking paths.
 *
 * @param context - Action name, used to prefix server logs (e.g. `"updatePerson"`).
 * @param mutate - Runs the query. Return {@link invalid} or {@link notFound} instead to reject the request.
 */
async function runCmsAction<T>(
    context: string,
    mutate: (supabase: SupabaseServerClient) => PromiseLike<QueryResult<T>> | QueryResult<T>,
): Promise<CmsActionResult<T>> {
    const user = await getCurrentUser();
    if (!user) {
        console.warn(`[cms:${context}] rejected anonymous caller`);
        return { data: null, error: SIGNED_OUT_ERROR };
    }
    if (!isAdminUser(user)) {
        console.warn(`[cms:${context}] rejected non-admin caller ${user.email}`);
        return { data: null, error: NO_PERMISSION_ERROR };
    }

    try {
        const supabase = await createClient();
        const { data, error } = await mutate(supabase);

        if (error instanceof CmsRejection) return { data: null, error: error.cmsError };
        if (error) return { data: null, error: handleError(error, `cms:${context}`) };
        // `.single()` always returns a row or an error, but keep the type honest
        if (data === null) return { data: null, error: NOT_FOUND_ERROR };

        console.log(`[cms] ${context} by ${user.email}`);
        revalidatePath("/", "layout");
        return { data, error: null };
    } catch (error) {
        return { data: null, error: handleError(error, `cms:${context}`) };
    }
}

// Update bodies take `unknown` so the typed exports and `updateCmsRow` can share them -
// `sanitizeInput` is what actually enforces the shape.

const updateSectionRow = (id: string, input: unknown) =>
    runCmsAction("updateSection", (supabase) => {
        if (!isValidId(id)) return notFound();
        const { values, error } = sanitizeInput(input, SECTION_UPDATE_FIELDS, { isPartial: true });
        if (error !== null) return invalid(error);
        return supabase.from("sections").update(values).eq("id", id).select().single();
    });

const updatePersonRow = (id: string, input: unknown) =>
    runCmsAction("updatePerson", (supabase) => {
        if (!isValidId(id)) return notFound();
        const { values, error } = sanitizeInput(input, PERSON_UPDATE_FIELDS, { isPartial: true });
        if (error !== null) return invalid(error);
        return supabase.from("people").update(values).eq("id", id).select().single();
    });

const updateStatItemRow = (id: string, input: unknown) =>
    runCmsAction("updateStatItem", (supabase) => {
        if (!isValidId(id)) return notFound();
        const { values, error } = sanitizeInput(input, STAT_ITEM_UPDATE_FIELDS, { isPartial: true });
        if (error !== null) return invalid(error);
        return supabase.from("stat_items").update(values).eq("id", id).select().single();
    });

// ---- homepage editor ----

/**
 * Saves an edit from the homepage editor - the single entry point `CmsBoxClient` calls.
 *
 * @remarks
 * The editor box only knows its table name and a loose `{ column: value }` draft, so this
 * dispatches to the matching update. Unknown columns are dropped by {@link sanitizeInput}
 * exactly as they are for the typed actions.
 *
 * @param table - Which table the edited row lives in.
 * @param id - The row's id.
 * @param input - Only the fields that changed.
 */
export async function updateCmsRow(
    table: EditableTable,
    id: string,
    input: unknown,
): Promise<CmsActionResult<SectionRecord | PersonRecord | StatItemRecord>> {
    switch (table) {
        case "sections":
            return updateSectionRow(id, input);
        case "people":
            return updatePersonRow(id, input);
        case "stat_items":
            return updateStatItemRow(id, input);
        default:
            return { data: null, error: NOT_FOUND_ERROR };
    }
}

// ---- sections ----

/**
 * Creates a section.
 *
 * @remarks
 * `type` must be unique and one of `SECTION_TYPES` for the home page to render it -
 * unknown types are stored but skipped by `getPageContent`.
 */
export async function createSection(input: SectionCreateInput): Promise<CmsActionResult<SectionRecord>> {
    return runCmsAction("createSection", (supabase) => {
        const { values, error } = sanitizeInput(input, SECTION_CREATE_FIELDS, { isPartial: false });
        if (error !== null) return invalid(error);
        return supabase.from("sections").insert(values).select().single();
    });
}

/** Updates a section's copy, order, publish state or header image. Only the keys passed are changed. */
export async function updateSection(id: string, input: SectionUpdateInput): Promise<CmsActionResult<SectionRecord>> {
    return updateSectionRow(id, input);
}

/**
 * Deletes a section.
 *
 * @remarks
 * Its stat items are deleted with it (cascade), but the delete is blocked while any people
 * still belong to it - move or delete them first. Prefer `updateSection(id, { is_published: false })`
 * to hide a section without losing its content.
 */
export async function deleteSection(id: string): Promise<CmsActionResult<DeletedRow>> {
    return runCmsAction("deleteSection", (supabase) => {
        if (!isValidId(id)) return notFound();
        return supabase.from("sections").delete().eq("id", id).select("id").single();
    });
}

// ---- people ----

/** Adds a keynote presenter or committee member to the section given by `section_id`. */
export async function createPerson(input: PersonCreateInput): Promise<CmsActionResult<PersonRecord>> {
    return runCmsAction("createPerson", (supabase) => {
        const { values, error } = sanitizeInput(input, PERSON_CREATE_FIELDS, { isPartial: false });
        if (error !== null) return invalid(error);
        return supabase.from("people").insert(values).select().single();
    });
}

/**
 * Updates a person. Only the keys passed are changed.
 *
 * @remarks
 * `image` is unique across people - pointing two people at the same image row fails.
 */
export async function updatePerson(id: string, input: PersonUpdateInput): Promise<CmsActionResult<PersonRecord>> {
    return updatePersonRow(id, input);
}

/** Deletes a person. Their image row is kept - delete it separately with {@link deleteImage}. */
export async function deletePerson(id: string): Promise<CmsActionResult<DeletedRow>> {
    return runCmsAction("deletePerson", (supabase) => {
        if (!isValidId(id)) return notFound();
        return supabase.from("people").delete().eq("id", id).select("id").single();
    });
}

// ---- stat items ----

/**
 * Adds a stat item (stat card, FAQ, price row, etc.) to the section given by `section_id`.
 *
 * @remarks
 * Set `parent_id` to nest it under another item (e.g. a price row under a registration tier).
 */
export async function createStatItem(input: StatItemCreateInput): Promise<CmsActionResult<StatItemRecord>> {
    return runCmsAction("createStatItem", (supabase) => {
        const { values, error } = sanitizeInput(input, STAT_ITEM_CREATE_FIELDS, { isPartial: false });
        if (error !== null) return invalid(error);
        return supabase.from("stat_items").insert(values).select().single();
    });
}

/** Updates a stat item. Only the keys passed are changed. */
export async function updateStatItem(id: string, input: StatItemUpdateInput): Promise<CmsActionResult<StatItemRecord>> {
    return updateStatItemRow(id, input);
}

/**
 * Deletes a stat item.
 *
 * @remarks
 * Its children go with it (cascade) - deleting a registration tier removes its price rows.
 */
export async function deleteStatItem(id: string): Promise<CmsActionResult<DeletedRow>> {
    return runCmsAction("deleteStatItem", (supabase) => {
        if (!isValidId(id)) return notFound();
        return supabase.from("stat_items").delete().eq("id", id).select("id").single();
    });
}

// ---- images ----

/** Registers an image. `file_ref` is a `/public` path for now - this doesn't upload anything. */
export async function createImage(input: ImageCreateInput): Promise<CmsActionResult<ImageRecord>> {
    return runCmsAction("createImage", (supabase) => {
        const { values, error } = sanitizeInput(input, IMAGE_CREATE_FIELDS, { isPartial: false });
        if (error !== null) return invalid(error);
        return supabase.from("images").insert(values).select().single();
    });
}

/** Renames an image or points it at a different file. Only the keys passed are changed. */
export async function updateImage(id: string, input: ImageUpdateInput): Promise<CmsActionResult<ImageRecord>> {
    return runCmsAction("updateImage", (supabase) => {
        if (!isValidId(id)) return notFound();
        const { values, error } = sanitizeInput(input, IMAGE_UPDATE_FIELDS, { isPartial: true });
        if (error !== null) return invalid(error);
        return supabase.from("images").update(values).eq("id", id).select().single();
    });
}

/**
 * Deletes an image row.
 *
 * @remarks
 * Sections using it as a header lose their image (`image_id` is set to null), but the delete
 * is blocked while any person or stat item still uses it. The file itself isn't touched.
 */
export async function deleteImage(id: string): Promise<CmsActionResult<DeletedRow>> {
    return runCmsAction("deleteImage", (supabase) => {
        if (!isValidId(id)) return notFound();
        return supabase.from("images").delete().eq("id", id).select("id").single();
    });
}