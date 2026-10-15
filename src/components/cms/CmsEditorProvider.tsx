"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CmsEditorContext, type ActiveCmsBox, type CmsEditorContextValue } from "@/hooks/useCmsEditor";
import { CmsDialog, type CmsDialogContent } from "@/components/cms/CmsDialog";
import { FileManagerDialog } from "@/components/files/FileManagerDialog";
import type { LibraryFile } from "@/types/cms";

const NO_FILES: LibraryFile[] = [];

interface CmsEditorProviderProps {
    children: ReactNode;
    /** From `getFiles` - shared by the file manager modal and every image slot's picker. */
    files?: LibraryFile[];
}

/** Scrolls an open box into view and focuses its first field, so "Show me" lands somewhere useful. */
const revealBox = (id: string) => {
    const box = document.querySelector<HTMLElement>(`[data-cms-box="${CSS.escape(id)}"]`);
    box?.scrollIntoView({ behavior: "smooth", block: "center" });
    box?.querySelector<HTMLElement>("textarea, input, select")?.focus({ preventScroll: true });
};

/**
 * Page-wide state for the homepage editor: edit mode, the one open box, the dialog, and the
 * file manager modal opened from the admin bar.
 *
 * @remarks
 * Rendered by `src/app/page.tsx` for admins only. Enforces the one-box-at-a-time rule:
 * {@link CmsEditorContextValue.claimBox} refuses while another box is open and explains why,
 * and the same applies to switching edit mode off mid-edit.
 */
export const CmsEditorProvider = ({ children, files = NO_FILES }: CmsEditorProviderProps) => {
    const [isEditMode, setIsEditMode] = useState(true);
    const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
    const [activeBox, setActiveBox] = useState<ActiveCmsBox | null>(null);
    const [dialog, setDialog] = useState<{ isOpen: boolean; content: CmsDialogContent | null }>({
        isOpen: false,
        content: null,
    });

    const value = useMemo<CmsEditorContextValue>(() => {
        const openDialog = (content: CmsDialogContent) => setDialog({ isOpen: true, content });

        return {
            isEditMode,
            activeBox,
            setEditMode: (isOn) => {
                if (!isOn && activeBox) {
                    openDialog({ kind: "notice", activeLabel: activeBox.label, reason: "toggle-edit-mode" });
                    return;
                }
                setIsEditMode(isOn);
            },
            claimBox: (box) => {
                if (activeBox && activeBox.id !== box.id) {
                    openDialog({ kind: "notice", activeLabel: activeBox.label, reason: "open-box" });
                    return false;
                }
                setActiveBox(box);
                return true;
            },
            releaseBox: (id) => setActiveBox((prev) => (prev?.id === id ? null : prev)),
            showError: (itemLabel, error) => openDialog({ kind: "error", itemLabel, error }),
            files,
            openFileManager: () => setIsFileManagerOpen(true),
        };
    }, [isEditMode, activeBox, files]);

    const closeDialog = () => setDialog((prev) => ({ ...prev, isOpen: false }));

    const showActiveBox = () => {
        closeDialog();
        if (activeBox) revealBox(activeBox.id);
    };

    return (
        <CmsEditorContext value={value}>
            {children}
            <CmsDialog
                isOpen={dialog.isOpen}
                content={dialog.content}
                onClose={closeDialog}
                onShowActiveBox={showActiveBox}
            />
            <FileManagerDialog isOpen={isFileManagerOpen} onClose={() => setIsFileManagerOpen(false)} files={files} />
        </CmsEditorContext>
    );
};