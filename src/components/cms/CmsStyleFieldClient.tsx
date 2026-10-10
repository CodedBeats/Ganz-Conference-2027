"use client";

import { useId } from "react";
import { useCmsBox } from "@/hooks/useCmsBox";
import type { CmsStyle } from "@/types/content";

export interface CmsStyleOption {
    value: CmsStyle;
    label: string;
}

export interface CmsStyleFieldClientProps {
    /** What each style means for this card, e.g. Announced / To be announced. */
    options: CmsStyleOption[];
    label?: string;
}

/**
 * Card style picker, only rendered while its box is editing.
 *
 * @remarks
 * The card's look comes from server-rendered markup, so a new style shows once it's saved.
 */
export const CmsStyleFieldClient = ({ options, label = "Card style" }: CmsStyleFieldClientProps) => {
    const box = useCmsBox();
    const selectId = useId();

    if (!box?.draft) return null;

    return (
        <div className="cms-field mb-4 font-sans text-sm normal-case">
            <label htmlFor={selectId} className="mb-1 block text-xs font-medium opacity-70">
                {label}
            </label>
            <select
                id={selectId}
                value={box.draft.style ?? options[0]?.value}
                onChange={(event) => box.setField("style", event.target.value)}
                className="w-full rounded-lg bg-white px-3 py-2 text-teal-dark outline-1 outline-teal-dark/20 focus:outline-2 focus:outline-violet-500"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <p className="mt-1 text-xs opacity-60">The card&apos;s look updates after you save.</p>
        </div>
    );
};