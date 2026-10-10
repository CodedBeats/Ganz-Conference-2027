"use client";

import { createContext, useContext } from "react";
import type { CmsFieldValues } from "@/types/cms";

export interface CmsBoxContextValue {
    isEditing: boolean;
    /** The unsaved values while editing, `null` otherwise. */
    draft: CmsFieldValues | null;
    /** Updates one field of the draft. No-op when not editing. */
    setField: (field: string, value: string) => void;
}

export const CmsBoxContext = createContext<CmsBoxContextValue | null>(null);

/**
 * The nearest enclosing CMS edit box, or `null` when there isn't one.
 *
 * @remarks
 * Returns `null` for visitors (no boxes are rendered for them), so shared components like
 * `FaqItem` can call it unconditionally and only change behaviour while their box is editing.
 * Nested boxes each provide their own context, so a field always talks to its closest box.
 */
export function useCmsBox(): CmsBoxContextValue | null {
    return useContext(CmsBoxContext);
}