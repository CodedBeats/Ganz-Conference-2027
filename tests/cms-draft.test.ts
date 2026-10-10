import { describe, expect, it } from "vitest";
import { getChangedFields, hasChanges } from "../src/lib/cms/draft";

const ORIGINAL = { heading: "Welcome", body: null, excerpt: "Quote" };

describe("getChangedFields", () => {
    it("returns only the fields that differ", () => {
        expect(getChangedFields(ORIGINAL, { ...ORIGINAL, heading: "Hello" })).toEqual({ heading: "Hello" });
    });

    it("returns nothing for an untouched draft", () => {
        expect(getChangedFields(ORIGINAL, { ...ORIGINAL })).toEqual({});
    });

    it("treats empty and null as the same value", () => {
        expect(getChangedFields(ORIGINAL, { ...ORIGINAL, body: "" })).toEqual({});
    });

    it("reports clearing a field as a change", () => {
        expect(getChangedFields(ORIGINAL, { ...ORIGINAL, excerpt: "" })).toEqual({ excerpt: "" });
    });

    it("ignores keys the original never had", () => {
        expect(getChangedFields(ORIGINAL, { ...ORIGINAL, type: "hero" })).toEqual({});
    });
});

describe("hasChanges", () => {
    it("is false when not editing or nothing changed", () => {
        expect(hasChanges(ORIGINAL, null)).toBe(false);
        expect(hasChanges(ORIGINAL, { ...ORIGINAL })).toBe(false);
    });

    it("is true once a field differs", () => {
        expect(hasChanges(ORIGINAL, { ...ORIGINAL, heading: "Hi" })).toBe(true);
    });
});