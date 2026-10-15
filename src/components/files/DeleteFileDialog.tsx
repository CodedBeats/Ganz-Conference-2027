"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { CmsErrorDetails } from "@/components/cms/CmsErrorDetails";
import { deleteFile } from "@/lib/cms/actions";
import { fileInUseError } from "@/lib/cms/files";
import type { CmsError, LibraryFile } from "@/types/cms";

interface DeleteFileDialogProps {
    file: LibraryFile;
    /** Name with extension, as the list shows it. */
    displayName: string;
    isOpen: boolean;
    onClose: () => void;
    onDeleted: () => void;
}

/**
 * Confirms a delete, or explains why it can't happen yet.
 *
 * @remarks
 * Files still in use never get a Delete button - the dialog lists where they're used instead.
 * `deleteFile` re-checks on the server, so a usage added since the page loaded comes back as
 * the same explanation.
 */
export const DeleteFileDialog = ({ file, displayName, isOpen, onClose, onDeleted }: DeleteFileDialogProps) => {
    const [error, setError] = useState<CmsError | null>(null);
    const [isDeleting, startDeleting] = useTransition();

    const isInUse = file.usages.length > 0;
    const shownError = error ?? (isInUse ? fileInUseError(file.usages) : null);

    const close = () => {
        if (isDeleting) return;
        setError(null);
        onClose();
    };

    const confirmDelete = () => {
        startDeleting(async () => {
            const result = await deleteFile(file.id);
            if (result.error) {
                setError(result.error);
                return;
            }
            setError(null);
            onDeleted();
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
            <DialogContent className="gap-5 rounded-3xl bg-cream p-7 text-teal-dark sm:max-w-md">
                {shownError ? (
                    <>
                        <span className="flex size-11 items-center justify-center rounded-full bg-red-100 text-red-700">
                            <AlertTriangle className="size-5" aria-hidden="true" />
                        </span>
                        <DialogTitle className="text-xl leading-snug font-medium">
                            Can&apos;t delete &ldquo;{displayName}&rdquo;
                        </DialogTitle>
                        <CmsErrorDetails error={shownError} isInDialog />
                    </>
                ) : (
                    <>
                        <span className="flex size-11 items-center justify-center rounded-full bg-red-100 text-red-700">
                            <Trash2 className="size-5" aria-hidden="true" />
                        </span>
                        <DialogTitle className="text-xl leading-snug font-medium">
                            Delete &ldquo;{displayName}&rdquo;?
                        </DialogTitle>
                        <DialogDescription className="text-base leading-relaxed text-teal-dark">
                            It isn&apos;t used anywhere on the site. This can&apos;t be undone.
                        </DialogDescription>
                    </>
                )}

                <div className="flex flex-wrap justify-end gap-3 pt-1">
                    {shownError ? (
                        <button type="button" className="btn-pill btn-dark" onClick={close}>
                            OK, got it
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                className="btn-pill btn-cream border border-teal-dark/20"
                                onClick={close}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn-pill bg-red-700 text-white hover:bg-red-800"
                                onClick={confirmDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                                Delete
                            </button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};