/**
 * Content shapes for the marketing site.
 *
 * @remarks
 * These currently describe static arrays in `src/lib/content/*`. Once the CMS
 * is live, the same shapes are intended to be returned from Supabase queries so
 * components don't need to change.
 */

/** An in-page navigation target. `id` doubles as the section's DOM id. */
export interface NavLink {
    id: string;
    label: string;
}

/** A single headline number shown in the Program section's stat cards. */
export interface StatItem {
    value: string;
    label: string;
    /** Values like "TBC" are rendered in the accent colour rather than bold dark. */
    isPending?: boolean;
}

/** A keynote presenter. Unannounced presenters only carry the `title`/`blurb` copy. */
export interface Keynote {
    id: string;
    isAnnounced: boolean;
    name: string;
    /** Small uppercase line under the name - location for announced, ordinal for TBA. */
    subtitle: string;
    bio: string;
    imageSrc?: string;
    website?: string;
}

/** A conference committee member. */
export interface CommitteeMember {
    id: string;
    name: string;
    role: string;
    bio: string;
    imageSrc?: string;
    /** Renders the pale "More to come" card instead of a person. */
    isPlaceholder?: boolean;
}

/** One expandable question in the FAQ section. */
export interface FaqItem {
    id: string;
    question: string;
    answer: string;
}

/** A single price line inside a registration tier card. */
export interface PriceRow {
    label: string;
    price: string;
}

/** A registration tier (e.g. GANZ Members, Non-Members, Scholarships). */
export interface PricingTier {
    id: string;
    title: string;
    subtitle: string;
    rows: PriceRow[];
    /** Optional supporting copy shown under the price rows. */
    note?: string;
    /** `dark` renders the teal-dark variant used for Scholarships. */
    tone: "light" | "dark";
}

/** A sponsor or partner logo slot. */
export interface Sponsor {
    id: string;
    name: string;
    logoSrc?: string;
    href?: string;
}
