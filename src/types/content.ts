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

/* ---------------------------------------------------------------------------
 * CMS shapes - what `getPageContent` returns from Supabase, before each section
 * maps it into the component-facing shapes above.
 * ------------------------------------------------------------------------- */

/** Every section `type` the home page knows how to render. Matches each section's DOM id. */
export const SECTION_TYPES = [
    "hero",
    "welcome",
    "program",
    "keynotes",
    "registrations",
    "location",
    "accommodation",
    "sponsors",
    "committee",
    "faqs",
    "contact",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

/** Visual variant shared by stat items and people (`secondary` = TBC / TBA / dark card). */
export type CmsStyle = "primary" | "secondary" | "tertiary";

/** An image row resolved through a foreign key. `file_ref` is a `/public` path for now. */
export interface CmsImage {
    id: string;
    name: string;
    file_ref: string;
}

/** A stat item with its nested children (e.g. registration tier -> price rows). */
export interface CmsStatItem {
    id: string;
    label: string;
    value: string;
    description: string | null;
    style: CmsStyle;
    sort_order: number;
    image: CmsImage | null;
    children: CmsStatItem[];
}

/** A keynote presenter or committee member - told apart by the section it belongs to. */
export interface CmsPerson {
    id: string;
    name: string;
    title: string | null;
    location: string | null;
    description: string | null;
    link: string | null;
    style: CmsStyle;
    sort_order: number;
    image: CmsImage | null;
}

/** One published section with everything it owns, ready to hand to its component. */
export interface CmsSection {
    id: string;
    type: SectionType;
    heading: string | null;
    subheading: string | null;
    body: string | null;
    excerpt: string | null;
    sort_order: number;
    image: CmsImage | null;
    /** Top-level stat items only - children are nested under their parent. */
    stats: CmsStatItem[];
    people: CmsPerson[];
}

/** All published sections keyed by type. Unpublished sections are simply absent. */
export type PageContent = Partial<Record<SectionType, CmsSection>>;
