import { describe, expect, it } from "vitest";
import {
    IMAGE_UPDATE_FIELDS,
    PERSON_CREATE_FIELDS,
    PERSON_UPDATE_FIELDS,
    SECTION_UPDATE_FIELDS,
    STAT_ITEM_CREATE_FIELDS,
    isValidId,
    sanitizeInput,
} from "../src/lib/cms/fields";

const SECTION_ID = "6f1c2a8e-4b3d-4e7f-9a2b-1c3d4e5f6a7b";

describe("isValidId", () => {
    it("accepts uuids and rejects anything else", () => {
        expect(isValidId(SECTION_ID)).toBe(true);
        expect(isValidId(SECTION_ID.toUpperCase())).toBe(true);
        expect(isValidId("not-a-uuid")).toBe(false);
        expect(isValidId("")).toBe(false);
        expect(isValidId(42)).toBe(false);
        expect(isValidId(null)).toBe(false);
    });
});

describe("sanitizeInput", () => {
    it("strips keys that aren't in the schema", () => {
        const result = sanitizeInput(
            { name: "Ada", id: SECTION_ID, updated_at: "2026-01-01", section_id: SECTION_ID },
            PERSON_UPDATE_FIELDS,
            { isPartial: true },
        );

        expect(result).toEqual({ values: { name: "Ada" }, error: null });
    });

    it("trims text and turns empty nullable text into null", () => {
        const result = sanitizeInput({ heading: "  Welcome  ", excerpt: "   " }, SECTION_UPDATE_FIELDS, {
            isPartial: true,
        });

        expect(result.values).toEqual({ heading: "Welcome", excerpt: null });
    });

    it("keeps explicit nulls on nullable columns", () => {
        const result = sanitizeInput({ body: null, image_id: null }, SECTION_UPDATE_FIELDS, { isPartial: true });

        expect(result.values).toEqual({ body: null, image_id: null });
    });

    it("turns an empty nullable id into null", () => {
        const result = sanitizeInput({ image: "" }, PERSON_UPDATE_FIELDS, { isPartial: true });

        expect(result.values).toEqual({ image: null });
    });

    it("rejects missing required fields on create", () => {
        const result = sanitizeInput({ section_id: SECTION_ID, title: "Keynote" }, PERSON_CREATE_FIELDS, {
            isPartial: false,
        });

        expect(result).toEqual({ values: null, error: "Name is required." });
    });

    it("lets optional fields fall back to DB defaults on create", () => {
        const result = sanitizeInput({ section_id: SECTION_ID, label: "Days", value: "3" }, STAT_ITEM_CREATE_FIELDS, {
            isPartial: false,
        });

        expect(result.values).toEqual({ section_id: SECTION_ID, label: "Days", value: "3" });
    });

    it("allows blank stat values but still requires them on create", () => {
        expect(sanitizeInput({ value: "   " }, STAT_ITEM_CREATE_FIELDS, { isPartial: true }).values).toEqual({ value: "" });
        expect(
            sanitizeInput({ section_id: SECTION_ID, label: "Sponsor one" }, STAT_ITEM_CREATE_FIELDS, { isPartial: false }).error,
        ).toBe("Value is required.");
        expect(sanitizeInput({ value: null }, STAT_ITEM_CREATE_FIELDS, { isPartial: true }).error).toBe(
            "Value must be text.",
        );
    });

    it("rejects blank required text even on update", () => {
        const result = sanitizeInput({ name: "   " }, PERSON_UPDATE_FIELDS, { isPartial: true });

        expect(result.error).toBe("Name is required.");
    });

    it("rejects unknown styles", () => {
        const result = sanitizeInput({ style: "neon" }, PERSON_UPDATE_FIELDS, { isPartial: true });

        expect(result.error).toMatch(/^Style must be one of/);
    });

    it("rejects non-integer sort orders", () => {
        expect(sanitizeInput({ sort_order: 1.5 }, SECTION_UPDATE_FIELDS, { isPartial: true }).error).toBe(
            "Sort order must be a whole number.",
        );
        expect(sanitizeInput({ sort_order: "2" }, SECTION_UPDATE_FIELDS, { isPartial: true }).error).toBe(
            "Sort order must be a whole number.",
        );
    });

    it("rejects wrongly typed values", () => {
        expect(sanitizeInput({ is_published: "yes" }, SECTION_UPDATE_FIELDS, { isPartial: true }).error).toBe(
            "Is published must be true or false.",
        );
        expect(sanitizeInput({ file_ref: 7 }, IMAGE_UPDATE_FIELDS, { isPartial: true }).error).toBe(
            "File ref must be text.",
        );
        expect(sanitizeInput({ image: "nope" }, PERSON_UPDATE_FIELDS, { isPartial: true }).error).toBe(
            "Image is invalid.",
        );
    });

    it("rejects an update with nothing editable in it", () => {
        expect(sanitizeInput({}, SECTION_UPDATE_FIELDS, { isPartial: true }).error).toBe("Nothing to save.");
        expect(sanitizeInput({ type: "hero" }, SECTION_UPDATE_FIELDS, { isPartial: true }).error).toBe(
            "Nothing to save.",
        );
    });

    it("rejects payloads that aren't plain objects", () => {
        expect(sanitizeInput(null, SECTION_UPDATE_FIELDS, { isPartial: true }).error).toBe("Nothing to save.");
        expect(sanitizeInput(["heading"], SECTION_UPDATE_FIELDS, { isPartial: true }).error).toBe("Nothing to save.");
        expect(sanitizeInput("heading", SECTION_UPDATE_FIELDS, { isPartial: true }).error).toBe("Nothing to save.");
    });
});