import { createClient } from "@/lib/supabase/server";
import {
    SECTION_TYPES,
    type CmsImage,
    type CmsPerson,
    type CmsSection,
    type CmsStatItem,
    type CmsStyle,
    type PageContent,
} from "@/types/content";

const CMS_STYLES: readonly CmsStyle[] = ["primary", "secondary", "tertiary"];

/** A stat item as it comes back from the query - flat, with `parent_id` still on it. */
export interface StatItemRow {
    id: string;
    label: string;
    value: string;
    description: string | null;
    style: string;
    sort_order: number;
    parent_id: string | null;
    image: CmsImage | null;
}

/** A person as it comes back from the query. */
export interface PersonRow extends Omit<CmsPerson, "style"> {
    style: string;
}

/** A section as it comes back from the query, with its children embedded. */
export interface SectionRow extends Omit<CmsSection, "type" | "stats" | "people"> {
    type: string;
    stat_items: StatItemRow[];
    people: PersonRow[];
}

/**
 * Narrows the DB's free-text `style` column to a known variant.
 *
 * @remarks
 * The column has a check constraint, so the fallback should never be hit - it just
 * keeps the type honest without an assertion.
 */
function toStyle(value: string): CmsStyle {
    return CMS_STYLES.find((style) => style === value) ?? "primary";
}

/** Drops `parent_id` and starts the item with no children - {@link nestStatItems} fills them in. */
function toStatItem(row: StatItemRow): CmsStatItem {
    return {
        id: row.id,
        label: row.label,
        value: row.value,
        description: row.description,
        style: toStyle(row.style),
        sort_order: row.sort_order,
        image: row.image,
        children: [],
    };
}

/**
 * Turns flat stat item rows into a tree, attaching each child to its parent's `children`.
 *
 * @remarks
 * Only one level is used today (registration tier -> price rows), but this handles any
 * depth. Input order is preserved at every level, so pass rows already sorted by
 * `sort_order` (the query does this). A row whose parent isn't in the list is kept at
 * the top level rather than silently dropped.
 *
 * @param rows - Every stat item for one section, top-level and children mixed.
 * @returns Top-level items only, each with its children nested.
 */
export function nestStatItems(rows: StatItemRow[]): CmsStatItem[] {
    const entries = rows.map((row) => ({ parentId: row.parent_id, item: toStatItem(row) }));
    const itemsById = new Map(entries.map(({ item }) => [item.id, item]));

    const roots: CmsStatItem[] = [];
    for (const { parentId, item } of entries) {
        const parent = parentId ? itemsById.get(parentId) : undefined;
        if (parent) {
            parent.children.push(item);
        } else {
            roots.push(item);
        }
    }
    return roots;
}

/**
 * Builds the {@link PageContent} map from section rows, keyed by section `type`.
 *
 * @remarks
 * Rows with a `type` the site doesn't know about are skipped with a warning, so a
 * stray section added in the CMS can't break the page.
 *
 * @param rows - Published sections with their stat items and people embedded.
 */
export function groupSectionsByType(rows: SectionRow[]): PageContent {
    const content: PageContent = {};

    for (const { stat_items, people, ...section } of rows) {
        const type = SECTION_TYPES.find((sectionType) => sectionType === section.type);
        if (!type) {
            console.warn(`[getPageContent] skipping unknown section type "${section.type}"`);
            continue;
        }

        content[type] = {
            ...section,
            type,
            stats: nestStatItems(stat_items),
            people: people.map((person) => ({ ...person, style: toStyle(person.style) })),
        };
    }

    return content;
}

/**
 * Fetches every published section of the home page with its stat items, people and images.
 *
 * @remarks
 * Everything comes back in a single PostgREST request using embedded relations, ordered
 * by `sort_order` at each level. `is_published` is filtered explicitly even though RLS
 * already hides drafts from the public - a logged-in admin passes `is_admin()` and would
 * otherwise see draft sections on the live page.
 *
 * Image `file_ref`s are passed through untouched (currently `/public` paths).
 *
 * @returns Published sections keyed by type - see {@link PageContent}.
 * @throws If the Supabase query fails.
 */
export async function getPageContent(): Promise<PageContent> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("sections")
        .select(
            `id, type, heading, subheading, body, excerpt, sort_order,
            image:images(id, name, file_ref),
            stat_items(id, label, value, description, style, sort_order, parent_id, image:images(id, name, file_ref)),
            people(id, name, title, location, description, link, style, sort_order, image:images(id, name, file_ref))`,
        )
        .eq("is_published", true)
        .order("sort_order")
        .order("sort_order", { referencedTable: "stat_items" })
        .order("sort_order", { referencedTable: "people" });

    if (error) {
        console.error("[getPageContent]", error);
        throw new Error(`Failed to load page content: ${error.message}`);
    }

    return groupSectionsByType(data);
}
