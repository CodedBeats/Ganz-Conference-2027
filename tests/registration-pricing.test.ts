import { describe, expect, it } from "vitest";
import {
    ALL_PRICE_KEYS,
    availableOptions,
    buildPriceTable,
    earlyBirdClosesAt,
    getCurrentTier,
    getPrice,
    isPastEarlyBirdClose,
    priceKeyId,
    type PriceKey,
    type PriceTable,
    type TicketPriceRow,
} from "../src/lib/registration/pricing";
import { AUDIENCES, PRICE_TIERS } from "../src/lib/registration/options";

/** The 8 final prices (Michelle, 23 Oct), in cents - the same values the migration seeds. */
const EXPECTED_CENTS: Record<string, number> = {
    "conference_only:member:early_bird": 48500,
    "conference_only:member:full": 58500,
    "conference_workshop:member:early_bird": 108500,
    "conference_workshop:member:full": 118500,
    "conference_only:non_member:early_bird": 63500,
    "conference_only:non_member:full": 73500,
    "conference_workshop:non_member:early_bird": 123500,
    "conference_workshop:non_member:full": 133500,
};

const row = (key: PriceKey, overrides: Partial<TicketPriceRow> = {}): TicketPriceRow => ({
    id: priceKeyId(key),
    ticket_option: key.option,
    audience: key.audience,
    tier: key.tier,
    amount_cents: EXPECTED_CENTS[priceKeyId(key)],
    is_active: true,
    ...overrides,
});

const tableFrom = (rows: TicketPriceRow[]): PriceTable => {
    const result = buildPriceTable(rows);
    if (!result.ok) throw new Error(`unexpected duplicates: ${result.duplicates.join(", ")}`);
    return result.table;
};

const fullTable = () => tableFrom(ALL_PRICE_KEYS.map((key) => row(key)));

describe("ALL_PRICE_KEYS", () => {
    it("has exactly the 8 option x audience x tier combinations, once each", () => {
        const ids = ALL_PRICE_KEYS.map(priceKeyId);
        expect(ids).toHaveLength(8);
        expect(new Set(ids).size).toBe(8);
        expect([...ids].sort()).toEqual(Object.keys(EXPECTED_CENTS).sort());
    });
});

describe("getPrice", () => {
    it.each(ALL_PRICE_KEYS.map((key) => [priceKeyId(key), key] as const))("returns the price for %s", (id, key) => {
        const result = getPrice(fullTable(), key);
        expect(result).toMatchObject({ ok: true, price: { ...key, amount: EXPECTED_CENTS[id] } });
    });

    it("reports a missing price row", () => {
        const [missing, ...rest] = ALL_PRICE_KEYS;
        const table = tableFrom(rest.map((key) => row(key)));
        expect(getPrice(table, missing)).toEqual({ ok: false, reason: "missing" });
    });

    it("treats an inactive price as unavailable", () => {
        const [inactive, ...rest] = ALL_PRICE_KEYS;
        const table = tableFrom([row(inactive, { is_active: false }), ...rest.map((key) => row(key))]);
        expect(getPrice(table, inactive)).toEqual({ ok: false, reason: "inactive" });
    });
});

describe("buildPriceTable", () => {
    it("reports duplicate rows instead of letting one overwrite the other", () => {
        const [first] = ALL_PRICE_KEYS;
        const result = buildPriceTable([row(first), row(first, { id: "other", amount_cents: 1 })]);
        expect(result).toEqual({ ok: false, duplicates: [priceKeyId(first)] });
    });

    it("rejects an amount that isn't whole cents", () => {
        const [first] = ALL_PRICE_KEYS;
        expect(() => buildPriceTable([row(first, { amount_cents: 485.5 })])).toThrow(RangeError);
    });
});

describe("availableOptions", () => {
    it.each(AUDIENCES.flatMap((audience) => PRICE_TIERS.map((tier) => [audience, tier] as const)))(
        "offers both ticket options for %s at %s",
        (audience, tier) => {
            expect(availableOptions(audience, tier)).toEqual([
                { option: "conference_only", audience, tier },
                { option: "conference_workshop", audience, tier },
            ]);
        },
    );
});

describe("getCurrentTier", () => {
    it("uses the manual setting, even after the close date", () => {
        expect(getCurrentTier({ current_tier: "early_bird" })).toBe("early_bird");
        expect(getCurrentTier({ current_tier: "full" })).toBe("full");
    });
});

describe("Early Bird close (Friday 5 March 2027, Brisbane)", () => {
    const settings = { early_bird_closes_on: "2027-03-05" };

    it("closes at the end of 5 March in Brisbane", () => {
        expect(earlyBirdClosesAt("2027-03-05").toISOString()).toBe("2027-03-05T14:00:00.000Z");
    });

    it("is still open in the last second of 5 March", () => {
        expect(isPastEarlyBirdClose(settings, new Date("2027-03-05T13:59:59.999Z"))).toBe(false);
        // 11:59:59pm on Friday in Brisbane
        expect(isPastEarlyBirdClose(settings, new Date("2027-03-05T23:59:59+10:00"))).toBe(false);
    });

    it("has passed from midnight on 6 March in Brisbane", () => {
        expect(isPastEarlyBirdClose(settings, new Date("2027-03-05T14:00:00.000Z"))).toBe(true);
        expect(isPastEarlyBirdClose(settings, new Date("2027-03-06T00:00:00+10:00"))).toBe(true);
    });

    it("never passes when no date is set", () => {
        expect(isPastEarlyBirdClose({ early_bird_closes_on: null }, new Date("2030-01-01"))).toBe(false);
    });

    it("rejects a malformed date", () => {
        expect(() => earlyBirdClosesAt("5 March 2027")).toThrow(RangeError);
    });
});