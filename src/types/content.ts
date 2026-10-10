/**
 * Content shapes for the marketing site.
 *
 * @remarks
 * The `Cms*` shapes are what `getPageContent` returns from Supabase and are passed
 * straight into the section components. Each section decides how the generic
 * fields map onto its design (e.g. a FAQ is a stat item: `label` = question,
 * `value` = answer).
 */

/** An in-page navigation target. `id` doubles as the section's DOM id. */
export interface NavLink {
    id: string;
    label: string;
}

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

/** Every visual variant the DB's `style` check constraint allows. */
export const CMS_STYLES = ["primary", "secondary", "tertiary"] as const;

/** Visual variant shared by stat items and people (`secondary` = TBC / TBA / dark card). */
export type CmsStyle = (typeof CMS_STYLES)[number];

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
