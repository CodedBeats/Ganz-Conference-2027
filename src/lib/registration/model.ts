/**
 * Converts between database rows and the app's registration types.
 *
 * @remarks
 * On the way in, {@link toCreatePendingRegistrationArgs} turns a validated form submission into the
 * typed arguments of `create_pending_registration`, so a schema field with nowhere to go (or an
 * RPC parameter the schema doesn't fill) fails to compile.
 *
 * On the way out, {@link toRegistration} turns a row into a {@link Registration}: a union on
 * `status` where, for example, every paid status is guaranteed a `payment`. The DB checks make the
 * invariants hold, so the error branch only fires on data that bypassed them.
 *
 * Client-safe (types only from `@/types/database`).
 *
 * @module
 */
import type { Database, Tables } from "@/types/database";
import { assertNever } from "@/lib/utils";
import { toCents, type Cents } from "./money";
import type { DietaryRequirement, GestaltConnection, HeardAbout, PriceTier, TicketOption } from "./options";
import type { CreateRegistrationError, RegistrationInput } from "./schema";
import { isUnpaidStatus, type PaidStatus, type UnpaidStatus } from "./status";

// Write side ------------------------------------------------------------------------------------

export type CreatePendingRegistrationArgs = Database["public"]["Functions"]["create_pending_registration"]["Args"];

/** Optional RPC parameters are omitted rather than sent as `null`. */
const orUndefined = <T>(value: T | null): T | undefined => value ?? undefined;

/**
 * Maps a validated submission to the arguments of `create_pending_registration`.
 *
 * @param input - Output of `registrationInputSchema`.
 * @param policyTextSha256 - The server's hash of the exact policy text for `input.policyVersion`
 *   (P2-14); never taken from the client.
 */
export function toCreatePendingRegistrationArgs(
    input: RegistrationInput,
    policyTextSha256: string,
): CreatePendingRegistrationArgs {
    const { membership } = input;
    const verification = membership.choice === "non_member" ? null : membership;

    return {
        p_membership_choice: membership.choice,
        p_ticket_option: input.ticketOption,
        p_quoted_tier: input.quotedTier,
        p_full_name: input.fullName,
        p_email: input.email,
        p_dietary: input.dietary,
        p_policy_version: input.policyVersion,
        p_policy_text_sha256: policyTextSha256,
        p_pronouns: orUndefined(input.pronouns),
        p_phone: orUndefined(input.phone),
        p_connection_to_gestalt: orUndefined(input.connectionToGestalt),
        p_heard_about: orUndefined(input.heardAbout),
        p_membership_name: verification?.name,
        p_membership_email: verification?.email,
        p_dietary_details: orUndefined(input.dietaryDetails),
        p_access_requirements: orUndefined(input.accessRequirements),
    };
}

/** The refusals `create_pending_registration` raises (as the exception message, SQLSTATE P0001). */
export const PENDING_REGISTRATION_ERRORS = [
    "sold_out",
    "tier_changed",
    "price_unavailable",
] as const satisfies readonly CreateRegistrationError[];
export type PendingRegistrationError = (typeof PENDING_REGISTRATION_ERRORS)[number];

/**
 * Recognises one of the RPC's deliberate refusals in a Supabase error.
 *
 * @returns The refusal, or `null` for any other error (which should be treated as unexpected).
 */
export function toPendingRegistrationError(error: { code?: string; message: string }): PendingRegistrationError | null {
    if (error.code !== "P0001") return null;
    return PENDING_REGISTRATION_ERRORS.find((known) => known === error.message) ?? null;
}

// Read side -------------------------------------------------------------------------------------

export type RegistrationRow = Tables<"registrations">;
export type PrivateDetailsRow = Tables<"registration_private_details">;

/** The membership part of a registration: only members carry the verification details. */
export type Membership =
    | {
          choice: "current_member" | "joining_member";
          audience: "member";
          verificationName: string;
          verificationEmail: string;
      }
    | { choice: "non_member"; audience: "non_member" };

export interface Attendee {
    fullName: string;
    pronouns: string | null;
    email: string;
    phone: string | null;
    connectionToGestalt: GestaltConnection | null;
    heardAbout: HeardAbout | null;
}

export interface Payment {
    intentId: string;
    amount: Cents;
    paidAt: Date;
}

export interface Refund {
    amount: Cents;
    refundedAt: Date;
}

