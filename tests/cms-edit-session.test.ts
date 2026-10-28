import { describe, expect, it } from "vitest";
import { getFieldLabel, getRowChanges, getSessionEdits, getUndoState } from "../src/lib/cms/editSession";

const NOW = new Date("2026-10-29T10:00:00.000Z");

/** An ISO time `minutes` before {@link NOW}. */
const ago = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000).toISOString();

const edit = (id: string, createdMinutesAgo: number, revertedMinutesAgo: number | null = null) => ({
    id,
    createdAt: ago(createdMinutesAgo),
    revertedAt: revertedMinutesAgo === null ? null : ago(revertedMinutesAgo),
});

describe("getSessionEdits", () => {
    it("keeps a continuous run of edits, newest first, and expires 10 minutes after the latest", () => {
        const session = getSessionEdits([edit("a", 25), edit("b", 2), edit("c", 16), edit("d", 8)], NOW);

        expect(session.edits.map((entry) => entry.id)).toEqual(["b", "d", "c", "a"]);
        expect(session.expiresAt).toBe(new Date(NOW.getTime() + 8 * 60_000).toISOString());
    });

    it("cuts the session at the first gap of 10 minutes or more", () => {
        const session = getSessionEdits([edit("old", 30), edit("before-break", 19), edit("recent", 5), edit("latest", 1)], NOW);

        expect(session.edits.map((entry) => entry.id)).toEqual(["latest", "recent"]);
    });

    it("has no live session once the latest activity is 10 minutes old", () => {
        expect(getSessionEdits([edit("a", 10), edit("b", 12)], NOW)).toEqual({ edits: [], expiresAt: null });
        expect(getSessionEdits([], NOW)).toEqual({ edits: [], expiresAt: null });
    });

    it("counts undos as activity that keeps the session going", () => {
        // saved 14 min ago, undone 6 min ago - without the undo this would have lapsed
        const session = getSessionEdits([edit("a", 14, 6)], NOW);

        expect(session.edits.map((entry) => entry.id)).toEqual(["a"]);
        expect(session.expiresAt).toBe(new Date(NOW.getTime() + 4 * 60_000).toISOString());
    });

    it("bridges a gap with an undo made in between", () => {
        const session = getSessionEdits([edit("first", 18, 9), edit("second", 1)], NOW);

        expect(session.edits.map((entry) => entry.id)).toEqual(["second", "first"]);
    });
});

describe("getUndoState", () => {
    const saved = { after: { heading: "New", body: null }, revertedAt: null };

    it("is ready while the row still holds what the edit saved", () => {
        expect(getUndoState(saved, { heading: "New", body: "" })).toBe("ready");
    });

    it("is stale once any of its fields changed again", () => {
        expect(getUndoState(saved, { heading: "Newer", body: null })).toBe("stale");
    });

    it("is missing when the row is gone", () => {
        expect(getUndoState(saved, null)).toBe("missing");
    });

    it("is undone once reverted, whatever the row holds", () => {
        expect(getUndoState({ ...saved, revertedAt: ago(1) }, { heading: "Old" })).toBe("undone");
    });
});

describe("getRowChanges", () => {
    it("keeps only the listed fields that actually changed", () => {
        const before = { id: "x", heading: "Old", body: "Same", updated_at: "1" };
        const after = { id: "x", heading: "New", body: "Same", updated_at: "2" };

        expect(getRowChanges(before, after, ["heading", "body"])).toEqual({
            before: { heading: "Old" },
            after: { heading: "New" },
        });
    });

    it("treats null and empty text as the same", () => {
        expect(getRowChanges({ body: null }, { body: "" }, ["body"])).toBeNull();
    });
});

describe("getFieldLabel", () => {
    it("uses friendly names where the column name isn't one", () => {
        expect(getFieldLabel("image_id")).toBe("Image");
        expect(getFieldLabel("body")).toBe("Text");
        expect(getFieldLabel("subheading")).toBe("Subheading");
    });
});