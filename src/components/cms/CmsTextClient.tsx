"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useCmsBox } from "@/hooks/useCmsBox";

/** Formatting help shown under a field while editing. */
export type CmsTextHint = "highlight" | "paragraphs";

const HINTS: Record<CmsTextHint, string> = {
    highlight: "Wrap words in *asterisks* to highlight them. Press Enter for a line break.",
    paragraphs: "Leave a blank line between paragraphs. Wrap words in *asterisks* to highlight them.",
};

export interface CmsTextClientProps {
    /** The column this field edits - must be a key of the enclosing box's `values`. */
    field: string;
    /** Short caption shown above the input while editing, e.g. "Heading". */
    label: string;
    /** Textarea (with line breaks) instead of a single-line input. */
    multiline?: boolean;
    hint?: CmsTextHint;
    placeholder?: string;
    /** Typography for the edit area - usually the same classes as the view element, so editing looks like the page. */
    editClassName?: string;
    /** The normal, server-rendered view of the field. */
    children?: ReactNode;
}

/** Inherits the surrounding typography so the input reads like the text it replaces. */
const INPUT_CLASS =
    "block w-full resize-none rounded-lg bg-white/5 px-2 py-1 -mx-2 [font:inherit] [letter-spacing:inherit] text-inherit outline-1 outline-current/30 field-sizing-content placeholder:text-current/40 focus:outline-2 focus:outline-violet-500";

/** Captions use their own fixed type so a 7xl heading doesn't get a 7xl label. */
const CAPTION_CLASS = "block font-sans text-xs font-medium leading-normal tracking-normal normal-case";

/**
 * One editable field: the server-rendered view normally, an input while its box is editing.
 *
 * @remarks
 * Reads and writes the nearest box's draft through `useCmsBox`. Outside an editing box it's
 * a pass-through, so the section's own markup (highlights, link stripping, hide-when-empty)
 * is untouched.
 */
export const CmsTextClient = ({ field, label, multiline = false, hint, placeholder, editClassName, children }: CmsTextClientProps) => {
    const box = useCmsBox();
    const inputId = useId();

    if (!box?.draft) return <>{children}</>;

    const value = box.draft[field] ?? "";
    const commonProps = {
        id: inputId,
        value,
        placeholder: placeholder ?? `Add ${label.toLowerCase()}…`,
        className: INPUT_CLASS,
    };

    return (
        <div className={cn("cms-field", editClassName)}>
            <label htmlFor={inputId} className={cn(CAPTION_CLASS, "mb-1 opacity-70")}>
                {label}
            </label>

            {multiline ? (
                <textarea
                    {...commonProps}
                    // fallback for browsers without field-sizing
                    rows={Math.max(2, value.split("\n").length)}
                    onChange={(event) => box.setField(field, event.target.value)}
                />
            ) : (
                <input type="text" {...commonProps} onChange={(event) => box.setField(field, event.target.value)} />
            )}

            {hint && <p className={cn(CAPTION_CLASS, "mt-1 font-normal opacity-60")}>{HINTS[hint]}</p>}
        </div>
    );
};