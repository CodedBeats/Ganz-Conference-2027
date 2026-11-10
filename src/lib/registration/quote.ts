/**
 * What a registration costs right now, for the `/register` form and its server action.
 *
 * @remarks
 * {@link quoteRegistration} makes the same checks `create_pending_registration` makes in the
 * database (tier still current, price on sale, workshop not full). The preview uses it to say what
 * would be charged; once checkout exists (P2-15) the database function stays the authority and this
 * remains the friendly early check.
 *
 * Client-safe.
 *
 * @module
 */
import { formatCents, type Cents } from "./money";
import { audienceFor, type Audience, type MembershipChoice, type PriceTier, type TicketOption } from "./options";
import { getPrice, type PriceKey, type Pricing } from "./pricing";
import type { CreateRegistrationError } from "./schema";

export type QuoteResult =
    | { ok: true; key: PriceKey; amount: Cents }
    | { ok: false; error: Extract<CreateRegistrationError, "tier_changed" | "price_unavailable" | "sold_out"> };

export interface QuoteRequest {
    ticketOption: TicketOption;
    /** The tier the form showed. */
    quotedTier: PriceTier;
    membership: { choice: MembershipChoice };
}

/** Prices one submission with the server's current settings. */
export function quoteRegistration(request: QuoteRequest, pricing: Pricing): QuoteResult {
    if (!pricing.isAvailable) return { ok: false, error: "price_unavailable" };

    const tier = pricing.settings.current_tier;
    if (request.quotedTier !== tier) return { ok: false, error: "tier_changed" };

    const key: PriceKey = { option: request.ticketOption, audience: audienceFor(request.membership.choice), tier };
    const lookup = getPrice(pricing.table, key);
    if (!lookup.ok) return { ok: false, error: "price_unavailable" };

    if (key.option === "conference_workshop" && pricing.placesLeft <= 0) return { ok: false, error: "sold_out" };

    return { ok: true, key, amount: lookup.price.amount };
}

/**
 * What the form offers: the current tier, both audiences' prices at that tier (so switching the
 * membership answer updates the price straight away), and the workshop places left.
 */
export type RegistrationOffer =
    | {
          isAvailable: true;
          tier: PriceTier;
          /** Formatted prices; `null` for a ticket that isn't on sale. */
          prices: Record<Audience, Record<TicketOption, string | null>>;
          placesLeft: number;
      }
    | { isAvailable: false };

export function toRegistrationOffer(pricing: Pricing): RegistrationOffer {
    if (!pricing.isAvailable) return { isAvailable: false };

    const tier = pricing.settings.current_tier;
    const priceText = (option: TicketOption, audience: Audience) => {
        const lookup = getPrice(pricing.table, { option, audience, tier });
        return lookup.ok ? formatCents(lookup.price.amount) : null;
    };
    // spelt out so a new option or audience fails to compile until it's added here
    const pricesFor = (audience: Audience): Record<TicketOption, string | null> => ({
        conference_only: priceText("conference_only", audience),
        conference_workshop: priceText("conference_workshop", audience),
    });

    return {
        isAvailable: true,
        tier,
        prices: { member: pricesFor("member"), non_member: pricesFor("non_member") },
        placesLeft: pricing.placesLeft,
    };
}
