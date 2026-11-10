/**
 * Drift checks between the TypeScript option tuples and the Postgres enums.
 *
 * Layer 1 (compile time): the type assertions below stop `tsc` / `next build` if a union and the
 * generated enum type differ. Layer 2 (this test run): the runtime tuples must equal the
 * generated `Constants` arrays. Layer 3 - that `src/types/database.ts` is fresh against the
 * migrations - needs the local DB, so it lives in `tests/db/` (`npm run test:db`).
 */
import { describe, expect, it } from "vitest";
import { Constants, type Enums } from "../src/types/database";
import {
    AUDIENCE_LABELS,
    AUDIENCES,
    PRICE_TIER_LABELS,
    PRICE_TIERS,
    TICKET_OPTION_LABELS,
    TICKET_OPTIONS,
    type Audience,
    type PriceTier,
    type TicketOption,
} from "../src/lib/registration/options";

/** `true` only when `A` and `B` are the same type (not merely assignable one way). */
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

// Layer 1: a `false` here is a type error.
const typeChecks: [
    Equal<TicketOption, Enums<"ticket_option">>,
    Equal<Audience, Enums<"audience">>,
    Equal<PriceTier, Enums<"price_tier">>,
] = [true, true, true];

const ENUM_SETS = [
    { name: "ticket_option", values: TICKET_OPTIONS, labels: TICKET_OPTION_LABELS },
    { name: "audience", values: AUDIENCES, labels: AUDIENCE_LABELS },
    { name: "price_tier", values: PRICE_TIERS, labels: PRICE_TIER_LABELS },
] as const satisfies readonly {
    name: keyof typeof Constants.public.Enums;
    values: readonly string[];
    labels: Record<string, string>;
}[];

describe("option tuples match the Postgres enums", () => {
    it("compiles the type-level checks", () => {
        expect(typeChecks.every(Boolean)).toBe(true);
    });

    it("covers every enum in the generated types", () => {
        expect(ENUM_SETS.map((set) => set.name).sort()).toEqual(Object.keys(Constants.public.Enums).sort());
    });

    it.each(ENUM_SETS)("$name has the same values as the DB", ({ name, values }) => {
        expect([...values].sort()).toEqual([...Constants.public.Enums[name]].sort());
    });

    it.each(ENUM_SETS)("$name has a label for every value and nothing else", ({ values, labels }) => {
        expect(Object.keys(labels).sort()).toEqual([...values].sort());
    });
});