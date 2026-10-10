import type { CmsFieldValues } from "@/types/cms";

/** `null` and `""` both mean "empty" in the editor - a cleared field shouldn't count as a change. */
const normalise = (value: string | null | undefined) => value ?? "";

/**
 * The fields of an editor draft that differ from the row's saved values.
 *
 * @remarks
 * Only these are sent to `updateCmsRow`, so an untouched field can never overwrite a value
 * someone else changed in the meantime. Empty and `null` are treated as equal, since a text
 * box can't tell them apart. Keys missing from `original` are ignored - the draft is always
 * seeded from `original`, so they can't be real edits.
 *
 * @param original - The row's values as the page was rendered.
 * @param draft - The editor's current values.
 * @returns Just the changed fields; empty when nothing changed.
 */
export function getChangedFields(original: CmsFieldValues, draft: CmsFieldValues): CmsFieldValues {
    const changes: CmsFieldValues = {};

    for (const [field, value] of Object.entries(draft)) {
        if (!(field in original)) continue;
        if (normalise(value) !== normalise(original[field])) changes[field] = value;
    }

    return changes;
}

/** Whether the draft has any unsaved changes - see {@link getChangedFields}. */
export function hasChanges(original: CmsFieldValues, draft: CmsFieldValues | null): boolean {
    return draft !== null && Object.keys(getChangedFields(original, draft)).length > 0;
}