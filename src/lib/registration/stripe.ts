/**
 * Types at the Stripe boundary: the events we handle, the metadata we put on our objects, and
 * the outcomes recorded in `stripe_events`.
 *
 * @remarks
 * GANZ's Stripe account is shared with their WooCommerce shop, so the webhook also receives events
 * for payments that have nothing to do with the conference. An event only concerns us when its
 * object carries our {@link STRIPE_SOURCE} metadata (see {@link parseCheckoutMetadata}), or, for
 * `charge.refunded`, when its payment intent matches one of our registrations. Everything else is
 * recorded as `ignored` with no payload and no personal data.
 *
 * Client-safe (no Stripe SDK import).
 *
 * @module
 */
import { STRIPE_SOURCE } from "./config";
import { CURRENCY } from "./money";

/** The webhook events the endpoint subscribes to. Any other type is recorded as `ignored`. */
export const HANDLED_STRIPE_EVENTS = ["checkout.session.completed", "checkout.session.expired", "charge.refunded"] as const;
export type HandledStripeEvent = (typeof HANDLED_STRIPE_EVENTS)[number];

export function isHandledStripeEvent(type: string): type is HandledStripeEvent {
    return HANDLED_STRIPE_EVENTS.some((handled) => handled === type);
}

/** Matches the `stripe_event_outcome` enum. */
export const STRIPE_EVENT_OUTCOMES = ["processed", "ignored", "needs_review", "error"] as const;
export type StripeEventOutcome = (typeof STRIPE_EVENT_OUTCOMES)[number];

/**
 * Why an event needs a person to look at it. Stored in `stripe_events.detail`, never with
 * personal data alongside.
 */
export const STRIPE_EVENT_DETAILS = [
    "unknown_registration",
    "amount_mismatch",
    "currency_mismatch",
    "transition_not_allowed",
    "partial_refund",
] as const;
export type StripeEventDetail = (typeof STRIPE_EVENT_DETAILS)[number];

/**
 * The metadata on every Checkout Session we create, and on its payment intent
 * (`payment_intent_data.metadata`). The registration id also goes in `client_reference_id`.
 *
 * @remarks
 * A type alias rather than an interface so it is assignable to Stripe's `Record<string, string>` metadata.
 */
export type CheckoutMetadata = {
    source: typeof STRIPE_SOURCE;
    registration_id: string;
};

export function buildCheckoutMetadata(registrationId: string): CheckoutMetadata {
    return { source: STRIPE_SOURCE, registration_id: registrationId };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Reads our metadata off a Stripe object.
 *
 * @returns The metadata, or `null` when the object isn't ours (no or wrong `source`) or the
 * registration id isn't a UUID. `null` means the event is ignored.
 */
export function parseCheckoutMetadata(metadata: Record<string, string> | null | undefined): CheckoutMetadata | null {
    if (metadata?.source !== STRIPE_SOURCE) return null;
    const registrationId = metadata.registration_id;
    if (!registrationId || !UUID.test(registrationId)) return null;
    return { source: STRIPE_SOURCE, registration_id: registrationId };
}

/** {@link CURRENCY} as Stripe writes it (lower case); fails to compile if the two ever disagree. */
export const STRIPE_CURRENCY = "aud" as const satisfies Lowercase<typeof CURRENCY>;