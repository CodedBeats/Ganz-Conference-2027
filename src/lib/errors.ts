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
 * Postgres SQLSTATE and PostgREST codes mapped to friendlier copy.
 *
 * @remarks
 * `PGRST116` is what `.single()` returns for zero rows - for CMS updates and deletes that
 * means the row doesn't exist or RLS hid it.
 */
const DB_ERROR_MESSAGES: Record<string, string> = {
    "23505": "That already exists.",
    "23503": "This is still in use elsewhere, so it can't be removed.",
    "23514": "One of the values isn't allowed.",
    "23502": "A required field is missing.",
    "22P02": "One of the values is in the wrong format.",
    "42501": "You don't have permission to do that.",
    PGRST116: "That item couldn't be found.",
};

/** The shape PostgREST errors come back in from `supabase.from(...)` queries. */
interface PostgrestErrorLike {
    message: string;
    code: string;
    details: string | null;
    hint: string | null;
}

/**
 * Duck-type check for a PostgREST error.
 *
 * @remarks
 * Query errors are returned as plain objects, not class instances, so `instanceof`
 * isn't reliable here.
 */
export function isPostgrestError(error: unknown): error is PostgrestErrorLike {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string" &&
        "message" in error &&
        typeof error.message === "string" &&
        "details" in error &&
        "hint" in error
    );
}

/**
 * Single entry point for turning any thrown or returned error into user-facing copy.
 *
 * @remarks
 * Everything goes through here for now - logging plus message mapping. As cases grow
 * (storage errors, etc.), split them out into their own helpers and have this function
 * delegate to them, so call sites never have to change.
 *
 * @param error - Anything: a Supabase `AuthError`, a PostgREST error, a regular `Error`, a string, or unknown.
 * @param context - Short label for where it happened (e.g. `"login"`), used to prefix the server log.
 * @returns A {@link HandledError} whose `message` can be rendered directly.
 */
export function handleError(error: unknown, context = "unknown"): HandledError {
    console.error(`[${context}]`, error);

    if (isAuthError(error)) {
        const code = error.code ?? null;
        return { message: (code && AUTH_ERROR_MESSAGES[code]) || FALLBACK_MESSAGE, code };
    }

    if (isPostgrestError(error)) {
        return { message: DB_ERROR_MESSAGES[error.code] ?? FALLBACK_MESSAGE, code: error.code };
    }

    return { message: FALLBACK_MESSAGE, code: null };
}
