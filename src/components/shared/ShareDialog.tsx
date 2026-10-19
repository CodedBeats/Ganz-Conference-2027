"use client";

import { useRef, useState, type ReactNode } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import {
    EmailIcon,
    EmailShareButton,
    FacebookIcon,
    FacebookMessengerIcon,
    FacebookMessengerShareButton,
    FacebookShareButton,
    LinkedinIcon,
    LinkedinShareButton,
    ThreadsIcon,
    ThreadsShareButton,
    WhatsappIcon,
    WhatsappShareButton,
    XIcon,
    XShareButton,
    canNativeShare,
    shareNative,
} from "react-share";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SHARE } from "@/lib/content/site";

// Messenger's web share dialog only works with a Meta app id, so the option is hidden without one
const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

const ICON_SIZE = 44;
const STATUS_RESET_MS = 4000;

// resetButtonStyle is off because react-share's reset is inline styles, which would beat these classes
const TILE_PROPS = {
    resetButtonStyle: false,
    className:
        "flex flex-col items-center gap-2 rounded-2xl px-1 py-3 text-xs font-medium text-teal-dark transition-colors hover:bg-teal-light",
};

type CopyStatus = "idle" | "copied" | "instagram" | "failed";

const STATUS_COPY: Record<Exclude<CopyStatus, "idle">, string> = {
    copied: "Link copied.",
    instagram: "Link copied - Instagram doesn't accept links from a browser, so paste it into a story, post or DM.",
    failed: "Couldn't copy automatically - select the link above and copy it.",
};

// Instagram isn't in react-share (it has no share link), so its mark is drawn here to match the other icons
const InstagramIcon = () => (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 64 64" aria-hidden="true">
        <defs>
            <linearGradient id="share-instagram-gradient" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stopColor="#feda75" />
                <stop offset="0.35" stopColor="#fa7e1e" />
                <stop offset="0.65" stopColor="#d62976" />
                <stop offset="1" stopColor="#4f5bd5" />
            </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="32" fill="url(#share-instagram-gradient)" />
        <rect x="18" y="18" width="28" height="28" rx="8" fill="none" stroke="#fff" strokeWidth="3.5" />
        <circle cx="32" cy="32" r="6.5" fill="none" stroke="#fff" strokeWidth="3.5" />
        <circle cx="40.5" cy="23.5" r="2.2" fill="#fff" />
    </svg>
);

/**
 * The network tiles and copy-link row inside the share dialog.
 *
 * @remarks
 * Kept separate from {@link ShareDialog} because it reads `window` and `navigator` while rendering -
 * the dialog popup only mounts once it's opened, so this never runs on the server.
 *
 * The shared URL is the site root on whatever domain the visitor is on, so staging shares
 * staging and production shares the real domain, without carrying a `#section` hash along.
 */
