import { isAuthError } from "@supabase/supabase-js";

/** A normalised error that's safe to show to the user. */
export interface HandledError {
    /** User-facing copy - never a raw stack or provider message. */
    message: string;
    /** Provider error code (e.g. Supabase's `invalid_credentials`), when there is one. */
    code: string | null;
}

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

/** Supabase Auth error codes mapped to friendlier copy. Unlisted codes fall back to {@link FALLBACK_MESSAGE}. */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
    invalid_credentials: "Incorrect email or password.",
    email_not_confirmed: "This account hasn't been confirmed yet.",
    user_banned: "This account has been disabled.",
    over_request_rate_limit: "Too many attempts. Please wait a moment and try again.",
    validation_failed: "Please enter a valid email and password.",
};

/**
 * Single entry point for turning any thrown or returned error into user-facing copy.
 *
 * @remarks
 * Everything goes through here for now - logging plus message mapping. As cases grow
 * (storage errors, DB errors, etc.), split them out into their own helpers and have
 * this function delegate to them, so call sites never have to change.
 *
 * @param error - Anything: a Supabase `AuthError`, a regular `Error`, a string, or unknown.
 * @param context - Short label for where it happened (e.g. `"login"`), used to prefix the server log.
 * @returns A {@link HandledError} whose `message` can be rendered directly.
 */
export function handleError(error: unknown, context = "unknown"): HandledError {
    console.error(`[${context}]`, error);

    if (isAuthError(error)) {
        const code = error.code ?? null;
        return { message: (code && AUTH_ERROR_MESSAGES[code]) || FALLBACK_MESSAGE, code };
    }

    return { message: FALLBACK_MESSAGE, code: null };
}
