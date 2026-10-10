import { isAuthError } from "@supabase/supabase-js";

/** A normalised error that's safe to show to the user. */
export interface HandledError {
    /** User-facing copy explaining what went wrong - never a raw stack or provider message. */
    message: string;
    /** What the user can do about it, when there's something useful to suggest. */
    hint: string | null;
    /** Provider error code (e.g. Supabase's `invalid_credentials` or Postgres' `23505`), when there is one. */
    code: string | null;
    /** Plain-English meaning of `code` (or the raw provider message for unknown errors), for a "technical details" view. */
    codeMeaning: string | null;
}

/** Copy for one known error code. */
interface ErrorCopy {
    message: string;
    hint: string;
    codeMeaning: string;
}

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";
const FALLBACK_HINT =
    "Try again in a moment. If it keeps happening, copy the technical details and send them to your developer.";

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
const DB_ERRORS: Record<string, ErrorCopy> = {
    "23505": {
        message: "Another item already uses this value, and it has to be unique.",
        hint: "Change the value so it's different from the other item, then save again.",
        codeMeaning: "Unique value conflict - the database only allows one item with this value.",
    },
    "23503": {
        message: "This item is linked to something else, so the change can't be made.",
        hint: "Remove or change the linked item first, then try again.",
        codeMeaning: "Linked record conflict - another item still points at this one.",
    },
    "23514": {
        message: "One of the values isn't one of the allowed options.",
        hint: "Check the dropdowns and fields, then save again.",
        codeMeaning: "Allowed values check failed - a value is outside the set the database accepts.",
    },
    "23502": {
        message: "A required field was left empty.",
        hint: "Fill in every required field, then save again.",
        codeMeaning: "Missing required value - a column that can't be empty was empty.",
    },
    "22P02": {
        message: "One of the values is in the wrong format.",
        hint: "Check the fields for anything unusual, then save again.",
        codeMeaning: "Invalid format - a value couldn't be read as the type the database expects.",
    },
    "42501": {
        message: "Your account doesn't have permission to change this.",
        hint: "Make sure you're signed in with the admin account, then try again.",
        codeMeaning: "Permission denied - the database's access rules blocked the change.",
    },
    PGRST116: {
        message: "This item couldn't be found. It may have been deleted or changed since the page loaded.",
        hint: "Refresh the page to load the latest content, then try again.",
        codeMeaning: "No matching item - it doesn't exist or isn't visible to this account.",
    },
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
 * Unknown errors get generic copy, but their raw message is kept in `codeMeaning` so an
 * admin has something concrete to pass on to a developer.
 *
 * @param error - Anything: a Supabase `AuthError`, a PostgREST error, a regular `Error`, a string, or unknown.
 * @param context - Short label for where it happened (e.g. `"login"`), used to prefix the server log.
 * @returns A {@link HandledError} whose `message` can be rendered directly.
 */
export function handleError(error: unknown, context = "unknown"): HandledError {
    console.error(`[${context}]`, error);

    if (isAuthError(error)) {
        const code = error.code ?? null;
        const message = code ? AUTH_ERROR_MESSAGES[code] : undefined;
        return {
            message: message ?? FALLBACK_MESSAGE,
            hint: message ? null : FALLBACK_HINT,
            code,
            codeMeaning: message ? null : error.message,
        };
    }

    if (isPostgrestError(error)) {
        const copy = DB_ERRORS[error.code];
        if (copy) return { ...copy, code: error.code };
        return { message: FALLBACK_MESSAGE, hint: FALLBACK_HINT, code: error.code, codeMeaning: error.message };
    }

    const rawMessage = error instanceof Error ? error.message : typeof error === "string" ? error : null;
    return { message: FALLBACK_MESSAGE, hint: FALLBACK_HINT, code: null, codeMeaning: rawMessage };
}