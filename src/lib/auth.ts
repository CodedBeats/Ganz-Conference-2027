import { cache } from "react";
import { notFound, redirect } from "next/navigation";
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
 * Whether the user carries the admin role.
 *
 * @remarks
 * Reads the same `app_metadata.role` claim as `public.is_admin()`, which every write policy
 * checks. Checking it up front matters because RLS turns a non-admin update or delete into a
 * silent zero-row no-op rather than an error. `app_metadata` can't be edited by the user,
 * unlike `user_metadata`.
 */
export function isAdminUser(user: User): boolean {
    return user.app_metadata.role === "admin";
}

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

/**
 * Guard for pages only admins may see yet (e.g. `/register` while it's being tested).
 *
 * @remarks
 * Signed-out visitors are sent to `/login` like {@link requireUser}. A signed-in user without the
 * admin role gets a 404, so the page simply doesn't exist for them. Server Actions behind such a
 * page must check {@link isAdminUser} themselves - the page guard doesn't protect them.
 */
export async function requireAdmin(): Promise<User> {
    const user = await requireUser();
    if (!isAdminUser(user)) notFound();
    return user;
}
