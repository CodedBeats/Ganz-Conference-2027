import "server-only";

/**
 * Server-side rate limiting for public form submissions, stored in Supabase (`hit_rate_limit`).
 *
 * @module
 */
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/** Limits per action: at most `maxHits` submissions per `windowSeconds` from one IP. */
export const RATE_LIMITS = {
    register: { maxHits: 5, windowSeconds: 10 * 60 },
} as const;

export type RateLimitedAction = keyof typeof RATE_LIMITS;

/**
 * The caller's IP, from the headers Vercel sets.
 *
 * @remarks
 * `x-forwarded-for` can be a list (client, then proxies); the client is the first entry.
 */
async function clientIp(): Promise<string | null> {
    const requestHeaders = await headers();
    const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
    return forwarded || requestHeaders.get("x-real-ip")?.trim() || null;
}

/**
 * Records a submission and says whether the caller is still within the limit.
 *
 * @remarks
 * The key is a sha256 of the IP, so the table never holds raw addresses, and its rows are cleared
 * after two windows.
 *
 * **Fails open** (returns `true`) when the IP is unknown, the secret key isn't configured or the
 * database call fails, logging why. That suits the `/register` preview, which saves nothing. Real
 * checkout (P2-15) should fail closed instead.
 */
export async function checkRateLimit(action: RateLimitedAction): Promise<boolean> {
    const ip = await clientIp();
    const supabase = createAdminClient();
    if (!ip || !supabase) {
        console.warn(`[rateLimit:${action}] skipped: ${ip ? "SUPABASE_SECRET_KEY isn't set" : "no client IP"}`);
        return true;
    }

    const { maxHits, windowSeconds } = RATE_LIMITS[action];
    const key = `${action}:${createHash("sha256").update(ip).digest("hex")}`;
    const { data, error } = await supabase.rpc("hit_rate_limit", {
        p_key: key,
        p_max_hits: maxHits,
        p_window_seconds: windowSeconds,
    });

    if (error) {
        console.error(`[rateLimit:${action}] check failed, allowing the request`, error);
        return true;
    }
    if (!data) console.warn(`[rateLimit:${action}] limit reached`);
    return data;
}
