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
 * How long GANZ take to verify a membership, shown on the form and in emails.
 *
 * @remarks
 * Zoë suggested 24 to 48 hours; not yet confirmed by Michelle. Change it here only.
 */
export const APPROVAL_TURNAROUND = { businessDays: 2, label: "2 business days" } as const;

/**
 * Shown to members: what happens if GANZ can't confirm their membership.
 *
 * @remarks
 * Deliberately hedged until GANZ answer P2-03 item 1 (full refund, or charge the $150 difference).
 * It promises a refund and an explanation, but not a full refund, since Stripe keeps its fees, and
 * leaves room for GANZ to follow up when they'd rather offer the non-member price. Update it with
 * the P2-23 reject flow and the "membership not verified" email (P2-19).
 */
export const MEMBERSHIP_CHECK_FAILED_NOTE =
    "If GANZ can't confirm your membership, your registration will be refunded and you'll get an email explaining why. GANZ may also contact you about your options, such as registering at the non-member price instead.";

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

/** The summary shown at the top of `/register` (dates corrected per the 10 Nov update). */
export const REGISTER_EVENT_DETAILS = {
    conference: "Conference: Friday 25 - Sunday 27 June 2027",
    workshop: "Pre-conference workshop: Tuesday 22 - Wednesday 23 June 2027",
    venue: "The University of Queensland, St Lucia, Brisbane QLD",
} as const;

/**
 * Shown to people choosing "I'd like to join GANZ".
 *
 * @remarks
 * Draft wording, to be confirmed with Michelle. The $50 student option is gone (Michelle, 6 Nov);
 * only Australian Gestalt students join for free (council, via Zoë, 7 Nov).
 */
export const JOIN_GANZ_NOTE = "Australian Gestalt students can join GANZ for free.";
