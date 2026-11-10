/**
 * What a ticket costs.
 *
 * @remarks
 * The *keys* of a price (option, audience, tier) are typed here; the *amounts* only ever come
 * from `ticket_prices` rows. Nothing in this module accepts an amount from a caller, so the
 * browser has no way to influence what is charged - the server looks the price up itself.
 *
 * Client-safe: the public ticket cards and the form use the same helpers as the server.
 *
 * @module
 */
import type { Tables } from "@/types/database";
import { EARLY_BIRD_TIMEZONE } from "./config";
import { toCents, type Cents } from "./money";
import { AUDIENCES, PRICE_TIERS, TICKET_OPTIONS, type Audience, type PriceTier, type TicketOption } from "./options";

/** Identifies one of the 8 prices. */
export interface PriceKey {
    option: TicketOption;
    audience: Audience;
    tier: PriceTier;
}

/** A {@link PriceKey} as a string, for use as a map key, e.g. `conference_only:member:early_bird`. */
export type PriceKeyId = `${TicketOption}:${Audience}:${PriceTier}`;

export function priceKeyId(key: PriceKey): PriceKeyId {
    return `${key.option}:${key.audience}:${key.tier}`;
}

/**
 * Every price key: 2 options x 2 audiences x 2 tiers.
 *
 * @remarks
 * Built from the option tuples, so adding a value to any set grows this list automatically, and
 * the seed test then fails until a matching `ticket_prices` row exists.
 */
export const ALL_PRICE_KEYS: readonly PriceKey[] = AUDIENCES.flatMap((audience) =>
    TICKET_OPTIONS.flatMap((option) => PRICE_TIERS.map((tier) => ({ option, audience, tier }))),
);

/** A price as the app uses it, with the amount branded as {@link Cents}. */
export interface TicketPrice extends PriceKey {
    id: string;
    amount: Cents;
    isActive: boolean;
}

/** The `ticket_prices` columns the app reads. */
export type TicketPriceRow = Pick<
    Tables<"ticket_prices">,
    "id" | "ticket_option" | "audience" | "tier" | "amount_cents" | "is_active"
>;

/**
 * Converts a `ticket_prices` row into a {@link TicketPrice}.
 *
 * @throws RangeError if the amount isn't whole cents (the DB checks it, so this means corrupt data).
 */
export function toTicketPrice(row: TicketPriceRow): TicketPrice {
    return {
        id: row.id,
        option: row.ticket_option,
        audience: row.audience,
        tier: row.tier,
        amount: toCents(row.amount_cents),
        isActive: row.is_active,
    };
}

/** All prices, keyed by {@link priceKeyId}. */
export type PriceTable = ReadonlyMap<PriceKeyId, TicketPrice>;

export type BuildPriceTableResult = { ok: true; table: PriceTable } | { ok: false; duplicates: PriceKeyId[] };

/**
 * Indexes price rows by key.
 *
 * @remarks
 * The DB's unique constraint makes duplicates impossible, but this reports them rather than
 * letting one row silently overwrite another.
 */
export function buildPriceTable(rows: readonly TicketPriceRow[]): BuildPriceTableResult {
    const table = new Map<PriceKeyId, TicketPrice>();
    const duplicates: PriceKeyId[] = [];

    for (const row of rows) {
        const price = toTicketPrice(row);
        const id = priceKeyId(price);
        if (table.has(id)) {
            duplicates.push(id);
            continue;
        }
        table.set(id, price);
    }

    return duplicates.length > 0 ? { ok: false, duplicates } : { ok: true, table };
}

export type PriceLookup = { ok: true; price: TicketPrice } | { ok: false; reason: "missing" | "inactive" };

/**
 * Looks up the price for a key.
 *
 * @remarks
 * An inactive price is treated as unavailable, not as free: callers must refuse to sell it.
 */
export function getPrice(table: PriceTable, key: PriceKey): PriceLookup {
    const price = table.get(priceKeyId(key));
    if (!price) return { ok: false, reason: "missing" };
    if (!price.isActive) return { ok: false, reason: "inactive" };
    return { ok: true, price };
}

/** The `registration_settings` columns the pricing logic reads. */
export type PricingSettings = Pick<Tables<"registration_settings">, "current_tier" | "early_bird_closes_on">;

/** The settings row as the pages load it. */
export type RegistrationSettings = PricingSettings & Pick<Tables<"registration_settings">, "workshop_capacity">;

/**
 * Everything a page needs to show prices (loaded by `getPricing` in `queries.server.ts`).
 *
 * @remarks
 * `isAvailable: false` when any part couldn't be loaded, for example before the migrations reach
 * the live database. Pages then show "To be confirmed" instead of breaking.
 */
export type Pricing =
    | { isAvailable: true; settings: RegistrationSettings; table: PriceTable; placesLeft: number }
    | { isAvailable: false };

/**
 * The tier new registrations are charged at.
 *
 * @remarks
 * The Early Bird to Full switch is manual (GANZ flip `current_tier` in the dashboard), so the
 * close date deliberately plays no part. If the switch ever becomes date-driven, this is the one
 * place to change: combine `current_tier` with {@link isPastEarlyBirdClose}.
 */
export function getCurrentTier(settings: Pick<PricingSettings, "current_tier">): PriceTier {
    return settings.current_tier;
}

/** How far `timeZone` is ahead of UTC at `instant`, in milliseconds. */
function zoneOffsetMs(instant: Date, timeZone: string): number {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hourCycle: "h23",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
    }).formatToParts(instant);
    const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value);
    const wallClockAsUtc = Date.UTC(part("year"), part("month") - 1, part("day"), part("hour"), part("minute"), part("second"));
    return wallClockAsUtc - instant.getTime();
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * The instant Early Bird closes: the end of `closesOn` (a `YYYY-MM-DD` date) in the conference time zone.
 *
 * @remarks
 * "Closes Friday 5 March 2027" means people can still register at Early Bird prices all that
 * day in Brisbane, so the close is midnight at the *start* of 6 March there (`2027-03-05T14:00:00Z`).
 *
 * @throws RangeError if `closesOn` isn't a `YYYY-MM-DD` date.
 */
export function earlyBirdClosesAt(closesOn: string, timeZone: string = EARLY_BIRD_TIMEZONE): Date {
    const match = ISO_DATE.exec(closesOn);
    if (!match) throw new RangeError(`Expected a YYYY-MM-DD date, got "${closesOn}".`);

    const [, year, month, day] = match.map(Number);
    const nextMidnightAsUtc = Date.UTC(year, month - 1, day + 1);
    return new Date(nextMidnightAsUtc - zoneOffsetMs(new Date(nextMidnightAsUtc), timeZone));
}

/**
 * Whether the informational Early Bird close date has passed.
 *
 * @remarks
 * Only used to nudge GANZ in the dashboard ("Early Bird has closed - switch to Full?"). It never
 * decides a price; see {@link getCurrentTier}. `false` when no date is set.
 */
export function isPastEarlyBirdClose(settings: Pick<PricingSettings, "early_bird_closes_on">, now: Date): boolean {
    if (!settings.early_bird_closes_on) return false;
    return now >= earlyBirdClosesAt(settings.early_bird_closes_on);
}

/**
 * The price keys the registration form offers one person: both ticket options, at their
 * audience and the current tier.
 *
 * @remarks
 * The public Registrations section still shows all 8 prices; the form only shows the 2 that apply.
 */
export function availableOptions(audience: Audience, tier: PriceTier): readonly PriceKey[] {
    return TICKET_OPTIONS.map((option) => ({ option, audience, tier }));
}