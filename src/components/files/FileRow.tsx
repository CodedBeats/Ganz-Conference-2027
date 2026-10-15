"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FileRowProps {
    icon: ReactNode;
    name: string;
    /** Shown dimmed straight after the name, e.g. `.jpg`. */
    suffix?: string;
    /** Right-aligned detail, e.g. "3 files". */
    meta?: string;
    isSelected?: boolean;
    onClick: () => void;
}

/** One clickable row in the file manager list - a folder, a file, or the "back" row. */
export const FileRow = ({ icon, name, suffix, meta, isSelected = false, onClick }: FileRowProps) => {
    return (
        <li>
            <button
                type="button"
                onClick={onClick}
                aria-current={isSelected || undefined}
                className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    isSelected ? "bg-teal-dark text-cream" : "text-teal-dark hover:bg-teal-pale",
                )}
            >
                <span className={cn("shrink-0", isSelected ? "text-gold" : "text-teal")} aria-hidden="true">
                    {icon}
                </span>
                <span className="min-w-0 flex-1 truncate">
                    {name}
                    {suffix && <span className={isSelected ? "text-cream/60" : "text-teal-dark/50"}>{suffix}</span>}
                </span>
                {meta && <span className={cn("shrink-0 text-sm", isSelected ? "text-cream/70" : "text-teal-dark/50")}>{meta}</span>}
            </button>
        </li>
    );
};