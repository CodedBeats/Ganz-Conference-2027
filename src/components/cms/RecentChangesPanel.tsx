"use client";

import { useTransition } from "react";
import { Check, Loader2, Undo2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SESSION_IDLE_MINUTES, getFieldLabel } from "@/lib/cms/editSession";
import { revealBox } from "@/lib/cms/revealBox";
import { useCmsEditor } from "@/hooks/useCmsEditor";
import type { CmsEdit, CmsRowValues, LibraryFile } from "@/types/cms";

interface RecentChangesPanelProps {
    id: string;
    /** The session's edits - already emptied by the caller once the session has lapsed. */
    edits: CmsEdit[];
    expiresAt: string | null;
    /** From `useNow` - drives the relative times and countdown. */
    now: number;
    onClose: () => void;
}

const MINUTE_MS = 60_000;
const IMAGE_FIELDS = new Set(["image", "image_id"]);

/** "Just now", "4 min ago", then the clock time once it's an hour old. */
const formatAgo = (iso: string, now: number) => {
    const minutes = Math.floor((now - Date.parse(iso)) / MINUTE_MS);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

/**
 * A short, readable version of an edit's old value for the "Was:" line.
 *
 * @remarks
 * Image columns hold a file id, so they're shown by file name. Text loses its light markdown
 * (`*highlight*`, `[text](url)`) so the preview reads like the page does.
 */
const describeValue = (field: string, value: CmsRowValues[string] | undefined, files: LibraryFile[]) => {
    if (value === null || value === undefined || value === "") return "Empty";
    if (IMAGE_FIELDS.has(field)) return files.find((file) => file.id === value)?.name ?? "A file since deleted";

    return String(value)
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replaceAll("*", "");
};

const STATE_NOTES: Partial<Record<CmsEdit["undoState"], string>> = {
    stale: "Changed again since - undo the newer change first.",
    missing: "This item is no longer on the site.",
};

const RecentChangeItem = ({ edit, now }: { edit: CmsEdit; now: number }) => {
    const editor = useCmsEditor();
    const [isUndoing, startUndo] = useTransition();

    const fields = Object.keys(edit.after);
    const firstField = fields[0] ?? "";
    const isUndone = edit.undoState === "undone";
    const note = STATE_NOTES[edit.undoState];

    return (
        <li className={cn("rounded-2xl bg-white p-3 shadow-sm shadow-teal-dark/5 transition-opacity", isUndone && "opacity-60")}>
            {/* the label gets the full width so long "Section: item" names wrap instead of truncating */}
            <button
                type="button"
                onClick={() => revealBox(`${edit.table}:${edit.rowId}`)}
                className="group block w-full text-left"
                title="Show on page"
            >
                <span
                    className={cn(
                        "block text-sm leading-snug font-medium wrap-break-word group-hover:underline",
                        isUndone && "line-through",
                    )}
                >
                    {edit.label || "Untitled item"}
                </span>
                {firstField && (
                    <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-teal-dark/75">
                        <span className="font-medium text-teal">Was: </span>
                        {describeValue(firstField, edit.before[firstField], editor.files)}
                    </span>
                )}
            </button>

            <div className="mt-2 flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-xs text-teal-dark/60">
                    {fields.map(getFieldLabel).join(", ")} · {formatAgo(edit.createdAt, now)}
                </span>

                {isUndone ? (
                    <span className="flex shrink-0 items-center gap-1 py-1.5 text-xs font-medium text-teal">
                        <Check className="size-3.5" aria-hidden="true" />
                        Undone
                    </span>
                ) : (
                    <button
                        type="button"
                        onClick={() => startUndo(() => editor.undoEdit(edit))}
                        disabled={edit.undoState !== "ready" || isUndoing}
                        className="flex shrink-0 items-center gap-1.5 rounded-full border border-teal-dark/15 px-3 py-1.5 text-xs font-medium transition-colors hover:border-gold hover:bg-gold disabled:pointer-events-none disabled:opacity-40"
                        aria-label={`Undo change to ${edit.label}`}
                    >
                        {isUndoing ? (
                            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                            <Undo2 className="size-3.5" aria-hidden="true" />
                        )}
                        Undo
                    </button>
                )}
            </div>

            {note && <p className="mt-2 border-t border-teal-dark/10 pt-2 text-xs text-teal-dark/60">{note}</p>}
        </li>
    );
};

/**
 * The admin's saves this session, newest first, each with an Undo button.
 *
 * @remarks
 * Non-modal so the editor can keep working on the page with it open - new saves appear as
 * the page revalidates. Clicking an entry scrolls to its box. Whether an undo is allowed is
 * decided on the server (`getCmsEditSession`); the buttons only mirror it.
 */
export const RecentChangesPanel = ({ id, edits, expiresAt, now, onClose }: RecentChangesPanelProps) => {
    const minutesLeft = expiresAt ? Math.max(1, Math.ceil((Date.parse(expiresAt) - now) / MINUTE_MS)) : null;

    return (
        <section
            id={id}
            aria-labelledby={`${id}-title`}
            className="flex w-[calc(100vw-2rem)] animate-in flex-col overflow-hidden rounded-3xl border border-teal-dark/10 bg-cream text-teal-dark shadow-2xl shadow-teal-dark/30 duration-200 fade-in-0 slide-in-from-bottom-2 sm:w-80 sm:slide-in-from-bottom-0 sm:slide-in-from-right-3"
        >
            <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
                <div>
                    <p className="eyebrow text-teal">This session</p>
                    <h2 id={`${id}-title`} className="text-lg font-medium">
                        Recent changes
                    </h2>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-teal-dark/10"
                    aria-label="Close recent changes"
                >
                    <X className="size-4" />
                </button>
            </header>

            {edits.length === 0 ? (
                <p className="px-5 pt-2 pb-6 text-sm leading-relaxed text-teal-dark/60">
                    No changes this session yet. Anything you save will show up here, ready to undo.
                </p>
            ) : (
                <ol className="flex max-h-[min(22rem,40vh)] flex-col gap-2 overflow-y-auto px-3 pb-3 sm:max-h-[min(28rem,60vh)]">
                    {edits.map((edit) => (
                        <RecentChangeItem key={edit.id} edit={edit} now={now} />
                    ))}
                </ol>
            )}

            <footer className="border-t border-teal-dark/10 bg-teal-pale/60 px-5 py-3 text-xs leading-relaxed text-teal-dark/70">
                {minutesLeft !== null && edits.length > 0 && (
                    <p className="font-medium text-teal-dark">
                        Session ends in {minutesLeft} min unless you keep editing.
                    </p>
                )}
                <p>Edits made before a {SESSION_IDLE_MINUTES}-minute break can&apos;t be undone.</p>
            </footer>
        </section>
    );
};