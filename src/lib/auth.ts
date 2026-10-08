import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * The signed-in user for this request, or `null`.
 *
 * @remarks
 * Uses `getUser()` rather than `getClaims()` - it round-trips to Supabase Auth, so a revoked
 * session is caught here even if the proxy's optimistic cookie check let it through.
 * Wrapped in `cache` so multiple calls in one render only hit Auth once.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user;
});

/**
 * Guard for admin-only pages and actions - returns the user or redirects to `/login`.
 *
 * @see {@link updateSession} in `src/lib/supabase/middleware.ts` for the earlier, optimistic redirect.
 */
export async function requireUser(): Promise<User> {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    return user;
}
