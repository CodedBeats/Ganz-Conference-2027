// @vitest-environment node
/**
 * RLS, grants, constraints and capacity for the registration tables.
 *
 * Skipped in normal runs. Run with `npm run test:db` against the local stack. **Deletes every
 * local registration** before each test, so the place counts start from zero.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { toPendingRegistrationError, type CreatePendingRegistrationArgs } from "../../src/lib/registration/model";
import { holdsPlace, REGISTRATION_STATUSES } from "../../src/lib/registration/status";
import { CHECKOUT_SESSION_MINUTES } from "../../src/lib/registration/config";
import type { Database } from "../../src/types/database";
import {
    adminClient,
    anonClient,
    isDbMode,
    nonAdminClient,
    PERMISSION_DENIED,
    secretClient,
    type DbClient,
} from "./helpers";

const CHECK_VIOLATION = "23514";
const UNIQUE_VIOLATION = "23505";

type TableName = "registrations" | "registration_private_details" | "stripe_events" | "registration_audit_log" | "email_log";
const TABLES: readonly TableName[] = [
    "registrations",
    "registration_private_details",
    "stripe_events",
    "registration_audit_log",
    "email_log",
];

/** A column every row of the table has, to filter a "delete everything" attempt on. */
const KEY_COLUMN = {
    registrations: "id",
    registration_private_details: "registration_id",
    stripe_events: "id",
    registration_audit_log: "id",
    email_log: "id",
} as const satisfies Record<TableName, string>;

const args = (overrides: Partial<CreatePendingRegistrationArgs> = {}): CreatePendingRegistrationArgs => ({
    p_membership_choice: "non_member",
    p_ticket_option: "conference_only",
    p_quoted_tier: "early_bird",
    p_full_name: "Test Attendee",
    p_email: "test.attendee@example.com",
    p_dietary: ["none"],
    p_policy_version: "test-v1",
    p_policy_text_sha256: "0".repeat(64),
    ...overrides,
});

const workshopArgs = (overrides: Partial<CreatePendingRegistrationArgs> = {}) =>
    args({ p_ticket_option: "conference_workshop", ...overrides });