/** The fields every registration has, whatever its status. */
export interface RegistrationBase {
    id: string;
    publicRef: string;
    ticketOption: TicketOption;
    tier: PriceTier;
    /** The price snapshot taken when the registration was created. */
    price: Cents;
    membership: Membership;
    attendee: Attendee;
    policy: { version: string; textSha256: string; acceptedAt: Date };
    checkoutSessionId: string | null;
    checkoutExpiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * A registration, narrowed by status.
 *
 * @remarks
 * Grouped by payment phase rather than one type per status: that's where the guarantees differ.
 * A paid registration may carry a partial refund (made in the Stripe dashboard) without changing status.
 */
export type Registration =
    | (RegistrationBase & { status: UnpaidStatus })
    | (RegistrationBase & { status: PaidStatus; payment: Payment; partialRefund: Refund | null })
    | (RegistrationBase & { status: "refunded"; payment: Payment; refund: Refund });

export type ToRegistrationResult = { ok: true; registration: Registration } | { ok: false; problem: string };

function toMembership(row: RegistrationRow): Membership | null {
    const choice = row.membership_choice;
    switch (choice) {
        case "non_member":
            return { choice, audience: "non_member" };
        case "current_member":
        case "joining_member":
            if (!row.membership_name || !row.membership_email) return null;
            return {
                choice,
                audience: "member",
                verificationName: row.membership_name,
                verificationEmail: row.membership_email,
            };
        default:
            return assertNever(choice);
    }
}

function toPayment(row: RegistrationRow): Payment | null {
    if (!row.stripe_payment_intent_id || row.amount_paid_cents === null || !row.paid_at) return null;
    return {
        intentId: row.stripe_payment_intent_id,
        amount: toCents(row.amount_paid_cents),
        paidAt: new Date(row.paid_at),
    };
}

function toRefund(row: RegistrationRow): Refund | null {
    if (row.refunded_amount_cents === 0 || !row.refunded_at) return null;
    return { amount: toCents(row.refunded_amount_cents), refundedAt: new Date(row.refunded_at) };
}

/**
 * Converts a `registrations` row into a {@link Registration}.
 *
 * @returns `{ ok: false }` with a description when the row breaks an invariant the DB checks
 * should have enforced (no personal data in the message).
 */
export function toRegistration(row: RegistrationRow): ToRegistrationResult {
    const membership = toMembership(row);
    if (!membership) return { ok: false, problem: `registration ${row.id}: member without verification details` };

    const base: RegistrationBase = {
        id: row.id,
        publicRef: row.public_ref,
        ticketOption: row.ticket_option,
        tier: row.tier,
        price: toCents(row.price_cents),
        membership,
        attendee: {
            fullName: row.full_name,
            pronouns: row.pronouns,
            email: row.email,
            phone: row.phone,
            connectionToGestalt: row.connection_to_gestalt,
            heardAbout: row.heard_about,
        },
        policy: {
            version: row.policy_version,
            textSha256: row.policy_text_sha256,
            acceptedAt: new Date(row.policy_accepted_at),
        },
        checkoutSessionId: row.stripe_checkout_session_id,
        checkoutExpiresAt: new Date(row.checkout_expires_at),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };

    const { status } = row;
    if (isUnpaidStatus(status)) return { ok: true, registration: { ...base, status } };

    const payment = toPayment(row);
    if (!payment) return { ok: false, problem: `registration ${row.id}: ${status} without payment details` };

    const refund = toRefund(row);
    if (status === "refunded") {
        if (!refund) return { ok: false, problem: `registration ${row.id}: refunded without refund details` };
        return { ok: true, registration: { ...base, status, payment, refund } };
    }

    return { ok: true, registration: { ...base, status, payment, partialRefund: refund } };
}

/** The sensitive answers, readable by admins only. */
export interface PrivateDetails {
    dietary: DietaryRequirement[];
    dietaryDetails: string | null;
    accessRequirements: string | null;
}

/**
 * Converts a `registration_private_details` row.
 *
 * @returns `null` when there is no row, which after the conference means the details were purged
 * by the retention step.
 */
export function toPrivateDetails(row: PrivateDetailsRow | null): PrivateDetails | null {
    if (!row) return null;
    return {
        dietary: row.dietary,
        dietaryDetails: row.dietary_details,
        accessRequirements: row.access_requirements,
    };
}