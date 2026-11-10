/**
 * Fixed registration settings that live in code rather than the database.
 *
 * @remarks
 * Client-safe. Anything GANZ can change from the dashboard belongs in `registration_settings`
 * or `ticket_prices` instead.
 *
 * @module
 */

/**
 * The time zone dates such as the Early Bird close are read in.
 *
 * @remarks
 * The conference is in Queensland, which has no daylight saving, so the close is a fixed instant.
 */
export const EARLY_BIRD_TIMEZONE = "Australia/Brisbane";

/**
 * Where people join GANZ before registering at the member price (opens in a new tab).
 *
 * @remarks
 * Suggested by Zoë, not yet formally confirmed. The conference site never takes membership payments.
 */
export const JOIN_GANZ_URL = "https://www.ganz.org.au/product-category/membership-options/";

/**
 * The full privacy policy. `null` until GANZ send the link, so the form must handle it being missing
 * rather than linking somewhere wrong.
 */
export const PRIVACY_POLICY_URL: string | null = null;

/**
 * How long GANZ take to verify a membership, shown on the form and in emails.
 *
 * @remarks
 * Zoë suggested 24 to 48 hours; not yet confirmed by Michelle. Change it here only.
 */
export const APPROVAL_TURNAROUND = { businessDays: 2, label: "2 business days" } as const;

/**
 * Marks our Checkout Sessions and payment intents in Stripe's metadata.
 *
 * @remarks
 * GANZ's Stripe account is shared with their WooCommerce shop, so the webhook ignores any event
 * that doesn't carry this.
 */
export const STRIPE_SOURCE = "ganz-conference-2027";

/**
 * How long a Checkout Session lives. Mirrors `interval '35 minutes'` in `create_pending_registration`.
 *
 * @remarks
 * Stripe needs at least 30 minutes between session creation and `expires_at`; the extra 5 covers
 * the time between creating the registration and creating the session.
 */
export const CHECKOUT_SESSION_MINUTES = 35;

/**
 * How long after its session expires a pending registration still holds a workshop place.
 * Mirrors `interval '15 minutes'` in `registration_holds_place()`.
 *
 * @remarks
 * Covers a payment that completes right at expiry. The `checkout.session.expired` webhook moves
 * the registration to `abandoned`, which releases the place immediately, so this is only a fallback.
 */
export const CHECKOUT_HOLD_GRACE_MINUTES = 15;