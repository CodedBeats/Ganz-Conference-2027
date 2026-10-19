import type { NavLink } from "@/types/content";

/**
 * Section links in page order. `id` must match the `id` attribute on each
 * section so anchor links and the active-section observer line up.
 *
 * @see {@link useActiveSection} in `src/hooks/useActiveSection.ts`
 */
export const NAV_LINKS: NavLink[] = [
    { id: "welcome", label: "Welcome" },
    { id: "program", label: "Program" },
    { id: "keynotes", label: "Keynotes" },
    { id: "registrations", label: "Registrations" },
    { id: "location", label: "Location" },
    { id: "accommodation", label: "Accommodation" },
    { id: "sponsors", label: "Sponsors" },
    { id: "committee", label: "Committee" },
    { id: "faqs", label: "FAQs" },
    { id: "contact", label: "Contact" },
];

/**
 * Site config that isn't editable in the CMS (links, map position).
 */
export const EVENT = {
    addressCords: [-27.49343944694796, 153.00669951349366],
    mapsHref:
        "https://maps.app.goo.gl/11kzEXrxXa5RQnWk9",
    // TODO: point at the dedicated /register page once registration (phase 2) is built.
    registerHref: "#registrations",
    programHref: "#program",
} as const;