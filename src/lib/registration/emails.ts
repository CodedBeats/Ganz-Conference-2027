/**
 * Which registration emails exist, who they go to, and how a send is made idempotent.
 *
 * @remarks
 * Every send (or attempt) is a row in `email_log`. Its unique `idempotency_key` is what stops a
 * replayed webhook from queueing the same automatic email twice, and the same key is passed to
 * Resend as its `Idempotency-Key`, so retrying after a timeout can't double-send either.
 * Sending itself goes through `src/lib/email.ts`.
 *
 * Client-safe.
 *
 * @module
 */

/** Matches the `email_template` enum. Template content is out of scope here. */
export const EMAIL_TEMPLATES = [
    "non_member_confirmation",
    "member_payment_received",
    "membership_approved",
    "membership_not_verified",
    "refund_processed",
    "admin_new_registration_alert",
] as const;
export type EmailTemplate = (typeof EMAIL_TEMPLATES)[number];

export const EMAIL_TEMPLATE_LABELS = {
    non_member_confirmation: "Registration confirmed",
    member_payment_received: "Payment received, membership being checked",
    membership_approved: "Membership approved",
    membership_not_verified: "Membership not verified",
    refund_processed: "Refund processed",
    admin_new_registration_alert: "New registration alert (GANZ)",
} as const satisfies Record<EmailTemplate, string>;

/**
 * Who each template goes to.
 *
 * @remarks
 * `admin` templates go to `ADMIN_ALERT_EMAIL` (see `getEmailConfig`); when that isn't set, the
 * email is skipped rather than logged.
 */
export const EMAIL_RECIPIENT = {
    non_member_confirmation: "attendee",
    member_payment_received: "attendee",
    membership_approved: "attendee",
    membership_not_verified: "attendee",
    refund_processed: "attendee",
    admin_new_registration_alert: "admin",
} as const satisfies Record<EmailTemplate, "attendee" | "admin">;

/** Matches the `email_status` enum. */
export const EMAIL_STATUSES = ["queued", "sent", "failed"] as const;
export type EmailStatus = (typeof EMAIL_STATUSES)[number];

/** Matches the `email_trigger` enum. */
export const EMAIL_TRIGGERS = ["automatic", "manual"] as const;
export type EmailTrigger = (typeof EMAIL_TRIGGERS)[number];

export type AutomaticEmailKey = `${EmailTemplate}:${string}`;
export type ManualEmailKey = `manual:${string}`;

/**
 * The key for an email sent automatically on a status change.
 *
 * @remarks
 * One per template per registration, so each automatic email goes out at most once, however many
 * times the webhook that triggered it is delivered.
 */
export function automaticEmailKey(template: EmailTemplate, registrationId: string): AutomaticEmailKey {
    return `${template}:${registrationId}`;
}

/** A fresh key for a deliberate resend from the admin dashboard (P2-24): every resend is a new send. */
export function manualEmailKey(): ManualEmailKey {
    return `manual:${crypto.randomUUID()}`;
}