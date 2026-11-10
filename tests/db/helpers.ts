/**
 * Shared setup for the opt-in DB tests (`npm run test:db`), which run against the local Supabase stack.
 *
 * Every client goes through the Data API with a real key, so RLS and grants apply exactly as
 * they do for the site. (Studio's SQL editor runs as `postgres` and bypasses RLS, so it can't
 * prove a policy works.)
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadEnv } from "vite";
import type { Database } from "../../src/types/database";

export const isDbMode = import.meta.env.MODE === "db";

const env = isDbMode ? loadEnv("db", process.cwd(), "") : {};

/** Reads a required variable, failing with a clear message when `.env.local` is missing it. */
function required(name: string): string {
    const value = env[name]?.trim();
    if (!value) throw new Error(`test:db needs ${name} in .env.local`);
    return value;
}

export type DbClient = SupabaseClient<Database>;

const NO_SESSION_STORAGE = { auth: { persistSession: false, autoRefreshToken: false } } as const;

/** A client with the publishable key and no session: what an anonymous visitor gets. */
export function anonClient(): DbClient {
    return createClient<Database>(required("SUPABASE_URL_DEV"), required("SUPABASE_PUBLISHABLE_KEY_DEV"), NO_SESSION_STORAGE);
}

/** A secret-key client. Bypasses RLS - only for test setup and cleanup. */
export function secretClient(): DbClient {
    return createClient<Database>(required("SUPABASE_URL_DEV"), required("SUPABASE_SECRET_KEY_DEV"), NO_SESSION_STORAGE);
}

/** Signs in with the publishable key, so the client acts as that user under RLS. */
async function signedInClient(email: string, password: string): Promise<DbClient> {
    const client = anonClient();
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(`Couldn't sign in as ${email}: ${error.message}`);
    return client;
}

/**
 * The local admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
 *
 * @remarks
 * After `supabase db reset` the admin has to be recreated with
 * `node --env-file=.env.local scripts/create-admin.mjs --dev`.
 */
export function adminClient(): Promise<DbClient> {
    return signedInClient(required("ADMIN_EMAIL"), required("ADMIN_PASSWORD"));
}

/**
 * Creates a throwaway signed-in user without the admin role.
 *
 * @returns The user's client and a `cleanup` that deletes the user; call it in `afterAll`.
 */
export async function nonAdminClient(): Promise<{ client: DbClient; cleanup: () => Promise<void> }> {
    const email = `rls-test-${crypto.randomUUID()}@example.com`;
    const password = crypto.randomUUID();
    const secret = secretClient();

    const { data, error } = await secret.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw new Error(`Couldn't create the non-admin test user: ${error.message}`);

    return {
        client: await signedInClient(email, password),
        cleanup: async () => {
            await secret.auth.admin.deleteUser(data.user.id);
        },
    };
}

/** Postgres "insufficient_privilege": a grant (not RLS) refused the statement. */
export const PERMISSION_DENIED = "42501";