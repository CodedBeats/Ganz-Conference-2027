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
    /** Folded into the navbar's "More" dropdown until the bar is wide enough to show every link. */
    isSecondary?: boolean;
}

/**
 * Every section `type` the site knows how to render. Matches each section's DOM id
 * (`footer` has none). `policies` is the one that renders on `/policies` instead of the home page.
 */
export const SECTION_TYPES = [
    "hero",
    "welcome",
    "program",
    "keynotes",
    "workshop",
    "registrations",
    "submissions",
    "location",
    "accommodation",
    "sponsors",
    "committee",
    "faqs",
    "contact",
    "footer",
    "policies",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

/** Every visual variant the DB's `style` check constraint allows. */
export const CMS_STYLES = ["primary", "secondary", "tertiary"] as const;

/** Visual variant shared by stat items and people (`secondary` = TBC / TBA / dark card). */
export type CmsStyle = (typeof CMS_STYLES)[number];

/**
 * A `files` row resolved through a foreign key.
 *
 * @remarks
 * `file_ref` is a Storage path or a legacy `/public` path - turn it into a URL with
 * `getFileUrl` from `src/lib/cms/files.ts`.
 */
export interface CmsFile {
    id: string;
    name: string;
    file_ref: string;
    mime_type: string;
}

/** A stat item with its nested children (e.g. registration tier -> price rows). */
export interface CmsStatItem {
    id: string;
    label: string;
    value: string;
    description: string | null;
    style: CmsStyle;
    sort_order: number;
    image: CmsFile | null;
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
    image: CmsFile | null;
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
    image: CmsFile | null;
    /** Top-level stat items only - children are nested under their parent. */
    stats: CmsStatItem[];
    people: CmsPerson[];
}

/** All published sections keyed by type. Unpublished sections are simply absent. */
export type PageContent = Partial<Record<SectionType, CmsSection>>;
