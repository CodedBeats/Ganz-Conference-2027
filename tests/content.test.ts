import { afterEach, describe, expect, it, vi } from "vitest";
import {
    groupSectionsByType,
    nestStatItems,
    type SectionRow,
    type StatItemRow,
} from "../src/lib/content/getPageContent";

afterEach(() => {
    vi.restoreAllMocks();
});

const statRow = (overrides: Partial<StatItemRow> & Pick<StatItemRow, "id">): StatItemRow => ({
    label: overrides.id,
    value: "TBC",
    description: null,
    style: "primary",
    sort_order: 0,
    parent_id: null,
    image: null,
    ...overrides,
});

const sectionRow = (overrides: Partial<SectionRow> & Pick<SectionRow, "type">): SectionRow => ({
    id: `${overrides.type}-id`,
    heading: null,
    subheading: null,
    body: null,
    excerpt: null,
    sort_order: 0,
    image: null,
    stat_items: [],
    people: [],
    ...overrides,
});

describe("nestStatItems", () => {
    it("attaches children to their parent and keeps only top-level items at the root", () => {
        const result = nestStatItems([
            statRow({ id: "members" }),
            statRow({ id: "non-members" }),
            statRow({ id: "members-early", parent_id: "members" }),
            statRow({ id: "members-full", parent_id: "members" }),
            statRow({ id: "non-members-early", parent_id: "non-members" }),
        ]);

        expect(result.map((item) => item.id)).toEqual(["members", "non-members"]);
        expect(result[0].children.map((item) => item.id)).toEqual(["members-early", "members-full"]);
        expect(result[1].children.map((item) => item.id)).toEqual(["non-members-early"]);
    });

    it("preserves input order at every level", () => {
        const result = nestStatItems([
            statRow({ id: "b" }),
            statRow({ id: "b-2", parent_id: "b" }),
            statRow({ id: "a" }),
            statRow({ id: "b-1", parent_id: "b" }),
        ]);

        expect(result.map((item) => item.id)).toEqual(["b", "a"]);
        expect(result[0].children.map((item) => item.id)).toEqual(["b-2", "b-1"]);
    });

    it("gives items without children an empty array and strips parent_id", () => {
        const [item] = nestStatItems([statRow({ id: "days", value: "3" })]);

        expect(item.children).toEqual([]);
        expect(item).not.toHaveProperty("parent_id");
    });

    it("keeps a child whose parent is missing at the top level", () => {
        const result = nestStatItems([statRow({ id: "orphan", parent_id: "gone" })]);

        expect(result.map((item) => item.id)).toEqual(["orphan"]);
    });

    it("falls back to the primary style for unknown values", () => {
        const [known, unknown] = nestStatItems([
            statRow({ id: "known", style: "secondary" }),
            statRow({ id: "unknown", style: "neon" }),
        ]);

        expect(known.style).toBe("secondary");
        expect(unknown.style).toBe("primary");
    });
});

describe("groupSectionsByType", () => {
    it("keys sections by type and nests their stat items", () => {
        const content = groupSectionsByType([
            sectionRow({ type: "hero", heading: "In Our Bodies" }),
            sectionRow({
                type: "registrations",
                stat_items: [statRow({ id: "tier" }), statRow({ id: "row", parent_id: "tier" })],
            }),
        ]);

        expect(Object.keys(content)).toEqual(["hero", "registrations"]);
        expect(content.hero?.heading).toBe("In Our Bodies");
        expect(content.registrations?.stats).toHaveLength(1);
        expect(content.registrations?.stats[0].children).toHaveLength(1);
        expect(content.registrations).not.toHaveProperty("stat_items");
    });

    it("skips unknown section types with a warning", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

        const content = groupSectionsByType([sectionRow({ type: "mystery" }), sectionRow({ type: "faqs" })]);

        expect(Object.keys(content)).toEqual(["faqs"]);
        expect(warn).toHaveBeenCalledOnce();
    });

    it("narrows people styles", () => {
        const content = groupSectionsByType([
            sectionRow({
                type: "keynotes",
                people: [
                    {
                        id: "tba",
                        name: "To be announced",
                        title: "Keynote Two",
                        location: null,
                        description: null,
                        link: null,
                        style: "secondary",
                        sort_order: 2,
                        image: null,
                    },
                ],
            }),
        ]);

        expect(content.keynotes?.people[0].style).toBe("secondary");
    });
});