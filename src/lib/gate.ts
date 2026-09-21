import { createHmac, timingSafeEqual } from "node:crypto";

/** Name of the cookie that marks a visitor as having passed the pre-launch password gate. */
export const GATE_COOKIE_NAME = "ganz_gate_token";

/** Lifetime of the gate cookie, in seconds (30 days). */
export const GATE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const GATE_HMAC_MESSAGE = "ganz-2027-gate";

/**
 * Derives the token stored in the gate cookie once a visitor authenticates.
 *
 * @remarks
 * Deriving the cookie value via HMAC (keyed on `SITE_PASSWORD`) instead of storing the raw
 * password means the password itself never round-trips through the browser, while both this
 * function and {@link isValidGateToken} stay in sync without a session store.
 *
 * @returns The expected cookie token, or `null` if `SITE_PASSWORD` is unset/empty — callers
 * should treat `null` as "the gate is disabled".
 */
export function getExpectedGateToken(): string | null {
    const password = process.env.SITE_PASSWORD;
    if (!password) return null;

    return createHmac("sha256", password).update(GATE_HMAC_MESSAGE).digest("hex");
}

/**
 * Timing-safe check of a submitted password against `SITE_PASSWORD`.
 *
 * @param candidate - The password submitted via the gate form.
 * @returns `false` if `SITE_PASSWORD` is unset, so a blank env var can never be "guessed" with an empty submission.
 */
export function isCorrectPassword(candidate: string): boolean {
    const password = process.env.SITE_PASSWORD;
    if (!password) return false;

    const candidateBuffer = Buffer.from(candidate);
    const passwordBuffer = Buffer.from(password);
    if (candidateBuffer.length !== passwordBuffer.length) return false;

    return timingSafeEqual(candidateBuffer, passwordBuffer);
}

/**
 * Timing-safe check of a gate cookie value against the expected token.
 *
 * @param token - The `ganz_gate_token` cookie value read from the incoming request, if present.
 * @returns `false` when the gate is disabled ({@link getExpectedGateToken} is `null`) or the token is missing/mismatched.
 */
export function isValidGateToken(token: string | undefined): boolean {
    const expected = getExpectedGateToken();
    if (!expected || !token) return false;

    const tokenBuffer = Buffer.from(token);
    const expectedBuffer = Buffer.from(expected);
    if (tokenBuffer.length !== expectedBuffer.length) return false;

    return timingSafeEqual(tokenBuffer, expectedBuffer);
}
