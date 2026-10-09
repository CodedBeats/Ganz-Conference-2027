"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
interface FaqItemProps {
    id: string;
    question: string;
    answer: string;
    defaultOpen?: boolean;
}

export const FaqItem = ({ id, question, answer, defaultOpen = false }: FaqItemProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const hasAnswer = answer.trim().length > 0;
    const panelId = `faq-panel-${id}`;

    return (
        <li className="rounded-3xl bg-teal-pale text-teal-dark">
            <button
                type="button"
                className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left md:px-8"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setIsOpen((prev) => !prev)}
            >
                <span className="text-lg font-medium sm:text-xl">{question}</span>
                {/* rotates 0 -> 225deg (clockwise) to form an "x", back anticlockwise on close */}
                <span className={cn("faq-icon", isOpen && "faq-icon-open")} aria-hidden="true">
                    <Plus className="size-4" strokeWidth={2.5} />
                </span>
            </button>

            <div
                id={panelId}
                className={cn(
                    "grid transition-[grid-template-rows] duration-300",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
            >
                <div className="min-h-0 overflow-hidden">
                    <p className="px-6 pb-6 text-base leading-relaxed text-teal-dark/75 md:px-8">
                        {hasAnswer ? answer : "Answer coming soon."}
                    </p>
                </div>
            </div>
        </li>
    );
};