const ShareOptions = () => {
    const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
    const resetTimer = useRef<number | undefined>(undefined);

    const url = `${window.location.origin}/`;
    const nativeShareData = { title: SHARE.title, text: SHARE.text, url };
    const canShareNatively = canNativeShare(nativeShareData);

    const showStatus = (status: CopyStatus) => {
        setCopyStatus(status);
        window.clearTimeout(resetTimer.current);
        resetTimer.current = window.setTimeout(() => setCopyStatus("idle"), STATUS_RESET_MS);
    };

    const copyLink = async (successStatus: "copied" | "instagram") => {
        try {
            await navigator.clipboard.writeText(url);
            showStatus(successStatus);
        } catch {
            showStatus("failed");
        }
    };

    // the share sheet rejects when the visitor dismisses it - nothing to report
    const openShareSheet = () => shareNative(nativeShareData).catch(() => {});

    // Instagram has no web share link: phones get the share sheet (which lists the Instagram app),
    // everything else gets the link copied to paste in by hand
    const shareToInstagram = () => (canShareNatively ? openShareSheet() : copyLink("instagram"));

    return (
        <>
            <ul className="grid grid-cols-4 gap-1">
                <li>
                    <WhatsappShareButton {...TILE_PROPS} url={url} message={SHARE.text} mobileBehavior="auto">
                        <WhatsappIcon size={ICON_SIZE} aria-hidden="true" />
                        WhatsApp
                    </WhatsappShareButton>
                </li>
                {FACEBOOK_APP_ID && (
                    <li>
                        <FacebookMessengerShareButton {...TILE_PROPS} url={url} appId={FACEBOOK_APP_ID} mobileBehavior="auto">
                            <FacebookMessengerIcon size={ICON_SIZE} aria-hidden="true" />
                            Messenger
                        </FacebookMessengerShareButton>
                    </li>
                )}
                <li>
                    <FacebookShareButton {...TILE_PROPS} url={url}>
                        <FacebookIcon size={ICON_SIZE} aria-hidden="true" />
                        Facebook
                    </FacebookShareButton>
                </li>
                <li>
                    <button type="button" className={TILE_PROPS.className} onClick={shareToInstagram}>
                        <InstagramIcon />
                        Instagram
                    </button>
                </li>
                <li>
                    <LinkedinShareButton {...TILE_PROPS} url={url}>
                        <LinkedinIcon size={ICON_SIZE} aria-hidden="true" />
                        LinkedIn
                    </LinkedinShareButton>
                </li>
                <li>
                    <XShareButton {...TILE_PROPS} url={url} text={SHARE.text}>
                        <XIcon size={ICON_SIZE} aria-hidden="true" />
                        <span>X</span>
                    </XShareButton>
                </li>
                <li>
                    <ThreadsShareButton {...TILE_PROPS} url={url} text={SHARE.text}>
                        <ThreadsIcon size={ICON_SIZE} aria-hidden="true" />
                        Threads
                    </ThreadsShareButton>
                </li>
                <li>
                    <EmailShareButton {...TILE_PROPS} url={url} subject={SHARE.title} body={SHARE.text} separator={"\n\n"}>
                        <EmailIcon size={ICON_SIZE} aria-hidden="true" />
                        Email
                    </EmailShareButton>
                </li>
            </ul>

            <div className="flex items-center gap-2 rounded-full bg-teal-light p-1.5 pl-5">
                <input
                    readOnly
                    value={url}
                    aria-label="Conference link"
                    onFocus={(event) => event.currentTarget.select()}
                    className="min-w-0 flex-1 bg-transparent text-sm text-teal-dark outline-none"
                />
                <button type="button" className="btn-pill btn-dark shrink-0 px-5 py-2.5 hover:bg-teal" onClick={() => copyLink("copied")}>
                    {copyStatus === "copied" ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {copyStatus === "copied" ? "Copied" : "Copy"}
                </button>
            </div>

            <p aria-live="polite" className="-mt-2 min-h-5 text-sm text-teal-dark/70">
                {copyStatus !== "idle" && STATUS_COPY[copyStatus]}
            </p>

            {/* phones and some desktop browsers have a system share sheet with every app on the device */}
            {canShareNatively && (
                <button type="button" className="btn-pill btn-muted -mt-2 hover:bg-teal-light hover:text-teal-dark" onClick={openShareSheet}>
                    <Share2 className="size-4" />
                    More options
                </button>
            )}
        </>
    );
};

interface ShareDialogProps {
    /** Classes for the trigger button. */
    className?: string;
    /** Accessible name for the trigger - needed when `children` is icon-only. */
    ariaLabel?: string;
    children: ReactNode;
}

/**
 * A button that opens the "share this conference" pop-up.
 *
 * @remarks
 * `children` and `className` style the trigger, so each placement (navbar icon, footer pill)
 * brings its own look while sharing one dialog.
 */
export const ShareDialog = ({ className, ariaLabel, children }: ShareDialogProps) => {
    return (
        <Dialog>
            <DialogTrigger className={className} aria-label={ariaLabel}>
                {children}
            </DialogTrigger>
            <DialogContent className="gap-5 rounded-3xl bg-cream p-7 text-teal-dark sm:max-w-md">
                <div className="flex flex-col gap-2 pr-6">
                    <DialogTitle className="text-2xl leading-snug font-medium">Share the conference</DialogTitle>
                    <DialogDescription className="text-base leading-relaxed text-teal-dark/70">
                        Know someone who&apos;d love to be there? Send them the link.
                    </DialogDescription>
                </div>
                <ShareOptions />
            </DialogContent>
        </Dialog>
    );
};