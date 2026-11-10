import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * A Supabase client with the secret key, for trusted server code only (rate limits now; checkout
 * and the Stripe webhook later).
 *
 * @remarks
 * It bypasses RLS, so it must never reach the browser: `server-only` makes importing this from a
 * client component a build error. No session is stored - every call is made as the service role.
 *
 * Needs `SUPABASE_SECRET_KEY` for the project in `NEXT_PUBLIC_SUPABASE_URL` (set it in Vercel too).
 *
 * @returns The client, or `null` when the secret key isn't configured, so each caller decides
 * whether to fail open or closed.
 */
export function createAdminClient(): SupabaseClient<Database> | null {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    if (!url || !secretKey) return null;

    return createClient<Database>(url, secretKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
}
