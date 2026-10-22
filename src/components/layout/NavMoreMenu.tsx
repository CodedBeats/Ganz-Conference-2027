"use client";

import { Menu } from "@base-ui/react/menu";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavLink } from "@/types/content";

interface NavMoreMenuProps {
    links: NavLink[];
    /** The section in view, so the trigger stays underlined while one of its links is active. */
    activeId: string | null;
}

/** The navbar's "More" dropdown for the links that don't fit on laptop widths. */
export const NavMoreMenu = ({ links, activeId }: NavMoreMenuProps) => {
    const isActive = links.some((link) => link.id === activeId);

    return (
        <Menu.Root>
            <Menu.Trigger
                openOnHover
                className={cn("nav-link group flex cursor-pointer items-center gap-1 outline-none", isActive && "nav-link-active")}
            >
                More
                <ChevronDown className="size-4 transition-transform duration-200 group-data-popup-open:rotate-180" />
            </Menu.Trigger>

            <Menu.Portal>
                <Menu.Positioner sideOffset={12} align="end" className="z-50">
                    <Menu.Popup className="min-w-44 origin-(--transform-origin) rounded-2xl p-2 bg-cream shadow-lg ring-1 ring-teal-dark/10 outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
                        {links.map((link) => (
                            <Menu.LinkItem
                                key={link.id}
                                href={`#${link.id}`}
                                closeOnClick
                                className={cn(
                                    "block rounded-xl px-3 py-2 text-sm text-teal-dark outline-none transition-colors data-highlighted:bg-teal-light data-highlighted:text-teal",
                                    activeId === link.id && "text-teal",
                                )}
                            >
                                {link.label}
                            </Menu.LinkItem>
                        ))}
                    </Menu.Popup>
                </Menu.Positioner>
            </Menu.Portal>
        </Menu.Root>
    );
};