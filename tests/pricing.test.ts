import { describe, expect, it } from "vitest";
import { isEarlyBird } from "../src/lib/pricing";

describe("isEarlyBird", () => {
    it("returns true when the date is before the cutoff", () => {
        const cutoff = new Date("2027-01-01");
        const now = new Date("2026-12-01");
        expect(isEarlyBird(now, cutoff)).toBe(true);
    });

    it("returns false when the date is after the cutoff", () => {
        const cutoff = new Date("2027-01-01");
        const now = new Date("2027-02-01");
        expect(isEarlyBird(now, cutoff)).toBe(false);
    });
});
