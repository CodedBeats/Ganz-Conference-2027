import { describe, expect, it } from "vitest";
import { PRICE_TO_BE_CONFIRMED, toTicketCardPricing } from "../src/lib/registration/cards";
import { ALL_PRICE_KEYS, buildPriceTable, priceKeyId, type Pricing, type TicketPriceRow } from "../src/lib/registration/pricing";

const CENTS: Record<string, number> = {
    "conference_only:member:early_bird": 48500,
    "conference_only:member:full": 58500,
    "conference_workshop:member:early_bird": 108500,
    "conference_workshop:member:full": 118500,
    "conference_only:non_member:early_bird": 63500,
    "conference_only:non_member:full": 73500,
    "conference_workshop:non_member:early_bird": 123500,
    "conference_workshop:non_member:full": 133500,
};

const pricing = ({
    currentTier = "early_bird",
    placesLeft = 27,
    overrides = {},
}: {
    currentTier?: "early_bird" | "full";
    placesLeft?: number;
    overrides?: Record<string, Partial<TicketPriceRow> | null>;
} = {}): Pricing => {
    const rows = ALL_PRICE_KEYS.flatMap((key): TicketPriceRow[] => {
        const id = priceKeyId(key);
        if (overrides[id] === null) return [];
        return [
            {
                id,
                ticket_option: key.option,
                audience: key.audience,
                tier: key.tier,
                amount_cents: CENTS[id],
                is_active: true,
                ...overrides[id],
            },
        ];
    });
    const built = buildPriceTable(rows);
    if (!built.ok) throw new Error("duplicate rows");
    return {
        isAvailable: true,
        settings: { current_tier: currentTier, early_bird_closes_on: "2027-03-05", workshop_capacity: 27 },
        table: built.table,
        placesLeft,
    };
};

const memberWorkshop = { ticketOption: "conference_workshop", audience: "member" } as const;
const nonMemberConference = { ticketOption: "conference_only", audience: "non_member" } as const;

describe("toTicketCardPricing", () => {
    it("shows both tiers, marking Early Bird as current", () => {
        expect(toTicketCardPricing(nonMemberConference, pricing())).toEqual({
            rows: [
                { tier: "early_bird", label: "Early Bird", price: "$635", isCurrent: true, isClosed: false },
                { tier: "full", label: "Full Registration", price: "$735", isCurrent: false, isClosed: false },
            ],
            placesLeft: null,
            isSoldOut: false,
            registerHref: "/register?option=conference_only&audience=non_member",
        });
    });

    it("closes Early Bird once GANZ switch to Full", () => {
        const card = toTicketCardPricing(nonMemberConference, pricing({ currentTier: "full" }));
        expect(card?.rows.map(({ tier, isCurrent, isClosed }) => ({ tier, isCurrent, isClosed }))).toEqual([
            { tier: "early_bird", isCurrent: false, isClosed: true },
            { tier: "full", isCurrent: true, isClosed: false },
        ]);
    });

    it("shows the workshop places left, and only on workshop cards", () => {
        expect(toTicketCardPricing(memberWorkshop, pricing({ placesLeft: 3 }))).toMatchObject({ placesLeft: 3, isSoldOut: false });
        expect(toTicketCardPricing(nonMemberConference, pricing({ placesLeft: 0 }))).toMatchObject({
            placesLeft: null,
            isSoldOut: false,
        });
    });

    it("marks the workshop as sold out at 0 places", () => {
        expect(toTicketCardPricing(memberWorkshop, pricing({ placesLeft: 0 }))).toMatchObject({ placesLeft: 0, isSoldOut: true });
    });

    it("shows 'To be confirmed' for a missing or inactive price", () => {
        const card = toTicketCardPricing(
            memberWorkshop,
            pricing({
                overrides: {
                    "conference_workshop:member:early_bird": null,
                    "conference_workshop:member:full": { is_active: false },
                },
            }),
        );
        expect(card?.rows.map((row) => row.price)).toEqual([PRICE_TO_BE_CONFIRMED, PRICE_TO_BE_CONFIRMED]);
    });

    it("still renders when the prices couldn't be loaded", () => {
        expect(toTicketCardPricing(memberWorkshop, { isAvailable: false })).toEqual({
            rows: [
                { tier: "early_bird", label: "Early Bird", price: PRICE_TO_BE_CONFIRMED, isCurrent: false, isClosed: false },
                { tier: "full", label: "Full Registration", price: PRICE_TO_BE_CONFIRMED, isCurrent: false, isClosed: false },
            ],
            placesLeft: null,
            isSoldOut: false,
            registerHref: "/register?option=conference_workshop&audience=member",
        });
    });

    it("returns null for a card that isn't linked to a ticket", () => {
        expect(toTicketCardPricing({ ticketOption: null, audience: null }, pricing())).toBeNull();
    });
});