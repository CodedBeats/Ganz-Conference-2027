import { describe, expect, it } from "vitest";
import { checkDollars, pricingFormSchema } from "../src/lib/registration/pricingForm";

const PRICE_ID = "4f1c2f6e-6b39-4b8a-9d55-1b9c0a8c2e11";

const form = (overrides: Record<string, unknown> = {}) => ({
    prices: [{ id: PRICE_ID, dollars: "1,085" }],
    currentTier: "early_bird",
    earlyBirdClosesOn: "2027-03-05",
    ...overrides,
});

describe("checkDollars", () => {
    it("accepts a price", () => {
        expect(checkDollars("1,085.50")).toEqual({ ok: true, cents: 108550 });
    });

    it.each([
        ["", "Enter a price."],
        ["   ", "Enter a price."],
        ["-485", "Enter a price in dollars, e.g. 1085 or 1,085.50."],
        ["abc", "Enter a price in dollars, e.g. 1085 or 1,085.50."],
        ["0", "A price must be more than $0."],
        ["0.00", "A price must be more than $0."],
    ])("refuses %j", (text, message) => {
        expect(checkDollars(text)).toEqual({ ok: false, message });
    });
});

describe("pricingFormSchema", () => {
    it("converts dollars to cents", () => {
        expect(pricingFormSchema.parse(form())).toEqual({
            prices: [{ id: PRICE_ID, amountCents: 108500 }],
            currentTier: "early_bird",
            earlyBirdClosesOn: "2027-03-05",
        });
    });

    it("treats a cleared date as no date", () => {
        expect(pricingFormSchema.parse(form({ earlyBirdClosesOn: "" })).earlyBirdClosesOn).toBeNull();
    });

    it.each([
        ["a blank price", { prices: [{ id: PRICE_ID, dollars: "" }] }],
        ["a negative price", { prices: [{ id: PRICE_ID, dollars: "-5" }] }],
        ["a price id that isn't a UUID", { prices: [{ id: "1", dollars: "485" }] }],
        ["no prices", { prices: [] }],
        ["an unknown tier", { currentTier: "super_early" }],
        ["a malformed date", { earlyBirdClosesOn: "5 March 2027" }],
        ["an extra field (e.g. capacity)", { workshopCapacity: 30 }],
        ["an amount sent directly in cents", { prices: [{ id: PRICE_ID, dollars: "485", amountCents: 1 }] }],
    ])("rejects %s", (_label, overrides) => {
        expect(pricingFormSchema.safeParse(form(overrides)).success).toBe(false);
    });
});