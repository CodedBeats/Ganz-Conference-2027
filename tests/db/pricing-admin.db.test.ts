// @vitest-environment node
/**
 * Admin -> Tickets saving (`save_ticket_pricing`), the pricing audit log, and the ticket cards'
 * link to their prices.
 *
 * Skipped in normal runs. Run with `npm run test:db` against the local stack. Restores the seeded
 * prices and tier, and clears the pricing audit log, after each test.
 */
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { AUDIENCES, TICKET_OPTIONS } from "../../src/lib/registration/options";
import { adminClient, anonClient, isDbMode, nonAdminClient, PERMISSION_DENIED, secretClient, type DbClient } from "./helpers";

interface SavedPrice {
    id: string;
    amount_cents: number;
    ticket_option: string;
    audience: string;
    tier: string;
}

describe.runIf(isDbMode)("pricing admin (local DB)", () => {
    let secret: DbClient;
    let anon: DbClient;
    let admin: DbClient;
    let adminId: string;
    let original: SavedPrice[];

    const save = (client: DbClient, prices: { id: string; amount_cents: number }[], tier: "early_bird" | "full" = "early_bird", closesOn: string | null = "2027-03-05") =>
        client.rpc("save_ticket_pricing", {
            p_price_ids: prices.map((price) => price.id),
            p_amounts_cents: prices.map((price) => price.amount_cents),
            p_current_tier: tier,
            // Omitted means "no date", as in saveTicketPricing
            ...(closesOn && { p_early_bird_closes_on: closesOn }),
        });

    const auditRows = async () => {
        const { data } = await secret.from("pricing_audit_log").select("ticket_price_id, before, after, changed_by").order("id");
        return data ?? [];
    };

    beforeAll(async () => {
        secret = secretClient();
        anon = anonClient();
        admin = await adminClient();
        const { data: user } = await admin.auth.getUser();
        adminId = user.user?.id ?? "";

        const { data } = await secret.from("ticket_prices").select("id, amount_cents, ticket_option, audience, tier").order("amount_cents");
        original = data ?? [];
    });

    afterEach(async () => {
        for (const price of original) {
            await secret.from("ticket_prices").update({ amount_cents: price.amount_cents }).eq("id", price.id);
        }
        await secret.from("registration_settings").update({ current_tier: "early_bird", early_bird_closes_on: "2027-03-05" }).eq("id", true);
        await secret.from("pricing_audit_log").delete().gte("id", 0);
    });

    describe("save_ticket_pricing as the admin", () => {
        it("saves a changed price and records who changed it from what to what", async () => {
            const [first, ...rest] = original;
            const { data, error } = await save(admin, [{ id: first.id, amount_cents: first.amount_cents + 500 }, ...rest]);
            expect(error).toBeNull();
            expect(data).toBe(1);

            const { data: saved } = await anon.from("ticket_prices").select("amount_cents").eq("id", first.id).single();
            expect(saved?.amount_cents).toBe(first.amount_cents + 500);

            expect(await auditRows()).toEqual([
                {
                    ticket_price_id: first.id,
                    before: { amount_cents: first.amount_cents },
                    after: { amount_cents: first.amount_cents + 500 },
                    changed_by: adminId,
                },
            ]);
        });

        it("writes nothing when nothing changed", async () => {
            const { data, error } = await save(admin, original);
            expect(error).toBeNull();
            expect(data).toBe(0);
            expect(await auditRows()).toEqual([]);
        });

        it("switches the tier and clears the date, recorded as one settings change", async () => {
            const { data, error } = await save(admin, original, "full", null);
            expect(error).toBeNull();
            expect(data).toBe(1);

            const { data: settings } = await anon.from("registration_settings").select("current_tier, early_bird_closes_on, workshop_capacity").single();
            expect(settings).toEqual({ current_tier: "full", early_bird_closes_on: null, workshop_capacity: 27 });

            expect(await auditRows()).toEqual([
                {
                    ticket_price_id: null,
                    before: { current_tier: "early_bird", early_bird_closes_on: "2027-03-05" },
                    after: { current_tier: "full", early_bird_closes_on: null },
                    changed_by: adminId,
                },
            ]);
        });

        it.each([
            ["a zero amount", (prices: SavedPrice[]) => [{ id: prices[0].id, amount_cents: 0 }], "invalid_amount"],
            ["a negative amount", (prices: SavedPrice[]) => [{ id: prices[0].id, amount_cents: -100 }], "invalid_amount"],
            ["an unknown price", () => [{ id: crypto.randomUUID(), amount_cents: 100 }], "unknown_price"],
            ["the same price twice", (prices: SavedPrice[]) => [prices[0], prices[0]], "invalid_prices"],
        ])("refuses %s and saves nothing", async (_label, build, message) => {
            const { error } = await save(admin, build(original));
            expect(error?.message).toBe(message);
            expect(await auditRows()).toEqual([]);
        });

        it("refuses ids and amounts of different lengths", async () => {
            const { error } = await admin.rpc("save_ticket_pricing", {
                p_price_ids: [original[0].id, original[1].id],
                p_amounts_cents: [100],
                p_current_tier: "early_bird",
            });
            expect(error?.message).toBe("invalid_prices");
        });

        it("rolls back every change when one price is invalid", async () => {
            const [first, second] = original;
            const { error } = await save(admin, [
                { id: first.id, amount_cents: first.amount_cents + 1 },
                { id: second.id, amount_cents: 0 },
            ]);
            expect(error?.message).toBe("invalid_amount");

            const { data } = await anon.from("ticket_prices").select("amount_cents").eq("id", first.id).single();
            expect(data?.amount_cents).toBe(first.amount_cents);
        });
    });

    describe("who can save", () => {
        it("refuses anon", async () => {
            const { error } = await save(anon, original);
            expect(error?.code).toBe(PERMISSION_DENIED);
        });

        it("refuses a logged-in non-admin", async () => {
            const { client, cleanup } = await nonAdminClient();
            try {
                const { error } = await save(client, original);
                expect(error).toMatchObject({ code: PERMISSION_DENIED, message: "not_admin" });
            } finally {
                await cleanup();
            }
        });
    });

    describe("pricing_audit_log", () => {
        it("is readable by the admin only, and writable by no one", async () => {
            const [first, ...rest] = original;
            await save(admin, [{ id: first.id, amount_cents: first.amount_cents + 100 }, ...rest]);

            const anonRead = await anon.from("pricing_audit_log").select("*");
            expect(anonRead.error?.code).toBe(PERMISSION_DENIED);

            const { client, cleanup } = await nonAdminClient();
            try {
                expect(await client.from("pricing_audit_log").select("*")).toMatchObject({ error: null, data: [] });
            } finally {
                await cleanup();
            }

            const adminRead = await admin.from("pricing_audit_log").select("*");
            expect(adminRead.data).toHaveLength(1);

            const adminDelete = await admin.from("pricing_audit_log").delete().gte("id", 0);
            expect(adminDelete.error?.code).toBe(PERMISSION_DENIED);
        });
    });

    describe("ticket cards", () => {
        it("links exactly one registration card to each ticket, with no CMS price rows left", async () => {
            const { data: cards, error } = await anon
                .from("stat_items")
                .select("id, ticket_option, audience")
                .not("ticket_option", "is", null);
            expect(error).toBeNull();

            const keys = (cards ?? []).map((card) => `${card.ticket_option}:${card.audience}`).sort();
            const expected = TICKET_OPTIONS.flatMap((option) => AUDIENCES.map((audience) => `${option}:${audience}`)).sort();
            expect(keys).toEqual(expected);

            const { data: children } = await anon.from("stat_items").select("id").in("parent_id", (cards ?? []).map((card) => card.id));
            expect(children).toEqual([]);
        });

        it("doesn't allow a card linked to only half a ticket", async () => {
            const { data: card } = await secret.from("stat_items").select("id").not("ticket_option", "is", null).limit(1).single();
            const { error } = await secret.from("stat_items").update({ audience: null }).eq("id", card?.id ?? "");
            expect(error?.code).toBe("23514");
        });
    });
});
