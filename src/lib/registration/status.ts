/**
 * The registration status machine: which statuses exist, who may move a registration between
 * them, which hold a workshop place, and which emails each one triggers.
 *
 * @remarks
 * There is no stored `paid` status. Payment moves `pending_payment` straight to `confirmed`
 * (non-members) or `awaiting_verification` (members) in one transaction, and "has paid" is the
 * fact `paid_at is not null` ({@link isPaidStatus}). That way a half-finished webhook can never
 * leave a registration sitting in an in-between state.
 *
 * Every status write must be a compare-and-set on the current status
 * (`update ... where id = $1 and status = $from`), with {@link resolveTransition} deciding what a
 * late or duplicate Stripe event means. The DB checks in the registrations migration protect the
 * write path from the other side.
 *
 * Client-safe.
 *
 * @module
 */
import { assertNever } from "@/lib/utils";
import type { AuditActor } from "./audit";
import { CHECKOUT_HOLD_GRACE_MINUTES } from "./config";
import type { EmailTemplate } from "./emails";
import type { Audience } from "./options";

/** Matches the `registration_status` enum. */
export const REGISTRATION_STATUSES = [
    "pending_payment",
    "confirmed",
    "awaiting_verification",
    "approved",
    "rejected",
    "refunded",
    "abandoned",
    "cancelled",
] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const REGISTRATION_STATUS_LABELS = {
    pending_payment: "Awaiting payment",
    confirmed: "Confirmed",
    awaiting_verification: "Awaiting membership check",
    approved: "Approved",
    rejected: "Membership not verified",
    refunded: "Refunded",
    abandoned: "Abandoned",
    cancelled: "Cancelled",
} as const satisfies Record<RegistrationStatus, string>;

/** Statuses before any payment. Mirrors the `registrations_paid_status` check. */
export const UNPAID_STATUSES = ["pending_payment", "abandoned"] as const satisfies readonly RegistrationStatus[];
export type UnpaidStatus = (typeof UNPAID_STATUSES)[number];

/** Statuses after a payment that hasn't been fully refunded. */
export type PaidStatus = Exclude<RegistrationStatus, UnpaidStatus | "refunded">;

export function isUnpaidStatus(status: RegistrationStatus): status is UnpaidStatus {
    return UNPAID_STATUSES.some((unpaid) => unpaid === status);
}

/** Whether a registration in this status has paid (it may since have been refunded). */
export function isPaidStatus(status: RegistrationStatus): status is PaidStatus | "refunded" {
    return !isUnpaidStatus(status);
}

/** Whether the person is coming: paid as a non-member, or a member whose membership was approved. */
export function isAttending(status: RegistrationStatus): boolean {
    return status === "confirmed" || status === "approved";
}

/** For each status, the statuses it can move to and the actors allowed to make that move. */
export type TransitionTable = {
    readonly [From in RegistrationStatus]: { readonly [To in RegistrationStatus]?: readonly AuditActor[] };
};

/**
 * Every allowed move.
 *
 * @remarks
 * - Stripe moves a registration out of `pending_payment` on payment or expiry. `system` can
 *   abandon it too, when creating the Checkout Session fails.
 * - Admins approve or reject members, and can cancel a paid registration (GANZ-side, case by case).
 * - A full refund always comes back through `charge.refunded`, whether the admin started it or it
 *   was done in the Stripe dashboard, so only Stripe sets `refunded`.
 * - `refunded` and `abandoned` are terminal. A partial refund doesn't change the status.
 */
export const TRANSITIONS: TransitionTable = {
    pending_payment: {
        confirmed: ["stripe_webhook"],
        awaiting_verification: ["stripe_webhook"],
        abandoned: ["stripe_webhook", "system"],
    },
    confirmed: {
        refunded: ["stripe_webhook"],
        cancelled: ["admin"],
    },
    awaiting_verification: {
        approved: ["admin"],
        rejected: ["admin"],
        refunded: ["stripe_webhook"],
        cancelled: ["admin"],
    },
    approved: {
        refunded: ["stripe_webhook"],
        cancelled: ["admin"],
    },
    rejected: {
        refunded: ["stripe_webhook"],
    },
    cancelled: {
        refunded: ["stripe_webhook"],
    },
    refunded: {},
    abandoned: {},
};

