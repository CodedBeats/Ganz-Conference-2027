import { CMS_STYLES } from "@/types/content";
import type {
    ImageCreateInput,
    ImageUpdateInput,
    PersonCreateInput,
    PersonUpdateInput,
    SectionCreateInput,
    SectionUpdateInput,
    StatItemCreateInput,
    StatItemUpdateInput,
} from "@/types/cms";

/**
 * How a single editable column is validated and normalised.
 *
 * - `text` - required, trimmed, must not be empty
 * - `nullableText` - trimmed; `""` becomes `null` so a cleared form field clears the column
 * - `integer` - a whole number (e.g. `sort_order`)
 * - `boolean` - `true` / `false`
 * - `style` - one of {@link CMS_STYLES}
 * - `id` - required uuid (a foreign key that must be set)
 * - `nullableId` - uuid or `null`; `""` becomes `null`
 */
export type FieldKind = "text" | "nullableText" | "integer" | "boolean" | "style" | "id" | "nullableId";

/** Every key of an input type mapped to how it's validated. Keys not listed here never reach the DB. */
export type FieldSchema<T> = { readonly [K in keyof T]-?: FieldKind };

export type SanitizeResult<T> = { values: T; error: null } | { values: null; error: string };

interface SanitizeOptions {
    /** Updates send only the fields that changed - missing keys are skipped instead of rejected. */
    isPartial: boolean;
}

/** Kinds that must be present on create. Everything else falls back to the column's DB default. */
const REQUIRED_KINDS: ReadonlySet<FieldKind> = new Set(["text", "id"]);

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Whether `value` is a uuid - used for the row `id` passed to update and delete actions. */
export function isValidId(value: unknown): value is string {
    return typeof value === "string" && UUID_PATTERN.test(value);
}

/** `file_ref` -> `File ref`, for error copy. */
function toLabel(key: string): string {
    const words = key.replaceAll("_", " ");
    return words.charAt(0).toUpperCase() + words.slice(1);
}

type FieldResult = { value: unknown; error: null } | { value: null; error: string };

/** Validates and normalises one value against its {@link FieldKind}. */
function sanitizeField(value: unknown, kind: FieldKind, label: string): FieldResult {
    const ok = (normalised: unknown): FieldResult => ({ value: normalised, error: null });
    const fail = (message: string): FieldResult => ({ value: null, error: message });

    switch (kind) {
        case "text": {
            if (typeof value !== "string") return fail(`${label} must be text.`);
            const trimmed = value.trim();
            return trimmed ? ok(trimmed) : fail(`${label} is required.`);
        }
        case "nullableText": {
            if (value === null) return ok(null);
            if (typeof value !== "string") return fail(`${label} must be text.`);
            return ok(value.trim() || null);
        }
        case "integer":
            return Number.isInteger(value) ? ok(value) : fail(`${label} must be a whole number.`);
        case "boolean":
            return typeof value === "boolean" ? ok(value) : fail(`${label} must be true or false.`);
        case "style":
            return CMS_STYLES.some((style) => style === value)
                ? ok(value)
                : fail(`${label} must be one of: ${CMS_STYLES.join(", ")}.`);
        case "id":
            return isValidId(value) ? ok(value) : fail(`${label} is missing or invalid.`);
        case "nullableId":
            if (value === null || value === "") return ok(null);
            return isValidId(value) ? ok(value) : fail(`${label} is invalid.`);
    }
}

/**
 * Strips an untrusted action payload down to its editable columns and validates each one.
 *
 * @remarks
 * Server Actions are reachable by a direct POST with any payload, so the TypeScript input
 * types alone don't protect the DB. Unknown keys (including `id`, `created_at`, ownership
 * columns on update) are dropped silently; known keys are validated and normalised per
 * their {@link FieldKind}. The first failing field wins - the editor fixes one thing at a time.
 *
 * @param input - Whatever the caller sent. Anything other than a plain object is rejected.
 * @param schema - Which keys are allowed and how each is validated.
 * @param options - `isPartial` for updates: missing keys are skipped, but at least one must remain.
 * @returns The cleaned values ready for `.insert()` / `.update()`, or a user-facing error.
 */
export function sanitizeInput<T>(input: unknown, schema: FieldSchema<T>, { isPartial }: SanitizeOptions): SanitizeResult<T> {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return { values: null, error: "Nothing to save." };
    }

    const source = new Map(Object.entries(input));
    const values: Record<string, unknown> = {};

    for (const [key, kind] of Object.entries<FieldKind>(schema)) {
        const value = source.get(key);

        if (value === undefined) {
            if (!isPartial && REQUIRED_KINDS.has(kind)) {
                return { values: null, error: `${toLabel(key)} is required.` };
            }
            continue;
        }

        const field = sanitizeField(value, kind, toLabel(key));
        if (field.error !== null) return { values: null, error: field.error };
        values[key] = field.value;
    }

    if (isPartial && Object.keys(values).length === 0) {
        return { values: null, error: "Nothing to save." };
    }

    // every key came from `schema` and was checked against its kind above,
    // which TypeScript can't follow through the dynamic loop
    return { values: values as T, error: null };
}

// ---- per-table schemas ----

export const SECTION_UPDATE_FIELDS: FieldSchema<SectionUpdateInput> = {
    heading: "nullableText",
    subheading: "nullableText",
    body: "nullableText",
    excerpt: "nullableText",
    sort_order: "integer",
    is_published: "boolean",
    image_id: "nullableId",
};

export const SECTION_CREATE_FIELDS: FieldSchema<SectionCreateInput> = {
    ...SECTION_UPDATE_FIELDS,
    type: "text",
};

export const PERSON_UPDATE_FIELDS: FieldSchema<PersonUpdateInput> = {
    name: "text",
    title: "nullableText",
    location: "nullableText",
    description: "nullableText",
    link: "nullableText",
    style: "style",
    sort_order: "integer",
    image: "nullableId",
};

export const PERSON_CREATE_FIELDS: FieldSchema<PersonCreateInput> = {
    ...PERSON_UPDATE_FIELDS,
    section_id: "id",
};

export const STAT_ITEM_UPDATE_FIELDS: FieldSchema<StatItemUpdateInput> = {
    label: "text",
    value: "text",
    description: "nullableText",
    style: "style",
    sort_order: "integer",
    image: "nullableId",
    parent_id: "nullableId",
};

export const STAT_ITEM_CREATE_FIELDS: FieldSchema<StatItemCreateInput> = {
    ...STAT_ITEM_UPDATE_FIELDS,
    section_id: "id",
};

export const IMAGE_UPDATE_FIELDS: FieldSchema<ImageUpdateInput> = {
    name: "text",
    file_ref: "text",
};

export const IMAGE_CREATE_FIELDS: FieldSchema<ImageCreateInput> = IMAGE_UPDATE_FIELDS;