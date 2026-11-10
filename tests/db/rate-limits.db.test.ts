// @vitest-environment node
/**
 * The Supabase-backed rate limiter (`hit_rate_limit`) used by the /register form.
 *
 * Skipped in normal runs. Run with `npm run test:db` against the local stack.
 */
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { adminClient, anonClient, isDbMode, nonAdminClient, PERMISSION_DENIED, secretClient, type DbClient } from "./helpers";

describe.runIf(isDbMode)("rate limits (local DB)", () => {
    let secret: DbClient;

    const hit = (client: DbClient, key: string, maxHits = 5) =>
        client.rpc("hit_rate_limit", { p_key: key, p_max_hits: maxHits, p_window_seconds: 600 });

    beforeAll(() => {
        secret = secretClient();
    });

    afterEach(async () => {
        await secret.from("rate_limits").delete().like("key", "test:%");
    });

    it("allows up to the limit in a window, then refuses", async () => {
        const key = `test:${crypto.randomUUID()}`;
        const results: (boolean | null)[] = [];
        for (let attempt = 0; attempt < 7; attempt++) results.push((await hit(secret, key)).data);
        expect(results).toEqual([true, true, true, true, true, false, false]);
    });

    it("counts each key separately", async () => {
        const [first, second] = [`test:${crypto.randomUUID()}`, `test:${crypto.randomUUID()}`];
        expect((await hit(secret, first, 1)).data).toBe(true);
        expect((await hit(secret, first, 1)).data).toBe(false);
        expect((await hit(secret, second, 1)).data).toBe(true);
    });

    it("refuses nonsense limits", async () => {
        const { error } = await secret.rpc("hit_rate_limit", { p_key: "test:bad", p_max_hits: 0, p_window_seconds: 600 });
        expect(error?.message).toBe("invalid_rate_limit");
    });

    it("can't be used or read by anon, a logged-in user or the admin", async () => {
        const { client: nonAdmin, cleanup } = await nonAdminClient();
        try {
            for (const client of [anonClient(), nonAdmin, await adminClient()]) {
                expect((await hit(client, "test:outsider")).error?.code).toBe(PERMISSION_DENIED);
                expect((await client.from("rate_limits").select("*")).error?.code).toBe(PERMISSION_DENIED);
            }
        } finally {
            await cleanup();
        }
    });
});
