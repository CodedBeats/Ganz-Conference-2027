"use client";

import { useId, useRef, useState, type ChangeEvent } from "react";
import { ArrowLeft, FileText, Folder, Image as ImageIcon, Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    FILE_FOLDERS,
    FILE_MIME_TYPES,
    FOLDER_LABELS,
    getFileExtension,
    isFileFolder,
    isImageMimeType,
    type FileFolder,
} from "@/lib/cms/files";
import { uploadFile } from "@/lib/cms/uploadFile";
import { CmsErrorDetails } from "@/components/cms/CmsErrorDetails";
import { FileRow } from "@/components/files/FileRow";
import { FilePreview } from "@/components/files/FilePreview";
import type { CmsError, LibraryFile } from "@/types/cms";

/** Turns the manager into an image picker for one slot on the page. */
export interface FilePicker {
    /** The file the slot shows right now, if any - pre-selected and can't be re-inserted. */
    currentFileId: string | null;
    /** Where the picker opens, e.g. `keynotes` for a keynote photo. */
    initialFolder: FileFolder;
    onInsert: (file: LibraryFile) => void;
    /** Empties the slot. */
    onRemove: () => void;
    isSaving: boolean;
    /** Why the last insert/remove failed. */
    error: CmsError | null;
}

interface FileManagerProps {
    files: LibraryFile[];
    picker?: FilePicker;
    /** Sizing from the host - the manager fills it and scrolls its list internally. */
    className?: string;
}

interface UploadFailure {
    fileName: string;
    error: CmsError;
}

const ACCEPT = Object.keys(FILE_MIME_TYPES).join(",");

const folderOf = (file: LibraryFile): FileFolder => (isFileFolder(file.folder) ? file.folder : "general");

const fileIcon = (file: LibraryFile) =>
    isImageMimeType(file.mime_type) ? <ImageIcon className="size-5" /> : <FileText className="size-5" />;

const countLabel = (count: number) => (count === 1 ? "1 file" : `${count} files`);

/**
 * The CMS file library - folders and files on the left, preview and edit pane on the right.
 *
 * @remarks
 * Used as a card on `/admin` and inside `FileManagerDialog` on the home page. `files` comes
 * from `getFiles` on the server; every action here revalidates the page, so the list
 * refreshes itself after uploads, renames, moves and deletes - nothing is patched locally.
 *
 * With a `picker`, it also offers Insert and Remove for one image slot.
 */