/** Whether `actor` may move a registration from `from` to `to`. */
export function canTransition(from: RegistrationStatus, to: RegistrationStatus, actor: AuditActor): boolean {
    return TRANSITIONS[from][to]?.includes(actor) ?? false;
}

/** Statuses a registration can never leave. */
export function isTerminal(status: RegistrationStatus): boolean {
    return Object.keys(TRANSITIONS[status]).length === 0;
}

/** Every status reachable from `status` in one or more moves, by any actor. */
function reachableFrom(status: RegistrationStatus): Set<RegistrationStatus> {
    const reached = new Set<RegistrationStatus>();
    const queue: RegistrationStatus[] = [status];

    for (let current = queue.shift(); current; current = queue.shift()) {
        for (const next of REGISTRATION_STATUSES) {
            if (TRANSITIONS[current][next] && !reached.has(next)) {
                reached.add(next);
                queue.push(next);
            }
        }
    }
    return reached;
}

/**
 * What to do with a requested move, given the registration's current status.
 *
 * - `apply`: allowed, so make the compare-and-set update.
 * - `already_done`: the registration is already at `to` or has moved past it (a duplicate or late
 *   event). Change nothing and record the event as `processed`.
 * - `not_allowed`: anything else. Change nothing and flag it `needs_review`; never accept it silently.
 *
 * @remarks
 * Stripe doesn't guarantee delivery order, so a `checkout.session.completed` can arrive after the
 * registration was already refunded. Because `refunded` is reachable from `confirmed`, that is
 * `already_done`, not an error, and the registration is never moved backwards.
 */
export function resolveTransition(
    current: RegistrationStatus,
    to: RegistrationStatus,
    actor: AuditActor,
): "apply" | "already_done" | "not_allowed" {
    if (canTransition(current, to, actor)) return "apply";
    if (current === to || reachableFrom(to).has(current)) return "already_done";
    return "not_allowed";
}

/** Where a registration goes once its payment is confirmed. */
export function statusAfterPayment(audience: Audience): "confirmed" | "awaiting_verification" {
    switch (audience) {
        case "non_member":
            return "confirmed";
        case "member":
            return "awaiting_verification";
        default:
            return assertNever(audience);
    }
}

/**
 * Whether each status holds one of the 27 workshop places. Mirrors `registration_holds_place()`.
 *
 * @remarks
 * `until_expiry`: a pending registration holds its place until its Checkout Session expires, plus
 * {@link CHECKOUT_HOLD_GRACE_MINUTES}.
 */
export const HOLDS_PLACE = {
    pending_payment: "until_expiry",
    confirmed: "always",
    awaiting_verification: "always",
    approved: "always",
    rejected: "never",
    refunded: "never",
    abandoned: "never",
    cancelled: "never",
} as const satisfies Record<RegistrationStatus, "always" | "until_expiry" | "never">;

/** Whether a registration on conference + workshop currently counts towards the cap. */
export function holdsPlace(status: RegistrationStatus, checkoutExpiresAt: Date, now: Date): boolean {
    const rule = HOLDS_PLACE[status];
    switch (rule) {
        case "always":
            return true;
        case "never":
            return false;
        case "until_expiry":
            return checkoutExpiresAt.getTime() + CHECKOUT_HOLD_GRACE_MINUTES * 60_000 > now.getTime();
        default:
            return assertNever(rule);
    }
}

/**
 * The automatic emails sent when a registration enters each status.
 *
 * @remarks
 * Each is queued in `email_log` under `automaticEmailKey()` (see `emails.ts`), so it goes out at most once per
 * registration. A cancellation is handled case by case, so it sends nothing automatically.
 */
export const EMAILS_ON_ENTER = {
    pending_payment: [],
    confirmed: ["non_member_confirmation", "admin_new_registration_alert"],
    awaiting_verification: ["member_payment_received", "admin_new_registration_alert"],
    approved: ["membership_approved"],
    rejected: ["membership_not_verified"],
    refunded: ["refund_processed"],
    abandoned: [],
    cancelled: [],
} as const satisfies Record<RegistrationStatus, readonly EmailTemplate[]>;