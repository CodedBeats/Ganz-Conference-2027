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
 * Footer links: the nav links plus Submissions, after Registrations.
 *
 * @remarks
 * Submissions is reached from the hero button and kept out of the navbar so the bar
 * doesn't overflow, but it still gets a footer link for anyone who scrolled past the hero.
 */
export const FOOTER_LINKS: NavLink[] = NAV_LINKS.flatMap((link) =>
    link.id === "registrations" ? [link, { id: "submissions", label: "Submissions" }] : [link],
);

/**
 * Site config that isn't editable in the CMS (links, map position).
 */
export const EVENT = {
    addressCords: [-27.49343944694796, 153.00669951349366],
    mapsHref:
        "https://maps.app.goo.gl/11kzEXrxXa5RQnWk9",
    // TODO: point at the dedicated /register page once registration (phase 2) is built.
    registerHref: "#registrations",
    submissionsHref: "#submissions",
    programHref: "#program",
} as const;

/**
 * Copy sent along with a shared link.
 *
 * @remarks
 * Only the networks that take prefilled text use this (WhatsApp, X, Threads, email).
 * Facebook, LinkedIn and Messenger ignore it and build their preview card from the
 * page's Open Graph metadata instead.
 *
 * @see `ShareDialog` in `src/components/shared/ShareDialog.tsx`
 */
export const SHARE = {
    title: "GANZ Conference 2027 - In Our Bodies, Of The Field",
    text: "Join us at the 13th Gestalt Australia & New Zealand Conference, 25-27 June 2027. Celebrating 30 years of GANZ.",
} as const;