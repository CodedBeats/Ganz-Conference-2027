import { describe, expect, it } from "vitest";
import { quoteRegistration, toRegistrationOffer, type QuoteRequest } from "../src/lib/registration/quote";
import { makePricing } from "./fixtures/pricing";

const request = (overrides: Partial<QuoteRequest> = {}): QuoteRequest => ({
    ticketOption: "conference_only",
    quotedTier: "early_bird",
    membership: { choice: "non_member" },
    ...overrides,
});

describe("quoteRegistration", () => {
    it("prices a non-member at the non-member price", () => {
        expect(quoteRegistration(request(), makePricing())).toEqual({
            ok: true,
            key: { option: "conference_only", audience: "non_member", tier: "early_bird" },
            amount: 63500,
        });
    });

    it.each(["current_member", "joining_member"] as const)("prices %s at the member price", (choice) => {
        const quote = quoteRegistration(request({ ticketOption: "conference_workshop", membership: { choice } }), makePricing());
        expect(quote).toMatchObject({ ok: true, key: { audience: "member" }, amount: 108500 });
    });

    it("uses the server's tier, refusing a form that showed an old one", () => {
        expect(quoteRegistration(request({ quotedTier: "early_bird" }), makePricing({ currentTier: "full" }))).toEqual({
            ok: false,
            error: "tier_changed",
        });
        expect(quoteRegistration(request({ quotedTier: "full" }), makePricing({ currentTier: "full" }))).toMatchObject({
            ok: true,
            amount: 73500,
        });
    });

    it("refuses the workshop at 0 places, but still sells conference only", () => {
        const pricing = makePricing({ placesLeft: 0 });
        expect(quoteRegistration(request({ ticketOption: "conference_workshop" }), pricing)).toEqual({ ok: false, error: "sold_out" });
        expect(quoteRegistration(request(), pricing).ok).toBe(true);
    });

    it("refuses a missing or inactive price", () => {
        const missing = makePricing({ overrides: { "conference_only:non_member:early_bird": null } });
        const inactive = makePricing({ overrides: { "conference_only:non_member:early_bird": { is_active: false } } });
        expect(quoteRegistration(request(), missing)).toEqual({ ok: false, error: "price_unavailable" });
        expect(quoteRegistration(request(), inactive)).toEqual({ ok: false, error: "price_unavailable" });
    });

    it("refuses when prices couldn't be loaded", () => {
        expect(quoteRegistration(request(), { isAvailable: false })).toEqual({ ok: false, error: "price_unavailable" });
    });
});

describe("toRegistrationOffer", () => {
    it("offers both audiences' prices at the current tier", () => {
        expect(toRegistrationOffer(makePricing({ currentTier: "full", placesLeft: 4 }))).toEqual({
            isAvailable: true,
            tier: "full",
            prices: {
                member: { conference_only: "$585", conference_workshop: "$1,185" },
                non_member: { conference_only: "$735", conference_workshop: "$1,335" },
            },
            placesLeft: 4,
        });
    });

    it("leaves out a price that isn't on sale", () => {
        const offer = toRegistrationOffer(makePricing({ overrides: { "conference_workshop:member:early_bird": { is_active: false } } }));
        expect(offer.isAvailable && offer.prices.member.conference_workshop).toBeNull();
    });

    it("is unavailable when prices couldn't be loaded", () => {
        expect(toRegistrationOffer({ isAvailable: false })).toEqual({ isAvailable: false });
    });
});
