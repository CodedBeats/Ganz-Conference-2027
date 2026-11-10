import { describe, expect, it } from "vitest";
import { centsToDollarInput, formatCents, isCents, parseDollarsToCents, toCents } from "../src/lib/registration/money";

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
describe("parseDollarsToCents", () => {
    it.each([
        ["1085", 108500],
        ["1,085", 108500],
        ["$1,085", 108500],
        ["$ 1085", 108500],
        ["1085.5", 108550],
        ["1,085.50", 108550],
        ["0.29", 29],
        ["  485 ", 48500],
        ["0", 0],
    ])("reads %s as %i cents", (text, cents) => {
        expect(parseDollarsToCents(text)).toBe(cents);
    });

    it.each([
        ["blank", ""],
        ["a negative", "-485"],
        ["three decimals", "485.505"],
        ["misplaced commas", "1,08,5"],
        ["letters", "485abc"],
        ["a decimal point with nothing after it", "485."],
        ["two amounts", "485 585"],
    ])("refuses %s", (_label, text) => {
        expect(parseDollarsToCents(text)).toBeNull();
    });
});

describe("centsToDollarInput", () => {
    it.each([
        [108500, "1085"],
        [108550, "1085.50"],
        [48505, "485.05"],
        [29, "0.29"],
    ])("shows %i cents as %s", (cents, text) => {
        expect(centsToDollarInput(toCents(cents))).toBe(text);
    });

    it("round-trips with parseDollarsToCents", () => {
        for (const cents of [1, 29, 48500, 48550, 108500, 133599]) {
            expect(parseDollarsToCents(centsToDollarInput(toCents(cents)))).toBe(cents);
        }
    });
});
