/**
 * Closed sets of registration options: one source of truth per set.
 *
 * @remarks
 * Each set is an `as const` tuple with a derived union type, plus a label record declared
 * with `satisfies Record<Key, string>`, so a key added without a label (or a label for a key
 * that doesn't exist) fails to compile. Every set here is also a Postgres enum; the tuples
 * must match the generated `Constants.public.Enums` exactly (see `tests/registration-enums.test.ts`).
 *
 * Client-safe: no server-only imports, so the form, the public cards and the server all share it.
 *
 * @module
 */

/** Ticket options. Matches the `ticket_option` enum. */
export const TICKET_OPTIONS = ["conference_only", "conference_workshop"] as const;
export type TicketOption = (typeof TICKET_OPTIONS)[number];

export const TICKET_OPTION_LABELS = {
    conference_only: "Three-day conference only",
    conference_workshop: "Conference + two-day pre-conference workshop",
} as const satisfies Record<TicketOption, string>;

/**
 * Who a price is for. Matches the `audience` enum.
 *
 * @remarks
 * Never entered directly by a person: it is derived from their membership choice (Part B).
 */
export const AUDIENCES = ["member", "non_member"] as const;
export type Audience = (typeof AUDIENCES)[number];

export const AUDIENCE_LABELS = {
    member: "GANZ members",
    non_member: "Non-members",
} as const satisfies Record<Audience, string>;

/** Price tiers. Matches the `price_tier` enum. */
export const PRICE_TIERS = ["early_bird", "full"] as const;
export type PriceTier = (typeof PRICE_TIERS)[number];

export const PRICE_TIER_LABELS = {
    early_bird: "Early Bird",
    full: "Full Registration",
} as const satisfies Record<PriceTier, string>;