export const FileManager = ({ files, picker, className }: FileManagerProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const uploadFolderId = useId();
    const [openFolder, setOpenFolder] = useState<FileFolder | null>(picker?.initialFolder ?? null);
    const [uploadFolder, setUploadFolder] = useState<FileFolder>(picker?.initialFolder ?? "general");
    const [selectedId, setSelectedId] = useState<string | null>(picker?.currentFileId ?? null);
    const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
    const [failures, setFailures] = useState<UploadFailure[]>([]);

    const selectedFile = files.find((file) => file.id === selectedId) ?? null;
    const folderFiles = openFolder ? files.filter((file) => folderOf(file) === openFolder) : [];
    const isUploading = progress !== null;

    const openFolderView = (folder: FileFolder | null) => {
        setOpenFolder(folder);
        if (folder) setUploadFolder(folder);
    };

    /**
     * Uploads the picked files one after another into `uploadFolder`.
     *
     * @remarks
     * Sequential so the progress count is honest and one bad file doesn't stop the rest -
     * failures are collected and listed together at the end. The last success is selected
     * so the editor lands on what they just added.
     */
    const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const picked = Array.from(event.target.files ?? []);
        // reset so picking the same file again still fires a change
        event.target.value = "";
        if (picked.length === 0) return;

        const folder = uploadFolder;
        const failed: UploadFailure[] = [];
        let lastUploadedId: string | null = null;
        setFailures([]);

        for (const [index, file] of picked.entries()) {
            setProgress({ current: index + 1, total: picked.length });
            const result = await uploadFile(file, { folder });
            if (result.error) failed.push({ fileName: file.name, error: result.error });
            else lastUploadedId = result.data.id;
        }

        setProgress(null);
        setFailures(failed);
        if (lastUploadedId) {
            openFolderView(folder);
            setSelectedId(lastUploadedId);
        }
    };

    return (
        <div className={cn("flex min-h-0 flex-col gap-4 text-teal-dark", className)}>
            <div className="flex flex-wrap items-center gap-3">
                <nav aria-label="Breadcrumb" className="mr-auto flex items-center gap-1.5 text-lg">
                    <button
                        type="button"
                        onClick={() => openFolderView(null)}
                        className={cn(openFolder ? "text-teal-dark/60 hover:text-teal" : "font-medium")}
                    >
                        Files
                    </button>
                    {openFolder && (
                        <>
                            <span className="text-teal-dark/40">/</span>
                            <span className="font-medium">{FOLDER_LABELS[openFolder]}</span>
                        </>
                    )}
                </nav>

                {picker?.currentFileId && (
                    <button
                        type="button"
                        onClick={picker.onRemove}
                        disabled={picker.isSaving}
                        className="btn-pill border border-teal-dark/20 px-5 py-2.5"
                    >
                        <X className="size-4" aria-hidden="true" />
                        Remove image
                    </button>
                )}

                <label htmlFor={uploadFolderId} className="sr-only">
                    Upload into folder
                </label>
                <select
                    id={uploadFolderId}
                    value={uploadFolder}
                    onChange={(event) => isFileFolder(event.target.value) && setUploadFolder(event.target.value)}
                    disabled={isUploading}
                    className="rounded-full bg-white px-4 py-2.5 text-sm outline-1 outline-teal-dark/20 focus:outline-2 focus:outline-violet-500"
                >
                    {FILE_FOLDERS.map((folder) => (
                        <option key={folder} value={folder}>
                            Into: {FOLDER_LABELS[folder]}
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={isUploading}
                    className="btn-pill btn-gold px-5 py-2.5"
                >
                    {progress ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                        <Upload className="size-4" aria-hidden="true" />
                    )}
                    {progress ? `Uploading ${progress.current} of ${progress.total}…` : "Upload"}
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPT}
                    multiple
                    onChange={handleUpload}
                    className="hidden"
                    data-testid="file-upload-input"
                />
            </div>

            {failures.length > 0 && (
                <div role="alert" className="space-y-3 rounded-2xl bg-red-50 p-4 text-sm">
                    <p className="font-medium">
                        {failures.length === 1 ? "1 file didn't upload:" : `${failures.length} files didn't upload:`}
                    </p>
                    {failures.map((failure) => (
                        <div key={failure.fileName}>
                            <p className="mb-2 font-medium">{failure.fileName}</p>
                            <CmsErrorDetails error={failure.error} className="text-sm" />
                        </div>
                    ))}
                </div>
            )}

            {picker?.error && (
                <div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm">
                    <CmsErrorDetails error={picker.error} className="text-sm" />
                </div>
            )}

            <div className="grid min-h-0 flex-1 gap-6 md:grid-cols-5">
                <ul className="min-h-0 space-y-1 overflow-y-auto md:col-span-3" aria-label="Files">
                    {openFolder === null ? (
                        FILE_FOLDERS.map((folder) => (
                            <FileRow
                                key={folder}
                                icon={<Folder className="size-5" />}
                                name={FOLDER_LABELS[folder]}
                                meta={countLabel(files.filter((file) => folderOf(file) === folder).length)}
                                onClick={() => openFolderView(folder)}
                            />
                        ))
                    ) : (
                        <>
                            <FileRow
                                icon={<ArrowLeft className="size-5" />}
                                name="All folders"
                                onClick={() => openFolderView(null)}
                            />
                            {folderFiles.map((file) => {
                                const extension = getFileExtension(file.mime_type);
                                return (
                                    <FileRow
                                        key={file.id}
                                        icon={fileIcon(file)}
                                        name={file.name}
                                        suffix={extension ? `.${extension}` : undefined}
                                        meta={file.id === picker?.currentFileId ? "In this slot" : undefined}
                                        isSelected={file.id === selectedId}
                                        onClick={() => setSelectedId(file.id)}
                                    />
                                );
                            })}
                            {folderFiles.length === 0 && (
                                <li className="px-3 py-6 text-teal-dark/60">
                                    Nothing in {FOLDER_LABELS[openFolder]} yet - upload a file to add one.
                                </li>
                            )}
                        </>
                    )}
                </ul>

                <div className="min-h-0 overflow-y-auto md:col-span-2">
                    <FilePreview
                        key={selectedFile?.id ?? "none"}
                        file={selectedFile}
                        picker={picker}
                        onMoved={(folder) => openFolderView(folder)}
                        onDeleted={() => setSelectedId(null)}
                    />
                </div>
            </div>
        </div>
    );
};