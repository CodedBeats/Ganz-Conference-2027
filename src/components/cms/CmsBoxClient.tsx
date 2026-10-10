"use client";

import { useEffect, useMemo, useState, useTransition, type KeyboardEvent, type ReactNode } from "react";
import { Loader2, Pencil, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateCmsRow } from "@/lib/cms/actions";
import { getChangedFields, hasChanges } from "@/lib/cms/draft";
import { useCmsEditor } from "@/hooks/useCmsEditor";
import { CmsBoxContext, type CmsBoxContextValue } from "@/hooks/useCmsBox";
import type { CmsFieldValues, EditableTable } from "@/types/cms";

/** Elements a box can render as - it *is* the card/row element so `ul > li` and grids stay valid. */
export type CmsBoxElement = "div" | "li" | "header" | "section";

export interface CmsBoxClientProps {
    as?: CmsBoxElement;
    className?: string;
    table: EditableTable;
    rowId: string;
    /** Human name for the row, used in dialogs - e.g. "Keynote: Michael Clemmens". */
    label: string;
    /** Saved values of every field editable in this box, keyed by column. */
    values: CmsFieldValues;
    children: ReactNode;
}

const TOOL_BUTTON = "flex size-9 items-center justify-center rounded-full shadow-md transition-colors disabled:opacity-60";

/**
 * One editable database row on the homepage - outline, pen/save/cancel toolbar, and the draft.
 *
 * @remarks
 * The draft is `null` until the pen is clicked, then a copy of `values` that the box's
 * `CmsText` fields edit through {@link CmsBoxContext}. Save sends only the changed fields
 * via `updateCmsRow`; on success the action's revalidation refreshes `values` and the
 * server-rendered `children`, so the box simply drops its draft. On failure the draft is
 * kept and the error dialog explains what went wrong.
 */
export const CmsBoxClient = ({ as: Tag = "div", className, table, rowId, label, values, children }: CmsBoxClientProps) => {
    const editor = useCmsEditor();
    const [draft, setDraft] = useState<CmsFieldValues | null>(null);
    const [isSaving, startSaving] = useTransition();

    const boxId = `${table}:${rowId}`;
    const isEditing = draft !== null;
    const isDirty = hasChanges(values, draft);

    // warn before a refresh or tab close throws away unsaved edits
    useEffect(() => {
        if (!isDirty) return;
        const warn = (event: BeforeUnloadEvent) => event.preventDefault();
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [isDirty]);

    const startEditing = () => {
        if (!editor.claimBox({ id: boxId, label })) return;
        setDraft({ ...values });
    };

    const stopEditing = () => {
        setDraft(null);
        editor.releaseBox(boxId);
    };

    const save = () => {
        if (!draft || isSaving) return;

        const changes = getChangedFields(values, draft);
        if (Object.keys(changes).length === 0) return stopEditing();

        startSaving(async () => {
            const result = await updateCmsRow(table, rowId, changes);
            if (result.error) {
                editor.showError(label, result.error);
                return;
            }
            stopEditing();
        });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (!isEditing) return;
        if (event.key === "Escape" && !isSaving) {
            event.stopPropagation();
            stopEditing();
        } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            event.stopPropagation();
            save();
        }
    };

    const context = useMemo<CmsBoxContextValue>(
        () => ({
            isEditing,
            draft,
            setField: (field, value) => setDraft((prev) => (prev ? { ...prev, [field]: value } : prev)),
        }),
        [isEditing, draft],
    );

    const isOtherBoxOpen = editor.activeBox !== null && editor.activeBox.id !== boxId;

    return (
        <CmsBoxContext value={context}>
            <Tag
                data-cms-box={boxId}
                className={cn(className, editor.isEditMode && "cms-box", isEditing && "cms-box-editing")}
                onKeyDown={handleKeyDown}
            >
                {children}

                {editor.isEditMode && (
                    <div className="cms-toolbar">
                        {isEditing ? (
                            <>
                                <button
                                    type="button"
                                    className={cn(TOOL_BUTTON, "bg-white text-teal-dark hover:bg-cream")}
                                    onClick={stopEditing}
                                    disabled={isSaving}
                                    aria-label={`Cancel editing ${label}`}
                                    title="Cancel (Esc)"
                                >
                                    <X className="size-4" />
                                </button>
                                <button
                                    type="button"
                                    className={cn(TOOL_BUTTON, "bg-fuchsia-600 text-white hover:bg-fuchsia-700")}
                                    onClick={save}
                                    disabled={isSaving}
                                    aria-label={`Save ${label}`}
                                    title="Save (Ctrl+Enter)"
                                >
                                    {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                className={cn(
                                    TOOL_BUTTON,
                                    "bg-white text-violet-700 hover:bg-violet-50",
                                    isOtherBoxOpen && "opacity-50",
                                )}
                                onClick={startEditing}
                                aria-label={`Edit ${label}`}
                                title={`Edit ${label}`}
                            >
                                <Pencil className="size-4" />
                            </button>
                        )}
                    </div>
                )}
            </Tag>
        </CmsBoxContext>
    );
};