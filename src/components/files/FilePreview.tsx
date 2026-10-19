"use client";

import { useId, useState, useTransition, type KeyboardEvent } from "react";
import Image from "next/image";
import { Check, ExternalLink, FileText, Loader2, MousePointerClick, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateFile } from "@/lib/cms/actions";
import {
    FILE_FOLDERS,
    FILE_KIND_LABELS,
    FOLDER_LABELS,
    describeFileUsage,
    getFileExtension,
    getFileUrl,
    isFileFolder,
    isFileOfKind,
    isImageMimeType,
    type FileFolder,
    type FileKind,
} from "@/lib/cms/files";
import { CmsErrorDetails } from "@/components/cms/CmsErrorDetails";
import { DeleteFileDialog } from "@/components/files/DeleteFileDialog";
import type { CmsError, LibraryFile } from "@/types/cms";
import type { FilePicker } from "@/components/files/FileManager";

interface FilePreviewProps {
    /** `null` shows the "pick a file" hint. Re-key per file so the name draft resets. */
    file: LibraryFile | null;
    picker?: FilePicker;
    /** Called after a move so the list can follow the file into its new folder. */
    onMoved: (folder: FileFolder) => void;
    onDeleted: () => void;
}

type SaveStatus = { kind: "idle" } | { kind: "saved" } | { kind: "error"; error: CmsError };

/** Insert button copy when the selected file is the wrong kind for the slot. */
const WRONG_KIND_LABELS: Record<FileKind, string> = {
    image: "PDFs can't go here",
    pdf: "Only PDFs can go here",
};

const FIELD_CLASS =
    "w-full rounded-lg bg-white px-3 py-2 text-teal-dark outline-1 outline-teal-dark/20 focus:outline-2 focus:outline-violet-500";

/**
 * The right-hand pane: preview, rename, move, usages, delete - and Insert when picking.
 *
 * @remarks
 * Renames save on blur or Enter (Escape reverts), moves save on change. Both go through
 * `updateFile`, whose revalidation refreshes the `files` prop with the new values.
 */
