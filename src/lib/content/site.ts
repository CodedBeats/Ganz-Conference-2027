import type { CmsSection, NavLink } from "@/types/content";
import { resolveHref } from "@/lib/content/text";

/**
 * Section links in page order. `id` must match the `id` attribute on each
 * section so anchor links and the active-section observer line up.
 *
 * @remarks
 * `isSecondary` links sit in the navbar's "More" dropdown on laptop widths, where all ten
 * don't fit in one row, so they should be the ones visitors look for least.
 *
 * @see {@link useActiveSection} in `src/hooks/useActiveSection.ts`
 */
export const NAV_LINKS: NavLink[] = [
    { id: "welcome", label: "Welcome" },
    { id: "program", label: "Program" },
    { id: "keynotes", label: "Keynotes" },
    { id: "registrations", label: "Registrations" },
    { id: "location", label: "Location" },
    { id: "accommodation", label: "Accommodation", isSecondary: true },
    { id: "sponsors", label: "Sponsors", isSecondary: true },
    { id: "committee", label: "Committee", isSecondary: true },
    { id: "faqs", label: "FAQs" },
    { id: "contact", label: "Contact" },
];

/**
 * Footer links: the nav links plus Workshop before Registrations and Submissions after it.
 *
 * @remarks
 * Both are kept out of the navbar so the bar doesn't overflow - Submissions is reached from
 * the hero button and Workshop from the ticket cards - but they still get a footer link for
 * anyone who scrolled past.
 */
export const FOOTER_LINKS: NavLink[] = NAV_LINKS.flatMap((link) =>
    link.id === "registrations"
        ? [{ id: "workshop", label: "Workshop" }, link, { id: "submissions", label: "Submissions" }]
        : [link],
);

/**
 * Link to a home page section that works from any page.
 *
 * @remarks
 * On `/` the browser treats `/#id` as a same-page jump (no reload), and from `/policies`
 * it goes home first - a bare `#id` would point at nothing there.
 *
 * @param id - The section's DOM id, e.g. `"registrations"`.
 */
export function sectionHref(id: string): string {
    return `/#${id}`;
}

/**
 * Site config that isn't editable in the CMS (links, map position).
 */
export const EVENT = {
    addressCords: [-27.49343944694796, 153.00669951349366],
    mapsHref:
        "https://maps.app.goo.gl/11kzEXrxXa5RQnWk9",
    submissionsHref: "#submissions",
    programHref: "#program",
    policiesHref: "/policies",
} as const;

/** The registration button in the navbar, hero and Registrations section. */
export interface RegisterCta {
    label: string;
    href: string;
    /** `false` while the link is just a jump down the page, i.e. registration isn't open yet. */
    isOpen: boolean;
}

/** What the button shows until the client sets their own label or link. */
export const REGISTER_CTA_DEFAULTS = {
    label: "Registration opening soon",
    href: "#registrations",
} as const;

/**
 * Builds the registration button from the Registrations section's CMS fields.
 *
 * @remarks
 * The section's `subheading` is the button label and its `excerpt` the link, so the client
 * can flip it to e.g. "Register Now" -> `/register` once Phase 2 ships, without a code change.
 * Until then the link points at the ticket prices, and anything that points within a page
 * (`#...`) counts as "not open yet". A link that fails {@link resolveHref} (e.g. a
 * `javascript:` URL) falls back to the default rather than rendering. In-page anchors come
 * back as `/#...` so the button also works from `/policies`.
 *
 * @param section - The Registrations section, or `undefined` when it's unpublished.
 */
export function getRegisterCta(section?: Pick<CmsSection, "subheading" | "excerpt">): RegisterCta {
    const label = section?.subheading?.trim() || REGISTER_CTA_DEFAULTS.label;
    const link = section?.excerpt?.trim();
    const href = (link && resolveHref(link)) || REGISTER_CTA_DEFAULTS.href;
    const isOpen = !href.startsWith("#");

    return { label, href: isOpen ? href : `/${href}`, isOpen };
}

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
    text: "Join us in Brisbane for the 13th Gestalt Australia & New Zealand Conference, 25-27 June 2027, with a pre-conference workshop on 22-23 June. Celebrating 30 years of GANZ.",
} as const;