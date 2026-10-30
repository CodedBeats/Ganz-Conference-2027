import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Where admins land after signing in. */
export const ADMIN_HOME_PATH = "/admin";

/** Path prefixes that need a session - anonymous visitors get sent to `/login`. */
const PROTECTED_PATH_PREFIXES = ["/admin"];

/**
 * Refreshes the Supabase session cookie on every request and handles auth-based redirects.
 *
 * @remarks
 * Adapted from the Supabase SSR template. The public site never forces a login; only
 * {@link PROTECTED_PATH_PREFIXES} do. This is an optimistic cookie check - pages still verify
 * the user themselves via `requireUser` in `src/lib/auth.ts`.
 * Must return `supabaseResponse` (or copy its cookies onto any new response), otherwise the
 * browser and server sessions drift apart and users get randomly logged out.
 *
 * @see {@link proxy} in `src/proxy.ts`, which runs this on every matched request.
 */
export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    // created per request - never hoist this client into module scope
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options),
                    );
                },
            },
        },
    );

    // nothing may run between createServerClient and getClaims - it's what refreshes the session
    const { data } = await supabase.auth.getClaims();
    const isAuthed = Boolean(data?.claims);
    const { pathname } = request.nextUrl;

    const redirectTo = (path: string) => {
        const redirectResponse = NextResponse.redirect(new URL(path, request.url));
        // carry any refreshed session cookies across to the redirect
        supabaseResponse.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
        return redirectResponse;
    };

    // Only ever redirect *towards* /login here. getClaims trusts any validly signed token, so a
    // revoked session (deleted user, signed out elsewhere) still looks authed until it expires -
    // sending /login to /admin on that basis loops with requireUser sending /admin back to /login.
    // The login page does its own verified "already signed in" check instead.
    const isProtected = PROTECTED_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
    if (!isAuthed && isProtected) return redirectTo("/login");

    return supabaseResponse;
}
