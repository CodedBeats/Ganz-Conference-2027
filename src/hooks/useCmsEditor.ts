"use client";

import { createContext, useContext } from "react";
import type { CmsError } from "@/types/cms";

/** The box currently in edit mode - only one may be open at a time. */
export interface ActiveCmsBox {
    /** `${table}:${rowId}` - also set as the box's `data-cms-box` attribute so it can be scrolled to. */
    id: string;
    /** Human name for the row, e.g. "Keynote: Michael Clemmens". */
    label: string;
}

export interface CmsEditorContextValue {
    /** Whether edit boxes are shown at all. Off = see the page exactly as visitors do. */
    isEditMode: boolean;
    /** Switches edit boxes on/off. Refused (with a notice) while a box is open. */
    setEditMode: (isOn: boolean) => void;
    activeBox: ActiveCmsBox | null;
    /** Marks a box as the open one. Returns `false` (and shows a notice) if another box is already open. */
    claimBox: (box: ActiveCmsBox) => boolean;
    /** Clears the open box, if it's this one. */
    releaseBox: (id: string) => void;
    /** Opens the error dialog for a failed save of `itemLabel`. */
    showError: (itemLabel: string, error: CmsError) => void;
}

export const CmsEditorContext = createContext<CmsEditorContextValue | null>(null);

/**
 * Page-wide editor state for the homepage CMS.
 *
 * @remarks
 * Only available inside `CmsEditorProvider`, which `src/app/page.tsx` renders for admins only -
 * so anything calling this is admin-only UI by definition.
 *
 * @throws If called outside `CmsEditorProvider`.
 */
export function useCmsEditor(): CmsEditorContextValue {
    const context = useContext(CmsEditorContext);
    if (!context) throw new Error("useCmsEditor must be used inside CmsEditorProvider");
    return context;
}