describe.runIf(isDbMode)("registration tables (local DB)", () => {
    let secret: DbClient;
    let anon: DbClient;
    let admin: DbClient;
    let nonAdmin: DbClient;
    let cleanupNonAdmin: () => Promise<void> = async () => {};

    /** Creates a pending registration through the RPC and returns its id. */
    const createPending = async (overrides: Partial<CreatePendingRegistrationArgs> = {}) => {
        const { data, error } = await secret.rpc("create_pending_registration", args(overrides));
        if (error || !data?.[0]) throw new Error(`create_pending_registration failed: ${error?.message}`);
        return data[0];
    };

    const placesLeft = async () => {
        const { data, error } = await anon.rpc("workshop_places_left");
        if (error) throw new Error(error.message);
        return data;
    };

    const deleteAllRegistrations = async () => {
        await secret.from("stripe_events").delete().like("id", "evt_test_%");
        await secret.from("registrations").delete().not("id", "is", null);
    };

    beforeAll(async () => {
        secret = secretClient();
        anon = anonClient();
        admin = await adminClient();
        const user = await nonAdminClient();
        nonAdmin = user.client;
        cleanupNonAdmin = user.cleanup;
    });

    beforeEach(deleteAllRegistrations);

    afterAll(async () => {
        await deleteAllRegistrations();
        await cleanupNonAdmin();
    });

    describe("create_pending_registration", () => {
        it("snapshots the current price and tier, and derives the audience", async () => {
            const created = await createPending({
                p_membership_choice: "current_member",
                p_ticket_option: "conference_workshop",
                p_membership_name: "Test Member",
                p_membership_email: "Member@Example.com",
            });
            expect(created).toMatchObject({ price_cents: 108500, tier: "early_bird" });
            expect(created.public_ref).toMatch(/^[0-9a-f]{32}$/);

            const { data } = await secret.from("registrations").select("*").eq("id", created.registration_id).single();
            expect(data).toMatchObject({
                status: "pending_payment",
                audience: "member",
                price_cents: 108500,
                currency: "AUD",
                membership_email: "member@example.com",
            });

            // The session window matches CHECKOUT_SESSION_MINUTES
            const minutes = (new Date(created.checkout_expires_at).getTime() - Date.now()) / 60_000;
            expect(minutes).toBeGreaterThan(CHECKOUT_SESSION_MINUTES - 1);
            expect(minutes).toBeLessThanOrEqual(CHECKOUT_SESSION_MINUTES + 1);
        });

        it("writes the private details and a created audit entry with no personal data", async () => {
            const created = await createPending({ p_dietary: ["vegan", "gluten_free"], p_access_requirements: "Step-free access" });

            const details = await secret.from("registration_private_details").select("dietary, access_requirements").eq("registration_id", created.registration_id).single();
            expect(details.data).toEqual({ dietary: ["vegan", "gluten_free"], access_requirements: "Step-free access" });

            const audit = await secret.from("registration_audit_log").select("actor, action, to_status, after").eq("registration_id", created.registration_id);
            expect(audit.data).toEqual([
                {
                    actor: "system",
                    action: "registration_created",
                    to_status: "pending_payment",
                    after: { ticket_option: "conference_only", tier: "early_bird", price_cents: 63500 },
                },
            ]);
        });

        it("refuses a tier the form showed that is no longer current", async () => {
            const { error } = await secret.rpc("create_pending_registration", args({ p_quoted_tier: "full" }));
            expect(error && toPendingRegistrationError(error)).toBe("tier_changed");
        });

        it("refuses an inactive price", async () => {
            const price = { ticket_option: "conference_only", audience: "non_member", tier: "early_bird" } as const;
            try {
                await secret.from("ticket_prices").update({ is_active: false }).match(price);
                const { error } = await secret.rpc("create_pending_registration", args());
                expect(error && toPendingRegistrationError(error)).toBe("price_unavailable");
            } finally {
                await secret.from("ticket_prices").update({ is_active: true }).match(price);
            }
        });

        it("keeps the snapshot when GANZ later change the price", async () => {
            const price = { ticket_option: "conference_only", audience: "non_member", tier: "early_bird" } as const;
            const created = await createPending();
            try {
                await secret.from("ticket_prices").update({ amount_cents: 70000 }).match(price);
                const { data } = await secret.from("registrations").select("price_cents").eq("id", created.registration_id).single();
                expect(data?.price_cents).toBe(63500);
            } finally {
                await secret.from("ticket_prices").update({ amount_cents: 63500 }).match(price);
            }
        });

        it("uses Full prices once GANZ switch the tier, leaving existing registrations alone", async () => {
            const earlyBird = await createPending();
            try {
                await secret.from("registration_settings").update({ current_tier: "full" }).eq("id", true);
                const full = await createPending({ p_quoted_tier: "full" });
                expect(full).toMatchObject({ tier: "full", price_cents: 73500 });

                const { data } = await secret.from("registrations").select("tier, price_cents").eq("id", earlyBird.registration_id).single();
                expect(data).toEqual({ tier: "early_bird", price_cents: 63500 });
            } finally {
                await secret.from("registration_settings").update({ current_tier: "early_bird" }).eq("id", true);
            }
        });

        it.each([
            ["anon", () => anon],
            ["a logged-in non-admin", () => nonAdmin],
            ["the admin", () => admin],
        ])("can't be called by %s", async (_label, client) => {
            const { error } = await client().rpc("create_pending_registration", args());
            expect(error?.code).toBe(PERMISSION_DENIED);
        });
    });

    describe("workshop capacity (27 places)", () => {
        const fillTo = async (count: number) => {
            for (let i = 0; i < count; i++) await createPending(workshopArgs({ p_email: `holder${i}@example.com` }));
        };

        it("is public as a count only", async () => {
            expect(await placesLeft()).toBe(27);
        });

        it("lets the 27th person in, then refuses the workshop but still sells conference only", async () => {
            await fillTo(26);
            expect(await placesLeft()).toBe(1);

            await createPending(workshopArgs({ p_email: "twenty-seventh@example.com" }));
            expect(await placesLeft()).toBe(0);

            const { error } = await secret.rpc("create_pending_registration", workshopArgs({ p_email: "late@example.com" }));
            expect(error && toPendingRegistrationError(error)).toBe("sold_out");

            await expect(createPending({ p_email: "conference-only@example.com" })).resolves.toBeDefined();
        });

        it("gives the last place to exactly one of two simultaneous requests", { timeout: 30_000 }, async () => {
            await fillTo(26);

            const [first, second] = await Promise.all([
                secretClient().rpc("create_pending_registration", workshopArgs({ p_email: "racer.one@example.com" })),
                secretClient().rpc("create_pending_registration", workshopArgs({ p_email: "racer.two@example.com" })),
            ]);

            const outcomes = [first, second].map((result) => (result.error ? toPendingRegistrationError(result.error) : "ok"));
            expect(outcomes.sort()).toEqual(["ok", "sold_out"]);
            expect(await placesLeft()).toBe(0);
        });

        it("releases the place of an abandoned or expired checkout", async () => {
            await fillTo(27);
            const { data } = await secret.from("registrations").select("id").limit(2);
            const [abandoned, expired] = data ?? [];

            await secret.from("registrations").update({ status: "abandoned" }).eq("id", abandoned.id);
            expect(await placesLeft()).toBe(1);

            // Past the session's expiry plus the 15-minute grace
            const longAgo = new Date(Date.now() - 20 * 60_000).toISOString();
            await secret.from("registrations").update({ checkout_expires_at: longAgo }).eq("id", expired.id);
            expect(await placesLeft()).toBe(2);
        });

        it("matches the TypeScript counting rule for every status", async () => {
            const now = new Date();
            const expiries = [
                new Date(now.getTime() + 10 * 60_000), // session still open
                new Date(now.getTime() - 10 * 60_000), // expired, within the grace
                new Date(now.getTime() - 20 * 60_000), // expired, past the grace
            ];

            for (const status of REGISTRATION_STATUSES) {
                for (const expiresAt of expiries) {
                    const { data, error } = await secret.rpc("registration_holds_place", {
                        status,
                        checkout_expires_at: expiresAt.toISOString(),
                    });
                    expect(error).toBeNull();
                    expect(data, `${status}, expires ${expiresAt.toISOString()}`).toBe(holdsPlace(status, expiresAt, now));
                }
            }
        });
    });

    describe("RLS and grants", () => {
        let registrationId: string;

        beforeEach(async () => {
            registrationId = (await createPending()).registration_id;
            await secret.from("stripe_events").insert({
                id: "evt_test_rls",
                type: "checkout.session.completed",
                stripe_created_at: new Date().toISOString(),
                livemode: false,
                outcome: "processed",
                registration_id: registrationId,
            });
            await secret.from("email_log").insert({
                registration_id: registrationId,
                template: "non_member_confirmation",
                trigger: "automatic",
                idempotency_key: `non_member_confirmation:${registrationId}`,
                to_address: "test.attendee@example.com",
            });
        });

        it.each(TABLES)("anon can't read or write %s", async (table) => {
            const read = await anon.from(table).select("*");
            const remove = await anon.from(table).delete().not(KEY_COLUMN[table], "is", null);
            expect([read.error?.code, remove.error?.code]).toEqual([PERMISSION_DENIED, PERMISSION_DENIED]);
        });

        it.each(TABLES)("a logged-in non-admin sees no rows of %s and can't write", async (table) => {
            const read = await nonAdmin.from(table).select("*");
            const remove = await nonAdmin.from(table).delete().not(KEY_COLUMN[table], "is", null);
            expect(read).toMatchObject({ error: null, data: [] });
            expect(remove.error?.code).toBe(PERMISSION_DENIED);
        });

        it.each(TABLES)("the admin can read %s", async (table) => {
            const { data, error } = await admin.from(table).select("*");
            expect(error).toBeNull();
            expect(data?.length).toBeGreaterThan(0);
        });

        it("the admin can't change a registration directly (status changes go through the state machine)", async () => {
            const update = await admin.from("registrations").update({ status: "cancelled" }).eq("id", registrationId);
            const rename = await admin.from("registrations").update({ full_name: "Someone Else" }).eq("id", registrationId);
            const audit = await admin.from("registration_audit_log").delete().eq("registration_id", registrationId);
            expect([update.error?.code, rename.error?.code, audit.error?.code]).toEqual([
                PERMISSION_DENIED,
                PERMISSION_DENIED,
                PERMISSION_DENIED,
            ]);
        });

        it("anon can't insert a registration even with every field filled in", async () => {
            const { error } = await anon.from("registrations").insert({
                membership_choice: "non_member",
                ticket_option: "conference_only",
                tier: "early_bird",
                price_cents: 1,
                full_name: "Sneaky",
                email: "sneaky@example.com",
                policy_version: "v1",
                policy_text_sha256: "0".repeat(64),
                checkout_expires_at: new Date().toISOString(),
            });
            expect(error?.code).toBe(PERMISSION_DENIED);
        });
    });

    describe("constraints (write-path protection)", () => {
        let registrationId: string;

        type RegistrationUpdate = Database["public"]["Tables"]["registrations"]["Update"];
        const updateRegistration = (values: RegistrationUpdate) => secret.from("registrations").update(values).eq("id", registrationId);
        const paid = { stripe_payment_intent_id: "pi_test", amount_paid_cents: 63500, paid_at: new Date().toISOString() };

        beforeEach(async () => {
            registrationId = (await createPending()).registration_id;
        });

        it.each([
            ["'none' with another dietary value", ["none", "vegan"] as const],
            ["a repeated dietary value", ["vegan", "vegan"] as const],
            ["no dietary value", [] as const],
        ])("rejects %s", async (_label, dietary) => {
            const { error } = await secret.from("registration_private_details").update({ dietary: [...dietary] }).eq("registration_id", registrationId);
            expect(error?.code).toBe(CHECK_VIOLATION);
        });

        it("rejects verification details on a non-member", async () => {
            const { error } = await updateRegistration({ membership_name: "Someone", membership_email: "someone@example.com" });
            expect(error?.code).toBe(CHECK_VIOLATION);
        });

        it("rejects a member without verification details", async () => {
            const { error } = await secret.rpc("create_pending_registration", args({ p_membership_choice: "joining_member" }));
            expect(error?.code).toBe(CHECK_VIOLATION);
        });

        it("rejects a paid status without payment details", async () => {
            const { error } = await updateRegistration({ status: "confirmed" });
            expect(error?.code).toBe(CHECK_VIOLATION);
        });

        it("accepts a non-member being confirmed with payment details", async () => {
            const { error } = await updateRegistration({ status: "confirmed", ...paid });
            expect(error).toBeNull();
        });

        it("rejects a non-member on the member verification path", async () => {
            const { error } = await updateRegistration({ status: "awaiting_verification", ...paid });
            expect(error?.code).toBe(CHECK_VIOLATION);
        });

        it("rejects refunded without a refund", async () => {
            const { error } = await updateRegistration({ status: "refunded", ...paid });
            expect(error?.code).toBe(CHECK_VIOLATION);
        });

        it("rejects refunding more than was paid", async () => {
            const { error } = await updateRegistration({
                status: "refunded",
                ...paid,
                refunded_amount_cents: 63501,
                refunded_at: new Date().toISOString(),
            });
            expect(error?.code).toBe(CHECK_VIOLATION);
        });

        it("rejects reusing a Checkout Session id", async () => {
            const other = await createPending({ p_email: "other@example.com" });
            await updateRegistration({ stripe_checkout_session_id: "cs_test_same" });
            const { error } = await secret.from("registrations").update({ stripe_checkout_session_id: "cs_test_same" }).eq("id", other.registration_id);
            expect(error?.code).toBe(UNIQUE_VIOLATION);
        });

        it("rejects a second copy of a Stripe event (idempotency)", async () => {
            const event = {
                id: "evt_test_duplicate",
                type: "checkout.session.completed",
                stripe_created_at: new Date().toISOString(),
                livemode: false,
                outcome: "processed" as const,
            };
            expect((await secret.from("stripe_events").insert(event)).error).toBeNull();
            expect((await secret.from("stripe_events").insert(event)).error?.code).toBe(UNIQUE_VIOLATION);
        });

        it("rejects queueing the same automatic email twice", async () => {
            const email = {
                registration_id: registrationId,
                template: "refund_processed" as const,
                trigger: "automatic" as const,
                idempotency_key: `refund_processed:${registrationId}`,
                to_address: "test.attendee@example.com",
            };
            expect((await secret.from("email_log").insert(email)).error).toBeNull();
            expect((await secret.from("email_log").insert(email)).error?.code).toBe(UNIQUE_VIOLATION);
        });

        it("rejects an admin audit entry without the admin's id", async () => {
            const { error } = await secret.from("registration_audit_log").insert({
                registration_id: registrationId,
                actor: "admin",
                action: "attendee_details_corrected",
            });
            expect(error?.code).toBe(CHECK_VIOLATION);
        });
    });
});