export const FilePreview = ({ file, picker, onMoved, onDeleted }: FilePreviewProps) => {
    const nameId = useId();
    const folderId = useId();
    const [name, setName] = useState(file?.name ?? "");
    const [status, setStatus] = useState<SaveStatus>({ kind: "idle" });
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isSaving, startSaving] = useTransition();

    if (!file) {
        return (
            <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 rounded-2xl bg-teal-pale p-6 text-center text-teal-dark/60">
                <MousePointerClick className="size-6" aria-hidden="true" />
                <p>
                    {picker
                        ? `Choose ${picker.accept === "pdf" ? "a PDF" : "an image"} to preview it here.`
                        : "Select a file to preview and edit it."}
                </p>
            </div>
        );
    }

    const extension = getFileExtension(file.mime_type);
    const displayName = extension ? `${file.name}.${extension}` : file.name;
    const isImage = isImageMimeType(file.mime_type);
    const url = getFileUrl(file.file_ref);
    const folder = isFileFolder(file.folder) ? file.folder : "general";
    const isInSlot = picker?.currentFileId === file.id;
    const canInsert = picker ? isFileOfKind(file.mime_type, picker.accept) : false;

    const save = (input: { name?: string; folder?: FileFolder }, afterSave?: () => void) => {
        startSaving(async () => {
            const result = await updateFile(file.id, input);
            if (result.error) {
                setStatus({ kind: "error", error: result.error });
                return;
            }
            setStatus({ kind: "saved" });
            afterSave?.();
        });
    };

    const saveName = () => {
        const trimmed = name.trim();
        if (!trimmed) return setName(file.name);
        if (trimmed === file.name) return;
        save({ name: trimmed });
    };

    const handleNameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
        } else if (event.key === "Escape") {
            // keep Escape from closing the surrounding dialog while editing a name
            event.stopPropagation();
            setName(file.name);
            setStatus({ kind: "idle" });
        }
    };

    return (
        <div className="flex flex-col gap-4 px-3">
            {isImage ? (
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-teal-pale">
                    <Image src={url} alt={file.name} fill sizes="(min-width: 768px) 22rem, 100vw" className="object-contain" />
                </div>
            ) : (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-2xl bg-teal-pale text-teal-dark transition-colors hover:bg-teal-light"
                >
                    <FileText className="size-14 text-teal" aria-hidden="true" />
                    <span className="flex items-center gap-1.5 font-medium">
                        Open PDF <ExternalLink className="size-4" aria-hidden="true" />
                    </span>
                </a>
            )}

            <div>
                <label htmlFor={nameId} className="mb-1 block text-xs font-medium text-teal-dark/70">
                    Name
                </label>
                <div className="flex items-center gap-2">
                    <input
                        id={nameId}
                        value={name}
                        onChange={(event) => {
                            setName(event.target.value);
                            setStatus({ kind: "idle" });
                        }}
                        onBlur={saveName}
                        onKeyDown={handleNameKeyDown}
                        disabled={isSaving}
                        className={FIELD_CLASS}
                    />
                    {extension && <span className="shrink-0 text-teal-dark/50">.{extension}</span>}
                </div>
            </div>

            <div>
                <label htmlFor={folderId} className="mb-1 block text-xs font-medium text-teal-dark/70">
                    Folder
                </label>
                <select
                    id={folderId}
                    value={folder}
                    onChange={(event) => {
                        const next = event.target.value;
                        if (isFileFolder(next)) save({ folder: next }, () => onMoved(next));
                    }}
                    disabled={isSaving}
                    className={FIELD_CLASS}
                >
                    {FILE_FOLDERS.map((option) => (
                        <option key={option} value={option}>
                            {FOLDER_LABELS[option]}
                        </option>
                    ))}
                </select>
            </div>

            <p aria-live="polite" className="min-h-5 text-sm text-teal-dark/60">
                {isSaving && (
                    <span className="flex items-center gap-1.5">
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Saving…
                    </span>
                )}
                {!isSaving && status.kind === "saved" && (
                    <span className="flex items-center gap-1.5 text-teal">
                        <Check className="size-4" aria-hidden="true" /> Saved
                    </span>
                )}
            </p>
            {!isSaving && status.kind === "error" && (
                <CmsErrorDetails error={status.error} className="rounded-2xl bg-red-50 p-4 text-sm" />
            )}

            <section>
                <h3 className="eyebrow mb-2 text-teal-dark/50">Used in</h3>
                {file.usages.length > 0 ? (
                    <ul className="space-y-1 text-sm">
                        {file.usages.map((usage) => (
                            <li key={`${usage.table}:${usage.id}`}>{describeFileUsage(usage)}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-teal-dark/60">Not used anywhere yet.</p>
                )}
            </section>

            <div className="flex flex-wrap gap-3">
                {picker && (
                    <button
                        type="button"
                        className={cn("inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-xs font-medium tracking-[0.15em] uppercase bg-teal-dark text-cream transition-all duration-200 hover:bg-teal hover:-translate-y-0.5 cursor-pointer flex-1", (!canInsert || isInSlot) && "pointer-events-none opacity-50")}
                        onClick={() => picker.onInsert(file)}
                        disabled={!canInsert || isInSlot || picker.isSaving}
                    >
                        {picker.isSaving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                        {isInSlot
                            ? "Already in use here"
                            : canInsert
                              ? `Insert ${FILE_KIND_LABELS[picker.accept]}`
                              : WRONG_KIND_LABELS[picker.accept]}
                    </button>
                )}
                <button
                    type="button"
                    className="btn-pill border border-red-700/30 text-red-700 hover:bg-red-50 cursor-pointer"
                    onClick={() => setIsDeleteOpen(true)}
                >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Delete
                </button>
            </div>

            <DeleteFileDialog
                file={file}
                displayName={displayName}
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onDeleted={() => {
                    setIsDeleteOpen(false);
                    onDeleted();
                }}
            />
        </div>
    );
};