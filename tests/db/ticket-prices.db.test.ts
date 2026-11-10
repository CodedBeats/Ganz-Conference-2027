// @vitest-environment node
/**
 * RLS, grants and seed checks for `ticket_prices` and `registration_settings`.
 *
 * Skipped in normal runs. Run with `npm run test:db` against the local stack (`npx supabase start`).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ALL_PRICE_KEYS, priceKeyId } from "../../src/lib/registration/pricing";
import { adminClient, anonClient, isDbMode, nonAdminClient, PERMISSION_DENIED, type DbClient } from "./helpers";

/** What the migration seeds (Michelle, 23 Oct). */
const SEEDED_CENTS: Record<string, number> = {
    "conference_only:member:early_bird": 48500,
    "conference_only:member:full": 58500,
    "conference_workshop:member:early_bird": 108500,
    "conference_workshop:member:full": 118500,
    "conference_only:non_member:early_bird": 63500,
    "conference_only:non_member:full": 73500,
    "conference_workshop:non_member:early_bird": 123500,
    "conference_workshop:non_member:full": 133500,
};

const PRICE_TO_EDIT = { ticket_option: "conference_only", audience: "member", tier: "early_bird" } as const;

describe.runIf(isDbMode)("ticket_prices and registration_settings (local DB)", () => {
    let anon: DbClient;
    let admin: DbClient;
    let nonAdmin: DbClient;
    let cleanupNonAdmin: () => Promise<void> = async () => {};

    beforeAll(async () => {
        anon = anonClient();
        admin = await adminClient();
        const user = await nonAdminClient();
        nonAdmin = user.client;
        cleanupNonAdmin = user.cleanup;
    });

    afterAll(async () => {
        await cleanupNonAdmin();
    });

    describe("seed", () => {
        it("has exactly the 8 price keys with the agreed amounts - no missing, extra or duplicate rows", async () => {
            const { data, error } = await anon.from("ticket_prices").select("ticket_option, audience, tier, amount_cents, currency, is_active");
            expect(error).toBeNull();

            const ids = (data ?? []).map((row) => priceKeyId({ option: row.ticket_option, audience: row.audience, tier: row.tier }));
            expect(ids).toHaveLength(ALL_PRICE_KEYS.length);
            expect([...ids].sort()).toEqual(ALL_PRICE_KEYS.map(priceKeyId).sort());

            for (const row of data ?? []) {
                const id = priceKeyId({ option: row.ticket_option, audience: row.audience, tier: row.tier });
                expect(row).toMatchObject({ amount_cents: SEEDED_CENTS[id], currency: "AUD", is_active: true });
            }
        });

        it("has one settings row: Early Bird, closing 5 March 2027, 27 workshop places", async () => {
            const { data, error } = await anon.from("registration_settings").select("current_tier, early_bird_closes_on, workshop_capacity");
            expect(error).toBeNull();
            expect(data).toEqual([{ current_tier: "early_bird", early_bird_closes_on: "2027-03-05", workshop_capacity: 27 }]);
        });
    });

    describe("anon", () => {
        it("can't update, insert or delete prices", async () => {
            const update = await anon.from("ticket_prices").update({ amount_cents: 1 }).match(PRICE_TO_EDIT);
            const insert = await anon.from("ticket_prices").insert({ ...PRICE_TO_EDIT, amount_cents: 1 });
            const remove = await anon.from("ticket_prices").delete().match(PRICE_TO_EDIT);
            expect([update.error?.code, insert.error?.code, remove.error?.code]).toEqual([
                PERMISSION_DENIED,
                PERMISSION_DENIED,
                PERMISSION_DENIED,
            ]);
        });

        it("can't change the settings", async () => {
            const { error } = await anon.from("registration_settings").update({ current_tier: "full" }).eq("id", true);
            expect(error?.code).toBe(PERMISSION_DENIED);
        });
    });

    describe("logged-in non-admin", () => {
        it("can read prices", async () => {
            const { data, error } = await nonAdmin.from("ticket_prices").select("id");
            expect(error).toBeNull();
            expect(data).toHaveLength(8);
        });

        it("updates no rows (RLS filters them out)", async () => {
            const prices = await nonAdmin.from("ticket_prices").update({ amount_cents: 1 }).match(PRICE_TO_EDIT).select();
            const settings = await nonAdmin.from("registration_settings").update({ current_tier: "full" }).eq("id", true).select();
            expect(prices).toMatchObject({ error: null, data: [] });
            expect(settings).toMatchObject({ error: null, data: [] });
        });
    });

    describe("admin", () => {
        it("can change a price amount and deactivate it", async () => {
            try {
                const { data, error } = await admin
                    .from("ticket_prices")
                    .update({ amount_cents: 49000, is_active: false })
                    .match(PRICE_TO_EDIT)
                    .select("amount_cents, is_active");
                expect(error).toBeNull();
                expect(data).toEqual([{ amount_cents: 49000, is_active: false }]);
            } finally {
                await admin.from("ticket_prices").update({ amount_cents: 48500, is_active: true }).match(PRICE_TO_EDIT);
            }
        });

        it("can switch the tier", async () => {
            try {
                const { data, error } = await admin.from("registration_settings").update({ current_tier: "full" }).eq("id", true).select("current_tier");
                expect(error).toBeNull();
                expect(data).toEqual([{ current_tier: "full" }]);
            } finally {
                await admin.from("registration_settings").update({ current_tier: "early_bird" }).eq("id", true);
            }
        });

        it("can't change which price a row is, or add and remove prices", async () => {
            const rekey = await admin.from("ticket_prices").update({ tier: "full" }).match(PRICE_TO_EDIT);
            const insert = await admin.from("ticket_prices").insert({ ...PRICE_TO_EDIT, amount_cents: 1 });
            const remove = await admin.from("ticket_prices").delete().match(PRICE_TO_EDIT);
            expect([rekey.error?.code, insert.error?.code, remove.error?.code]).toEqual([
                PERMISSION_DENIED,
                PERMISSION_DENIED,
                PERMISSION_DENIED,
            ]);
        });

        it("can't change the workshop capacity", async () => {
            const { error } = await admin.from("registration_settings").update({ workshop_capacity: 30 }).eq("id", true);
            expect(error?.code).toBe(PERMISSION_DENIED);
        });

        it("still can't set a non-positive amount (DB check)", async () => {
            const { error } = await admin.from("ticket_prices").update({ amount_cents: 0 }).match(PRICE_TO_EDIT);
            expect(error?.code).toBe("23514");
        });
    });
});