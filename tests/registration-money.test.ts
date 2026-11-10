import { describe, expect, it } from "vitest";
import { formatCents, isCents, toCents } from "../src/lib/registration/money";

describe("toCents", () => {
    it("accepts whole, non-negative numbers", () => {
        expect(toCents(0)).toBe(0);
        expect(toCents(108500)).toBe(108500);
    });

    it.each([
        ["a fraction", 485.5],
        ["a negative", -1],
        ["NaN", Number.NaN],
        ["Infinity", Number.POSITIVE_INFINITY],
        ["an unsafe integer", Number.MAX_SAFE_INTEGER + 1],
    ])("rejects %s", (_label, value) => {
        expect(isCents(value)).toBe(false);
        expect(() => toCents(value)).toThrow(RangeError);
    });
});

describe("formatCents", () => {
    it.each([
        [48500, "$485"],
        [108500, "$1,085"],
        [133500, "$1,335"],
        [48550, "$485.50"],
        [5, "$0.05"],
        [0, "$0"],
    ])("formats %i as %s", (cents, expected) => {
        expect(formatCents(toCents(cents))).toBe(expected);
    });
});