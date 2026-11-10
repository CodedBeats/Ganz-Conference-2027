import { describe, expect, it } from "vitest";
import { describePricingChanges, type PricingAuditRow } from "../src/lib/registration/pricingHistory";

const ME = "11111111-1111-4111-8111-111111111111";

const row = (overrides: Partial<PricingAuditRow>): PricingAuditRow => ({
    id: 1,
    before: {},
    after: {},
    changed_by: ME,
    // 2:05pm in Brisbane
    created_at: "2026-11-11T04:05:00Z",
    ticket_price: null,
    ...overrides,
});

describe("describePricingChanges", () => {
    it("describes a price change", () => {
        const [change] = describePricingChanges(
            [
                row({
                    ticket_price: { ticket_option: "conference_workshop", audience: "member", tier: "early_bird" },
                    before: { amount_cents: 108500 },
                    after: { amount_cents: 109000 },
                }),
            ],
            ME,
        );
        expect(change.summary).toBe(
            "GANZ members · Conference + two-day pre-conference workshop · Early Bird: $1,085 → $1,090",
        );
        expect(change.by).toBe("You");
        expect(change.at).toMatch(/11 Nov 2026.*2:05/);
    });

    it("describes a tier switch and a date change in one settings row", () => {
        const [change] = describePricingChanges(
            [
                row({
                    before: { current_tier: "early_bird", early_bird_closes_on: "2027-03-05" },
                    after: { current_tier: "full", early_bird_closes_on: null },
                }),
            ],
            ME,
        );
        expect(change.summary).toBe("Current tier: Early Bird → Full Registration; Early Bird closes: 5 Mar 2027 → no date");
    });

    it("credits other admins without naming them", () => {
        const [change] = describePricingChanges([row({ changed_by: "someone-else" })], ME);
        expect(change.by).toBe("Another admin");
    });

    it("copes with a snapshot it doesn't recognise", () => {
        const [change] = describePricingChanges(
            [
                row({
                    ticket_price: { ticket_option: "conference_only", audience: "non_member", tier: "full" },
                    before: null,
                    after: "unexpected",
                }),
            ],
            ME,
        );
        expect(change.summary).toBe("Non-members · Three-day conference only · Full Registration: ? → ?");
    });
});