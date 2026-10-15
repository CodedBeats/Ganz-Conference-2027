"use client";

import { useState, useTransition, type ReactNode } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateCmsRow } from "@/lib/cms/actions";
import { useCmsEditor } from "@/hooks/useCmsEditor";
import { FileManagerDialog } from "@/components/files/FileManagerDialog";
import type { FileFolder } from "@/lib/cms/files";
import type { CmsError, EditableTable } from "@/types/cms";

export interface CmsImageSlotClientProps {
    table: EditableTable;
    rowId: string;
    /** The row's file column - `image_id` on sections, `image` on people and stat items. */
    field: "image" | "image_id";
    /** Human name for the slot, e.g. "Keynote: Michael Clemmens". */
    label: string;
    /** The file currently in the slot. */
    fileId: string | null;
    /** Folder the picker opens in. */
    folder: FileFolder;
    /** Layout classes - the slot *is* the image's wrapper, so `fill` images size against it. */
    className?: string;
    /** Shown to editors instead of `children` while the slot is empty, so there's something to click. */
    placeholder?: ReactNode;
    /** Render nothing at all when empty (for visitors, and editors with edit boxes off). */
    isHiddenWhenEmpty?: boolean;
    children: ReactNode;
}

/**
 * An image on the homepage that can be swapped from the file library.
 *
 * @remarks
 * The pen opens the file manager as a picker. Insert and Remove save straight away via
 * `updateCmsRow` - there's no draft, since an image slot has nothing else to stage with it.
 * It claims its own box id (`table:row:field`), so the one-edit-at-a-time rule covers it
 * like any text box; a failed save keeps the picker open with the error shown in it.
 */
export const CmsImageSlotClient = ({
    table,
    rowId,
    field,
    label,
    fileId,
    folder,
    className,
    placeholder,
    isHiddenWhenEmpty = false,
    children,
}: CmsImageSlotClientProps) => {
    const editor = useCmsEditor();
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<CmsError | null>(null);
    const [isSaving, startSaving] = useTransition();

    const boxId = `${table}:${rowId}:${field}`;

    const open = () => {
        if (!editor.claimBox({ id: boxId, label: `${label} image` })) return;
        setError(null);
        setIsOpen(true);
    };

    const close = () => {
        if (isSaving) return;
        setIsOpen(false);
        editor.releaseBox(boxId);
    };

    const save = (nextFileId: string | null) => {
        startSaving(async () => {
            const result = await updateCmsRow(table, rowId, { [field]: nextFileId });
            if (result.error) {
                setError(result.error);
                return;
            }
            setIsOpen(false);
            editor.releaseBox(boxId);
        });
    };

    const isEmpty = fileId === null;
    // with edit boxes off the page should look exactly as visitors see it
    if (!editor.isEditMode && isEmpty && isHiddenWhenEmpty) return null;

    return (
        <div data-cms-box={boxId} className={cn(className, editor.isEditMode && "cms-image-slot")}>
            {editor.isEditMode && isEmpty && placeholder ? placeholder : children}

            {editor.isEditMode && (
                <button
                    type="button"
                    onClick={open}
                    className="cms-image-button"
                    aria-label={`Change image for ${label}`}
                    title={`Change image for ${label}`}
                >
                    <ImageIcon className="size-4" aria-hidden="true" />
                    Image
                </button>
            )}

            <FileManagerDialog
                isOpen={isOpen}
                onClose={close}
                files={editor.files}
                pickerLabel={label}
                picker={{
                    currentFileId: fileId,
                    initialFolder: folder,
                    onInsert: (file) => save(file.id),
                    onRemove: () => save(null),
                    isSaving,
                    error,
                }}
            />
        </div>
    );
};