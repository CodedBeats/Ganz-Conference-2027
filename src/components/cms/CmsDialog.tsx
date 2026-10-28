"use client";

import { AlertTriangle, PencilLine } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { CmsErrorDetails } from "@/components/cms/CmsErrorDetails";
import type { CmsError } from "@/types/cms";

/** What was being attempted when a notice blocked it. */
type NoticeReason = "open-box" | "toggle-edit-mode" | "undo";

/** What the dialog is currently showing. `action` defaults to `"save"`. */
export type CmsDialogContent =
    | { kind: "error"; itemLabel: string; error: CmsError; action?: "save" | "undo" }
    | { kind: "notice"; activeLabel: string; reason: NoticeReason };

interface CmsDialogProps {
    isOpen: boolean;
    content: CmsDialogContent | null;
    onClose: () => void;
    /** Scrolls to the box that's still open - offered on notices. */
    onShowActiveBox: () => void;
}

const NOTICE_COPY: Record<NoticeReason, string> = {
    "open-box": "before editing something else.",
    "toggle-edit-mode": "before turning the edit boxes off.",
    undo: "before undoing a change.",
};

interface ErrorBodyProps {
    itemLabel: string;
    error: CmsError;
    action: "save" | "undo";
}

const ErrorBody = ({ itemLabel, error, action }: ErrorBodyProps) => (
    <>
        <span className="flex size-11 items-center justify-center rounded-full bg-red-100 text-red-700">
            <AlertTriangle className="size-5" aria-hidden="true" />
        </span>
        <DialogTitle className="text-xl leading-snug font-medium">
            {action === "undo" ? "Couldn't undo the change to" : "Couldn't save"} &ldquo;{itemLabel}&rdquo;
        </DialogTitle>
        <CmsErrorDetails error={error} isInDialog />
        {action === "save" && (
            <p className="text-sm text-teal-dark/60">Your edits are still in the box - nothing has been lost.</p>
        )}
    </>
);

const NoticeBody = ({ activeLabel, reason }: { activeLabel: string; reason: NoticeReason }) => (
    <>
        <span className="flex size-11 items-center justify-center rounded-full bg-violet-100 text-violet-700">
            <PencilLine className="size-5" aria-hidden="true" />
        </span>
        <DialogTitle className="text-xl leading-snug font-medium">Finish your current edit first</DialogTitle>
        <DialogDescription className="text-base leading-relaxed text-teal-dark">
            You&apos;re still editing &ldquo;{activeLabel}&rdquo;. Save or cancel it {NOTICE_COPY[reason]}
        </DialogDescription>
    </>
);

/**
 * The centred pop-up for failed saves and "finish your current edit" notices.
 *
 * @remarks
 * `content` is kept after closing so the text doesn't vanish mid fade-out - `isOpen` alone
 * drives visibility.
 */
export const CmsDialog = ({ isOpen, content, onClose, onShowActiveBox }: CmsDialogProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="gap-5 rounded-3xl bg-cream p-7 text-teal-dark sm:max-w-md">
                {content?.kind === "error" && (
                    <ErrorBody itemLabel={content.itemLabel} error={content.error} action={content.action ?? "save"} />
                )}
                {content?.kind === "notice" && <NoticeBody activeLabel={content.activeLabel} reason={content.reason} />}

                <div className="flex flex-wrap justify-end gap-3 pt-1">
                    {content?.kind === "notice" && (
                        <button type="button" className="btn-pill btn-cream border border-teal-dark/20" onClick={onShowActiveBox}>
                            Show me
                        </button>
                    )}
                    <button type="button" className="btn-pill btn-dark" onClick={onClose}>
                        OK, got it
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};