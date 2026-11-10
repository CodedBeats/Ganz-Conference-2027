/** Test pricing built from the 8 seeded prices (Michelle, 23 Oct). */
import { ALL_PRICE_KEYS, buildPriceTable, priceKeyId, type Pricing, type TicketPriceRow } from "../../src/lib/registration/pricing";
import type { PriceTier } from "../../src/lib/registration/options";

export const SEEDED_CENTS: Record<string, number> = {
    "conference_only:member:early_bird": 48500,
    "conference_only:member:full": 58500,
    "conference_workshop:member:early_bird": 108500,
    "conference_workshop:member:full": 118500,
    "conference_only:non_member:early_bird": 63500,
    "conference_only:non_member:full": 73500,
    "conference_workshop:non_member:early_bird": 123500,
    "conference_workshop:non_member:full": 133500,
};

interface PricingOptions {
    currentTier?: PriceTier;
    placesLeft?: number;
    /** Per price key id: overrides for that row, or `null` to leave it out. */
    overrides?: Record<string, Partial<TicketPriceRow> | null>;
}

export function makePricing({ currentTier = "early_bird", placesLeft = 27, overrides = {} }: PricingOptions = {}): Pricing {
    const rows = ALL_PRICE_KEYS.flatMap((key): TicketPriceRow[] => {
        const id = priceKeyId(key);
        if (overrides[id] === null) return [];
        return [
            {
                id,
                ticket_option: key.option,
                audience: key.audience,
                tier: key.tier,
                amount_cents: SEEDED_CENTS[id],
                is_active: true,
                ...overrides[id],
            },
        ];
    });

    const built = buildPriceTable(rows);
    if (!built.ok) throw new Error("duplicate rows in test pricing");
    return {
        isAvailable: true,
        settings: { current_tier: currentTier, early_bird_closes_on: "2027-03-05", workshop_capacity: 27 },
        table: built.table,
        placesLeft,
    };
}
