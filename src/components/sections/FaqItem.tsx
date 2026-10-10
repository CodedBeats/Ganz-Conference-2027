"use client";

import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCmsBox } from "@/hooks/useCmsBox";

interface FaqItemProps {
    id: string;
    /** Server-rendered so it can carry a CMS edit field. */
    question: ReactNode;
    answer: ReactNode;
    defaultOpen?: boolean;
}

// The accordion body of one FAQ - the surrounding `li` (and its CMS box) is rendered by Faq.
export const FaqItem = ({ id, question, answer, defaultOpen = false }: FaqItemProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const panelId = `faq-panel-${id}`;

    // while editing, the question can't live inside the toggle button (an input in a button
    // is invalid and every click would toggle), and the answer has to stay visible
    const isEditing = useCmsBox()?.isEditing ?? false;
    const isExpanded = isOpen || isEditing;

    return (
        <>
            {isEditing ? (
                <div className="px-6 py-5 text-lg font-medium sm:text-xl md:px-8">{question}</div>
            ) : (
                <button
                    type="button"
                    className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left md:px-8"
                    aria-expanded={isExpanded}
                    aria-controls={panelId}
                    onClick={() => setIsOpen((prev) => !prev)}
                >
                    <span className="text-lg font-medium sm:text-xl">{question}</span>
                    {/* rotates 0 -> 225deg (clockwise) to form an "x", back anticlockwise on close */}
                    <span className={cn("faq-icon", isExpanded && "faq-icon-open")} aria-hidden="true">
                        <Plus className="size-4" strokeWidth={2.5} />
                    </span>
                </button>
            )}

            <div
                id={panelId}
                className={cn(
                    "grid transition-[grid-template-rows] duration-300",
                    isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
            >
                <div className="min-h-0 overflow-hidden">
                    <div className="px-6 pb-6 text-base leading-relaxed text-teal-dark/75 md:px-8">{answer}</div>
                </div>
            </div>
        </>
    );
};