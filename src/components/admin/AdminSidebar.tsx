"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavLink } from "@/types/content";
import { useActiveSection } from "@/hooks/useActiveSection";

interface AdminNavPage {
    label: string;
    href: string;
    /** In-page sections - each `id` must match a section's DOM id on that page. */
    sections: NavLink[];
}

const ADMIN_NAV: AdminNavPage[] = [
    {
        label: "Main",
        href: "/admin",
        sections: [
            { id: "tickets", label: "Tickets" },
            { id: "files", label: "Files" },
            { id: "other", label: "Other" },
        ],
    },
    {
        label: "Registrations",
        href: "/admin/registrations",
        sections: [{ id: "coming-soon", label: "Coming soon" }],
    },
];

export const AdminSidebar = () => {
    const pathname = usePathname();
    const currentPage = ADMIN_NAV.find((page) => page.href === pathname);
    const currentIds = currentPage?.sections.map((section) => section.id) ?? [];
    const activeId = useActiveSection(currentIds);

    // nothing has scrolled into the band yet on first load - treat the top section as active
    const activeSectionId = activeId && currentIds.includes(activeId) ? activeId : currentIds[0];

    // top-28 = AdminHeader's one-line height (~5.6rem from md up) + a 1.5rem gap
    return (
        <nav aria-label="Admin" className="md:sticky md:top-28 md:self-start">
            {/* a scrollable row on mobile, a column beside the content from md up */}
            <ul className="flex gap-8 overflow-x-auto pb-2 md:flex-col md:gap-6 md:overflow-visible md:pb-0">
                {ADMIN_NAV.map((page) => {
                    const isCurrentPage = page === currentPage;

                    return (
                        <li key={page.href} className="shrink-0">
                            <Link
                                href={page.href}
                                aria-current={isCurrentPage ? "page" : undefined}
                                className={cn(
                                    "mb-2 block text-lg font-medium transition-colors hover:text-teal",
                                    isCurrentPage ? "text-teal-dark" : "text-teal-dark/50",
                                )}
                            >
                                {page.label}
                            </Link>

                            <ul className="flex gap-1 md:flex-col">
                                {page.sections.map((section) => (
                                    <li key={section.id}>
                                        {/* same page: scrolls to the anchor; other page: navigates, then jumps to it */}
                                        <Link
                                            href={`${page.href}#${section.id}`}
                                            className={cn(
                                                "block rounded-xl px-3 py-2 text-sm whitespace-nowrap text-teal-dark/70 transition-colors hover:bg-teal-light hover:text-teal",
                                                isCurrentPage && activeSectionId === section.id && "bg-teal-light text-teal",
                                            )}
                                        >
                                            {section.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};