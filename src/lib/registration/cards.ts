/**
 * What a public ticket card shows: its two prices, the places left and its register link.
 *
 * @remarks
 * A card is a CMS stat item linked to a ticket (`stat_items.ticket_option` / `audience`). Its text
 * is CMS-edited; everything here comes from the database (edited in Admin -> Tickets), so there is
 * no second place to change a price.
 *
 * Client-safe.
 *
 * @module
 */
import { formatCents } from "./money";
import { PRICE_TIER_LABELS, PRICE_TIERS, type Audience, type PriceTier, type TicketOption } from "./options";
import { registerHref } from "./params";
import { getPrice, type Pricing } from "./pricing";

/** Shown in place of a price that can't be loaded or isn't on sale. */
export const PRICE_TO_BE_CONFIRMED = "To be confirmed";

export interface TicketCardPriceRow {
    tier: PriceTier;
    label: string;
    /** Formatted, e.g. `$1,085`, or {@link PRICE_TO_BE_CONFIRMED}. */
    price: string;
    /** The tier new registrations pay now. */
    isCurrent: boolean;
    /** Early Bird once GANZ have switched to Full. */
    isClosed: boolean;
}

export interface TicketCardPricing {
    rows: TicketCardPriceRow[];
    /** Workshop places left; `null` for conference only (no cap) or when it couldn't be loaded. */
    placesLeft: number | null;
    isSoldOut: boolean;
    registerHref: string;
}

/** The card fields that link it to a ticket. */
export interface TicketCardLink {
    ticketOption: TicketOption | null;
    audience: Audience | null;
}

/**
 * Works out a card's prices.
 *
 * @returns `null` for a card that isn't linked to a ticket, which then shows no prices.
 */
export function toTicketCardPricing(card: TicketCardLink, pricing: Pricing): TicketCardPricing | null {
    const { ticketOption: option, audience } = card;
    if (!option || !audience) return null;

    const currentTier = pricing.isAvailable ? pricing.settings.current_tier : null;

    const rows = PRICE_TIERS.map((tier): TicketCardPriceRow => {
        const lookup = pricing.isAvailable ? getPrice(pricing.table, { option, audience, tier }) : null;
        return {
            tier,
            label: PRICE_TIER_LABELS[tier],
            price: lookup?.ok ? formatCents(lookup.price.amount) : PRICE_TO_BE_CONFIRMED,
            isCurrent: tier === currentTier,
            isClosed: tier === "early_bird" && currentTier === "full",
        };
    });

    const placesLeft = option === "conference_workshop" && pricing.isAvailable ? pricing.placesLeft : null;

    return { rows, placesLeft, isSoldOut: placesLeft === 0, registerHref: registerHref(option, audience) };
}