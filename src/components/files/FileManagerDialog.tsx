"use client";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { FileManager, type FilePicker } from "@/components/files/FileManager";
import type { LibraryFile } from "@/types/cms";

interface FileManagerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    files: LibraryFile[];
    /** Set when opened from an image or PDF slot - see {@link FilePicker}. */
    picker?: FilePicker;
    /** What's being picked for, e.g. "Keynote: Michael Clemmens". */
    pickerLabel?: string;
}

/** The file manager as a large modal over the home page, with the usual X to close. */
export const FileManagerDialog = ({ isOpen, onClose, files, picker, pickerLabel }: FileManagerDialogProps) => {
    const article = picker?.accept === "pdf" ? "a PDF" : "an image";

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="flex h-[85vh] flex-col gap-5 rounded-3xl bg-cream p-6 text-teal-dark sm:max-w-5xl md:p-8">
                <div className="pr-10">
                    <DialogTitle className="text-2xl font-heading">{picker ? `Choose ${article}` : "Files"}</DialogTitle>
                    <DialogDescription className="mt-1 text-base text-teal-dark/70">
                        {picker
                            ? `Pick ${article} for ${pickerLabel ?? "this slot"}, then click Insert.`
                            : "Upload, rename, move and delete the images and PDFs used on the site."}
                    </DialogDescription>
                </div>
                {/* mounted only while open, so the picker always starts from the slot's folder */}
                {isOpen && <FileManager files={files} picker={picker} className="flex-1" />}
            </DialogContent>
        </Dialog>
    );
};