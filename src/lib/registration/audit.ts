/**
 * The registration audit log: who changed what, and the values before and after.
 *
 * @remarks
 * Snapshots only ever hold the allowlisted {@link AUDITABLE_FIELDS}. Private details (dietary and
 * access answers) are never copied into the log: a change to one is recorded with both values
 * replaced by {@link REDACTED}, so the log shows *that* it changed but not to what.
 *
 * Client-safe.
 *
 * @module
 */
import type { Json } from "@/types/database";
import type { PrivateDetailsRow, RegistrationRow } from "./model";

/** Who made a change. Matches the `audit_actor` enum. */
export const AUDIT_ACTORS = ["admin", "system", "stripe_webhook"] as const;
export type AuditActor = (typeof AUDIT_ACTORS)[number];

export const AUDIT_ACTOR_LABELS = {
    admin: "Admin",
    system: "System",
    stripe_webhook: "Stripe",
} as const satisfies Record<AuditActor, string>;

/** What happened. Matches the `audit_action` enum. */
export const AUDIT_ACTIONS = [
    "registration_created",
    "payment_received",
    "checkout_abandoned",
    "membership_approved",
    "membership_rejected",
    "refund_recorded",
    "partial_refund_recorded",
    "registration_cancelled",
    "attendee_details_corrected",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ACTION_LABELS = {
    registration_created: "Registration started",
    payment_received: "Payment received",
    checkout_abandoned: "Checkout abandoned",
    membership_approved: "Membership approved",
    membership_rejected: "Membership not verified",
    refund_recorded: "Refunded in full",
    partial_refund_recorded: "Partially refunded",
    registration_cancelled: "Registration cancelled",
    attendee_details_corrected: "Attendee details corrected",
} as const satisfies Record<AuditAction, string>;

/** The `registrations` columns whose values may be copied into an audit snapshot. */
export const AUDITABLE_FIELDS = [
    "status",
    "full_name",
    "pronouns",
    "email",
    "phone",
    "membership_name",
    "membership_email",
    "refunded_amount_cents",
] as const satisfies readonly (keyof RegistrationRow)[];
export type AuditableField = (typeof AUDITABLE_FIELDS)[number];

/** The private-detail columns. Their changes are logged, their values never are. */
export const REDACTED_FIELDS = [
    "dietary",
    "dietary_details",
    "access_requirements",
] as const satisfies readonly (keyof PrivateDetailsRow)[];
export type RedactedField = (typeof REDACTED_FIELDS)[number];

/** What a redacted value is replaced with. */
export const REDACTED = "[redacted]";

export type AuditableValues = Partial<Pick<RegistrationRow, AuditableField>>;

/** The `before` / `after` pair stored on an audit row. */
export interface AuditSnapshot {
    before: { [key: string]: Json };
    after: { [key: string]: Json };
}

/**
 * Builds the before/after snapshot for a change, keeping only the fields that changed.
 *
 * @param before - The auditable values before the change.
 * @param after - The auditable values after it. Only fields present here are compared.
 * @param changedPrivateFields - Private-detail fields that changed, logged as {@link REDACTED}.
 */
export function auditSnapshot(
    before: AuditableValues,
    after: AuditableValues,
    changedPrivateFields: readonly RedactedField[] = [],
): AuditSnapshot {
    const snapshot: AuditSnapshot = { before: {}, after: {} };

    for (const field of AUDITABLE_FIELDS) {
        if (!(field in after)) continue;
        const oldValue = before[field] ?? null;
        const newValue = after[field] ?? null;
        if (oldValue === newValue) continue;
        snapshot.before[field] = oldValue;
        snapshot.after[field] = newValue;
    }

    for (const field of changedPrivateFields) {
        snapshot.before[field] = REDACTED;
        snapshot.after[field] = REDACTED;
    }

    return snapshot;
}