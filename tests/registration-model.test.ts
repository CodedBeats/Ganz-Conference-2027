import { describe, expect, it } from "vitest";
import {
    toCreatePendingRegistrationArgs,
    toPendingRegistrationError,
    toPrivateDetails,
    toRegistration,
    type RegistrationRow,
} from "../src/lib/registration/model";
import { registrationInputSchema, type RegistrationInput } from "../src/lib/registration/schema";

const SHA = "a".repeat(64);

const input = (overrides: Partial<Record<keyof RegistrationInput, unknown>> = {}): RegistrationInput =>
    registrationInputSchema.parse({
        ticketOption: "conference_workshop",
        quotedTier: "full",
        fullName: "Sam Taylor",
        email: "sam@example.com",
        membership: { choice: "current_member", name: "Samantha Taylor", email: "sam.t@example.com" },
        dietary: ["vegan"],
        policyAccepted: true,
        policyVersion: "v1",
        ...overrides,
    });

describe("toCreatePendingRegistrationArgs", () => {
    it("maps a member submission, sending the verification details", () => {
        expect(toCreatePendingRegistrationArgs(input(), SHA)).toEqual({
            p_membership_choice: "current_member",
            p_ticket_option: "conference_workshop",
            p_quoted_tier: "full",
            p_full_name: "Sam Taylor",
            p_email: "sam@example.com",
            p_dietary: ["vegan"],
            p_policy_version: "v1",
            p_policy_text_sha256: SHA,
            p_pronouns: undefined,
            p_phone: undefined,
            p_connection_to_gestalt: undefined,
            p_heard_about: undefined,
            p_membership_name: "Samantha Taylor",
            p_membership_email: "sam.t@example.com",
            p_dietary_details: undefined,
            p_access_requirements: undefined,
        });
    });

    it("sends no verification details for a non-member", () => {
        const args = toCreatePendingRegistrationArgs(input({ membership: { choice: "non_member" } }), SHA);
        expect(args).toMatchObject({ p_membership_choice: "non_member", p_membership_name: undefined, p_membership_email: undefined });
    });

    it("never sends an amount or a tier other than the quoted one", () => {
        const args = toCreatePendingRegistrationArgs(input(), SHA);
        expect(Object.keys(args).some((key) => /amount|price|cents/.test(key))).toBe(false);
    });
});

describe("toPendingRegistrationError", () => {
    it.each(["sold_out", "tier_changed", "price_unavailable"])("recognises %s", (message) => {
        expect(toPendingRegistrationError({ code: "P0001", message })).toBe(message);
    });

    it("treats anything else as unexpected", () => {
        expect(toPendingRegistrationError({ code: "P0001", message: "something else" })).toBeNull();
        expect(toPendingRegistrationError({ code: "23514", message: "sold_out" })).toBeNull();
    });
});

const baseRow: RegistrationRow = {
    id: "4f1c2f6e-6b39-4b8a-9d55-1b9c0a8c2e11",
    public_ref: "0123456789abcdef0123456789abcdef",
    status: "pending_payment",
    membership_choice: "non_member",
    audience: "non_member",
    ticket_option: "conference_only",
    tier: "early_bird",
    price_cents: 63500,
    currency: "AUD",
    full_name: "Sam Taylor",
    pronouns: "they/them",
    email: "sam@example.com",
    phone: null,
    connection_to_gestalt: "gestalt_student",
    heard_about: null,
    membership_name: null,
    membership_email: null,
    policy_version: "v1",
    policy_text_sha256: SHA,
    policy_accepted_at: "2027-01-10T09:00:00Z",
    stripe_checkout_session_id: "cs_test_1",
    checkout_expires_at: "2027-01-10T09:35:00Z",
    stripe_payment_intent_id: null,
    amount_paid_cents: null,
    paid_at: null,
    refunded_amount_cents: 0,
    refunded_at: null,
    membership_decided_at: null,
    membership_decided_by: null,
    cancelled_at: null,
    created_at: "2027-01-10T09:00:00Z",
    updated_at: "2027-01-10T09:00:00Z",
};

const paid = { stripe_payment_intent_id: "pi_1", amount_paid_cents: 63500, paid_at: "2027-01-10T09:10:00Z" };

describe("toRegistration", () => {
    it("reads a pending non-member registration", () => {
        const result = toRegistration(baseRow);
        expect(result.ok && result.registration).toMatchObject({
            status: "pending_payment",
            price: 63500,
            membership: { choice: "non_member", audience: "non_member" },
            attendee: { pronouns: "they/them", connectionToGestalt: "gestalt_student", heardAbout: null },
        });
    });

    it("guarantees payment details on a paid status", () => {
        const result = toRegistration({ ...baseRow, ...paid, status: "confirmed" });
        if (!result.ok || result.registration.status !== "confirmed") throw new Error("expected confirmed");
        expect(result.registration.payment).toEqual({ intentId: "pi_1", amount: 63500, paidAt: new Date(paid.paid_at) });
        expect(result.registration.partialRefund).toBeNull();
    });

    it("keeps a partial refund on a paid registration", () => {
        const result = toRegistration({
            ...baseRow,
            ...paid,
            status: "confirmed",
            refunded_amount_cents: 1000,
            refunded_at: "2027-01-11T00:00:00Z",
        });
        expect(result.ok && result.registration).toMatchObject({ partialRefund: { amount: 1000 } });
    });

    it("guarantees refund details on a refunded registration", () => {
        const result = toRegistration({
            ...baseRow,
            ...paid,
            status: "refunded",
            refunded_amount_cents: 63500,
            refunded_at: "2027-01-11T00:00:00Z",
        });
        expect(result.ok && result.registration).toMatchObject({ status: "refunded", refund: { amount: 63500 } });
    });

    it("reads the verification details of a member", () => {
        const result = toRegistration({
            ...baseRow,
            membership_choice: "joining_member",
            audience: "member",
            membership_name: "Samantha Taylor",
            membership_email: "sam.t@example.com",
        });
        expect(result.ok && result.registration.membership).toEqual({
            choice: "joining_member",
            audience: "member",
            verificationName: "Samantha Taylor",
            verificationEmail: "sam.t@example.com",
        });
    });

    it.each([
        ["a paid status without payment", { status: "confirmed" as const }],
        ["refunded without refund details", { ...paid, status: "refunded" as const }],
        ["a member without verification details", { membership_choice: "current_member" as const, audience: "member" as const }],
    ])("reports %s without leaking personal data", (_label, overrides) => {
        const result = toRegistration({ ...baseRow, ...overrides });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.problem).not.toContain(baseRow.email);
    });
});

describe("toPrivateDetails", () => {
    it("reads the sensitive answers", () => {
        const details = toPrivateDetails({
            registration_id: baseRow.id,
            dietary: ["vegan", "gluten_free"],
            dietary_details: null,
            access_requirements: "Step-free access",
            created_at: baseRow.created_at,
            updated_at: baseRow.updated_at,
        });
        expect(details).toEqual({ dietary: ["vegan", "gluten_free"], dietaryDetails: null, accessRequirements: "Step-free access" });
    });

    it("treats a missing row as purged", () => {
        expect(toPrivateDetails(null)).toBeNull();
    });
});