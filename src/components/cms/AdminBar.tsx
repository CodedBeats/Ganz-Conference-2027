"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/login/actions";
import { useCmsEditor } from "@/hooks/useCmsEditor";

const BAR_LINK = "rounded-full px-3 py-1.5 transition-colors hover:bg-cream/10";

/** Floating admin controls: edit boxes on/off (to preview the page as visitors see it), dashboard, sign out. */
export const AdminBar = () => {
    const { isEditMode, setEditMode } = useCmsEditor();

    return (
        <div className="fixed right-4 bottom-4 z-40 flex items-center gap-1 rounded-full bg-teal-dark py-1.5 pr-1.5 pl-4 text-sm text-cream shadow-xl shadow-teal-dark/30">
            <span className="eyebrow mr-2 text-gold">Admin</span>

            <button
                type="button"
                role="switch"
                aria-checked={isEditMode}
                onClick={() => setEditMode(!isEditMode)}
                className={cn(BAR_LINK, "flex items-center gap-2")}
            >
                <span
                    aria-hidden="true"
                    className={cn(
                        "relative h-5 w-9 rounded-full transition-colors",
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
                Edit boxes
            </button>

            <Link href="/admin" className={BAR_LINK}>
                Dashboard
            </Link>

            <form action={signOutAction}>
                <button type="submit" className={BAR_LINK}>
                    Sign out
                </button>
            </form>
        </div>
    );
};