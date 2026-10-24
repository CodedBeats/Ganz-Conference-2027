"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LINKS, sectionHref, type RegisterCta } from "@/lib/content/site";
import { useActiveSection } from "@/hooks/useActiveSection";
import { NavMoreMenu } from "@/components/layout/NavMoreMenu";

const SECTION_IDS = NAV_LINKS.map((link) => link.id);
const SECONDARY_LINKS = NAV_LINKS.filter((link) => link.isSecondary);

export const Navbar = ({ registerCta }: { registerCta: RegisterCta }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const activeId = useActiveSection(SECTION_IDS);

    const closeMenu = () => setIsMenuOpen(false);

    return (
        <nav className="sticky top-0 border-b border-teal-dark/10 bg-cream/95 backdrop-blur z-50">
            <div className="container-site flex h-20 items-center justify-between gap-6">
                {/* logo + conference title */}
                <a href={sectionHref("top")} className="flex shrink-0 items-center gap-3" onClick={closeMenu}>
                    <Image
                        src="/design/logo/GANZLogo_FullColour.png"
                        alt="GANZ - Gestalt Australia & New Zealand"
                        width={64}
                        height={56}
                        priority
                        className="h-14 w-auto"
                    />
                    <span className="eyebrow leading-[1.4] text-teal-dark">
                        13th GANZ
                        <br />
                        Conference
                        <br />
                        2027
                    </span>
                </a>

                {/* desktop links - secondary ones fold into "More" until the container is at full width */}
                <ul className="hidden items-center gap-5 nav:flex wide:gap-6">
                    {NAV_LINKS.map((link) => (
                        <li key={link.id} className={cn(link.isSecondary && "hidden wide:block")}>
                            <a
                                href={sectionHref(link.id)}
                                className={cn("nav-link", activeId === link.id && "nav-link-active")}
                            >
                                {link.label}
                            </a>
                        </li>
                    ))}
                    <li className="wide:hidden">
                        <NavMoreMenu links={SECONDARY_LINKS} activeId={activeId} />
                    </li>
                </ul>

                <div className="flex items-center gap-3">
                    {/* label and link come from the CMS - see getRegisterCta */}
                    <a href={registerCta.href} className="btn-pill btn-dark hidden whitespace-nowrap hover:bg-teal sm:inline-flex">
                        {registerCta.label}
                    </a>

                    <button
                        type="button"
                        className="flex size-11 items-center justify-center rounded-full text-teal-dark transition-colors hover:bg-teal nav:hidden"
                        aria-expanded={isMenuOpen}
                        aria-controls="mobile-nav"
                        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                        onClick={() => setIsMenuOpen((prev) => !prev)}
                    >
                        {isMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
                    </button>
                </div>
            </div>

            {/* mobile slide-down menu */}
            <div
                id="mobile-nav"
                className={cn(
                    "grid overflow-hidden transition-[grid-template-rows] duration-300 nav:hidden",
                    isMenuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
            >
                <div className="min-h-0">
                    <ul className="container-site flex flex-col gap-1 border-t border-teal-dark/10 py-4">
                        {NAV_LINKS.map((link) => (
                            <li key={link.id}>
                                <a
                                    href={sectionHref(link.id)}
                                    onClick={closeMenu}
                                    className={cn(
                                        "block rounded-xl px-3 py-2.5 text-base font-medium text-teal-dark transition-colors hover:bg-teal-light hover:text-teal",
                                        activeId === link.id && "bg-teal-light text-teal",
                                    )}
                                >
                                    {link.label}
                                </a>
                            </li>
                        ))}
                        <li className="pt-3 sm:hidden">
                            <a href={registerCta.href} onClick={closeMenu} className="btn-pill btn-dark w-full">
                                {registerCta.label}
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
};