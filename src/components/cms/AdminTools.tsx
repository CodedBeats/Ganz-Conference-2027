"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, FolderOpen, History, LayoutDashboard, LogOut, PencilLine, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/login/actions";
import { useCmsEditor } from "@/hooks/useCmsEditor";
import { useNow } from "@/hooks/useNow";
import { RecentChangesPanel } from "@/components/cms/RecentChangesPanel";

const MENU_ITEM =
    "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-cream/10 focus-visible:bg-cream/10 focus-visible:outline-none";
const MENU_ICON = "size-4 shrink-0 text-gold";

// Items rise in from the launcher upwards, so the bottom one leads. Spelt out in full so
// Tailwind can see the classes; indexed top to bottom to match the menu.
const OPEN_DELAYS = ["delay-[140ms]", "delay-[105ms]", "delay-[70ms]", "delay-[35ms]", "delay-0"];

/** One menu row - the wrapper carries the entrance animation so its delay never slows the hover. */
const MenuRow = ({ index, isOpen, children }: { index: number; isOpen: boolean; children: ReactNode }) => (
    <li
        className={cn(
            "transition duration-300 ease-out motion-reduce:transition-none",
            isOpen ? cn("translate-y-0 opacity-100", OPEN_DELAYS[index]) : "translate-y-2 opacity-0",
        )}
    >
        {children}
    </li>
);

/**
 * The floating admin launcher: one "Admin Tools" button that expands upwards into recent
 * changes, the edit-box switch, files, the dashboard and sign out.
 *
 * @remarks
 * Opens and closes on click only (hover just highlights it), and deliberately ignores clicks
 * elsewhere so it can stay open - with the Recent changes panel beside it - while editing.
 * Esc closes the panel first, then the menu. The collapsed menu stays mounted but `inert` so
 * it can animate both ways; the wrapper ignores the pointer so the invisible menu never
 * blocks the page beneath it.
 */
export const AdminTools = () => {
    const { isEditMode, setEditMode, openFileManager, editSession } = useCmsEditor();
    const [isOpen, setIsOpen] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const launcherRef = useRef<HTMLButtonElement>(null);
    const now = useNow();
    const menuId = useId();
    const panelId = useId();

    // the server cuts the session on each render; this hides it once it lapses in between
    const isSessionLive = editSession.expiresAt !== null && Date.parse(editSession.expiresAt) > now;
    const edits = isSessionLive ? editSession.edits : [];
    const undoableCount = edits.filter((edit) => edit.undoState === "ready").length;

    const toggle = () => {
        if (isOpen) setIsPanelOpen(false);
        setIsOpen(!isOpen);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== "Escape" || !isOpen) return;
        event.stopPropagation();
        if (isPanelOpen) return setIsPanelOpen(false);
        setIsOpen(false);
        launcherRef.current?.focus();
    };

    return (
        <div
            onKeyDown={handleKeyDown}
            className="pointer-events-none fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 font-sans text-sm"
        >
            <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-end">
                {isOpen && isPanelOpen && (
                    <div className="pointer-events-auto">
                        <RecentChangesPanel
                            id={panelId}
                            edits={edits}
                            expiresAt={editSession.expiresAt}
                            now={now}
                            onClose={() => setIsPanelOpen(false)}
                        />
                    </div>
                )}

                <nav
                    id={menuId}
                    aria-label="Admin tools"
                    inert={!isOpen}
                    className={cn(
                        "w-60 origin-bottom-right rounded-3xl bg-teal-dark p-2 text-cream shadow-xl shadow-teal-dark/30 transition duration-300 ease-out motion-reduce:transition-none",
                        isOpen ? "pointer-events-auto" : "translate-y-3 scale-95 opacity-0",
                    )}
                >
                    <ul className="flex flex-col gap-0.5">
                        <MenuRow index={0} isOpen={isOpen}>
                            <button
                                type="button"
                                onClick={() => setIsPanelOpen(!isPanelOpen)}
                                aria-expanded={isPanelOpen}
                                aria-controls={panelId}
                                className={cn(MENU_ITEM, isPanelOpen && "bg-cream/10")}
                            >
                                <History className={MENU_ICON} aria-hidden="true" />
                                Recent changes
                                {undoableCount > 0 && (
                                    <span className="ml-auto rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-teal-dark">
                                        {undoableCount}
                                    </span>
                                )}
                            </button>
                        </MenuRow>

                        <MenuRow index={1} isOpen={isOpen}>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={isEditMode}
                                onClick={() => setEditMode(!isEditMode)}
                                className={MENU_ITEM}
                            >
                                <PencilLine className={MENU_ICON} aria-hidden="true" />
                                Edit boxes
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        "relative ml-auto h-5 w-9 rounded-full transition-colors",
                                        isEditMode ? "bg-violet-500" : "bg-cream/30",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform",
                                            isEditMode && "translate-x-4",
                                        )}
                                    />
                                </span>
                            </button>
                        </MenuRow>

                        <MenuRow index={2} isOpen={isOpen}>
                            <button type="button" onClick={openFileManager} className={MENU_ITEM}>
                                <FolderOpen className={MENU_ICON} aria-hidden="true" />
                                Files
                            </button>
                        </MenuRow>

                        <MenuRow index={3} isOpen={isOpen}>
                            <Link href="/admin" className={MENU_ITEM}>
                                <LayoutDashboard className={MENU_ICON} aria-hidden="true" />
                                Dashboard
                            </Link>
                        </MenuRow>

                        <MenuRow index={4} isOpen={isOpen}>
                            <form action={signOutAction}>
                                <button type="submit" className={MENU_ITEM}>
                                    <LogOut className={MENU_ICON} aria-hidden="true" />
                                    Sign out
                                </button>
                            </form>
                        </MenuRow>
                    </ul>
                </nav>
            </div>

            <button
                ref={launcherRef}
                type="button"
                onClick={toggle}
                aria-expanded={isOpen}
                aria-controls={menuId}
                className={cn(
                    "group pointer-events-auto relative flex items-center gap-3 rounded-full bg-teal-dark py-2 pr-5 pl-2 font-medium text-cream shadow-xl shadow-teal-dark/30 ring-2 transition duration-200 hover:-translate-y-0.5 hover:ring-gold focus-visible:ring-gold focus-visible:outline-none",
                    isOpen ? "ring-gold/50" : "ring-transparent",
                )}
            >
                <span className="relative flex size-9 items-center justify-center rounded-full bg-gold text-teal-dark">
                    <SlidersHorizontal
                        aria-hidden="true"
                        className={cn(
                            "absolute size-4 transition duration-300 motion-reduce:transition-none",
                            isOpen && "rotate-90 scale-50 opacity-0",
                        )}
                    />
                    <ChevronDown
                        aria-hidden="true"
                        className={cn(
                            "absolute size-4 transition duration-300 motion-reduce:transition-none",
                            !isOpen && "-rotate-90 scale-50 opacity-0",
                        )}
                    />
                </span>
                Admin Tools
                {undoableCount > 0 && (
                    <span className="sr-only">
                        , {undoableCount} recent {undoableCount === 1 ? "change" : "changes"} you can undo
                    </span>
                )}
                {undoableCount > 0 && (
                    <span
                        aria-hidden="true"
                        className={cn(
                            "absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[0.65rem] font-bold text-teal-dark ring-2 ring-teal-dark transition duration-200",
                            isOpen && "scale-50 opacity-0",
                        )}
                    >
                        {undoableCount}
                    </span>
                )}
            </button>
        </div>
    );
};