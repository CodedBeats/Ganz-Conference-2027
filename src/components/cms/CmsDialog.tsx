"use client";

import { AlertTriangle, PencilLine } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { CmsError } from "@/types/cms";

/** What the dialog is currently showing. */
export type CmsDialogContent =
    | { kind: "error"; itemLabel: string; error: CmsError }
    | { kind: "notice"; activeLabel: string; reason: "open-box" | "toggle-edit-mode" };

interface CmsDialogProps {
    isOpen: boolean;
    content: CmsDialogContent | null;
    onClose: () => void;
    /** Scrolls to the box that's still open - offered on notices. */
    onShowActiveBox: () => void;
}

const NOTICE_COPY: Record<"open-box" | "toggle-edit-mode", string> = {
    "open-box": "before editing something else.",
    "toggle-edit-mode": "before turning the edit boxes off.",
};

const ErrorBody = ({ itemLabel, error }: { itemLabel: string; error: CmsError }) => (
    <>
        <span className="flex size-11 items-center justify-center rounded-full bg-red-100 text-red-700">
            <AlertTriangle className="size-5" aria-hidden="true" />
        </span>
        <DialogTitle className="text-xl leading-snug font-medium">Couldn&apos;t save &ldquo;{itemLabel}&rdquo;</DialogTitle>

        <div className="space-y-4 text-base leading-relaxed">
            <section>
                <h3 className="eyebrow mb-1 text-teal-dark/50">What happened</h3>
                <DialogDescription className="text-base text-teal-dark">{error.message}</DialogDescription>
            </section>

            {error.hint && (
                <section>
                    <h3 className="eyebrow mb-1 text-teal-dark/50">What to do</h3>
                    <p>{error.hint}</p>
                </section>
            )}

            <p className="text-sm text-teal-dark/60">Your edits are still in the box - nothing has been lost.</p>

            {/* a code is only ever shown next to its explanation */}
            {error.codeMeaning && (
                <details className="rounded-2xl bg-teal-pale px-4 py-3 text-sm">
                    <summary className="cursor-pointer font-medium">Technical details</summary>
                    <p className="mt-2 text-teal-dark/80">
                        {error.code && <span className="font-mono">Error code {error.code}: </span>}
                        {error.codeMeaning}
                    </p>
                </details>
            )}
        </div>
    </>
);

const NoticeBody = ({ activeLabel, reason }: { activeLabel: string; reason: "open-box" | "toggle-edit-mode" }) => (
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
                {content?.kind === "error" && <ErrorBody itemLabel={content.itemLabel} error={content.error} />}
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