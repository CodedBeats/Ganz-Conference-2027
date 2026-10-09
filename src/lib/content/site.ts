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
 *
 * @remarks
 * `dates` and `email` duplicate the hero "Dates" stat and the contact section body -
 * they're only here for the Navbar/Footer until those read from the CMS too.
 */
export const EVENT = {
    // TODO: read from the CMS (hero stats / contact section) so they can't drift
    dates: "25-27 June 2027",
    email: "contact@ganz.org.au",
    addressCords: [-27.96297382840529, 153.38469244106162],
    mapsHref:
        "https://www.google.com/maps/search/?api=1&query=Griffith+University+Gold+Coast+Campus",
    // TODO: point at the dedicated /register page once registration (phase 2) is built.
    registerHref: "#registrations",
    programHref: "#program",
} as const;