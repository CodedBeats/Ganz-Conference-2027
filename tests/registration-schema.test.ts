import { describe, expect, it } from "vitest";
import type { MembershipChoice } from "../src/lib/registration/options";
import { registrationInputSchema, type MembershipInput } from "../src/lib/registration/schema";

/** `true` only when `A` and `B` are the same type. */
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

// Adding a membership choice without a branch in the schema's union fails to compile.
const membershipCovered: Equal<MembershipInput["choice"], MembershipChoice> = true;

/** A complete, valid non-member submission as the form would send it. */
const valid = {
    ticketOption: "conference_only",
    quotedTier: "early_bird",
    fullName: "Sam Taylor",
    pronouns: "",
    email: "Sam@Example.com ",
    phone: "",
    membership: { choice: "non_member" },
    dietary: ["vegetarian"],
    dietaryDetails: "",
    accessRequirements: "",
    connectionToGestalt: "",
    heardAbout: "",
    policyAccepted: true,
    policyVersion: "2026-11-v1",
};

const parse = (overrides: Record<string, unknown>) => registrationInputSchema.safeParse({ ...valid, ...overrides });

describe("registrationInputSchema", () => {
    it("accepts a valid submission, normalising blanks to null and the email to lower case", () => {
        expect(membershipCovered).toBe(true);

        const result = parse({});
        expect(result.success).toBe(true);
        expect(result.data).toMatchObject({
            email: "sam@example.com",
            pronouns: null,
            phone: null,
            dietaryDetails: null,
            accessRequirements: null,
            connectionToGestalt: null,
            heardAbout: null,
        });
    });

    it("accepts optional selects with a value, and missing ones as null", () => {
        const result = parse({ connectionToGestalt: undefined, heardAbout: "social_media" });
        expect(result.data).toMatchObject({ connectionToGestalt: null, heardAbout: "social_media" });
    });

    it("rejects an option that doesn't exist", () => {
        expect(parse({ heardAbout: "radio" }).success).toBe(false);
        expect(parse({ ticketOption: "workshop_only" }).success).toBe(false);
    });

    describe("membership", () => {
        it.each(["current_member", "joining_member"])("requires the verification name and email for %s", (choice) => {
            expect(parse({ membership: { choice } }).success).toBe(false);
            expect(parse({ membership: { choice, name: "Sam Taylor", email: "sam@example.com" } }).success).toBe(true);
        });

        it("rejects verification details on a non-member", () => {
            const result = parse({ membership: { choice: "non_member", name: "Sam Taylor", email: "sam@example.com" } });
            expect(result.success).toBe(false);
        });

        it("rejects an invalid verification email", () => {
            const result = parse({ membership: { choice: "current_member", name: "Sam", email: "not-an-email" } });
            expect(result.success).toBe(false);
        });
    });

    describe("dietary", () => {
        it("requires at least one choice", () => {
            expect(parse({ dietary: [] }).success).toBe(false);
        });

        it("accepts several choices", () => {
            expect(parse({ dietary: ["vegan", "gluten_free", "other"] }).success).toBe(true);
        });

        it("doesn't allow 'none' with anything else", () => {
            expect(parse({ dietary: ["none"] }).success).toBe(true);
            expect(parse({ dietary: ["none", "vegan"] }).success).toBe(false);
        });

        it("rejects duplicates", () => {
            expect(parse({ dietary: ["vegan", "vegan"] }).success).toBe(false);
        });

        it("doesn't require details when 'other' is chosen", () => {
            expect(parse({ dietary: ["other"], dietaryDetails: "" }).success).toBe(true);
        });
    });

    describe("policy", () => {
        it.each([false, "true", undefined])("rejects acceptance of %s", (policyAccepted) => {
            expect(parse({ policyAccepted }).success).toBe(false);
        });

        it("requires the policy version", () => {
            expect(parse({ policyVersion: " " }).success).toBe(false);
        });
    });

    describe("what the client can't send", () => {
        it("rejects an amount", () => {
            expect(parse({ amount: 100 }).success).toBe(false);
            expect(parse({ amountCents: 100 }).success).toBe(false);
        });

        it("rejects an audience (it is derived from the membership choice)", () => {
            expect(parse({ audience: "member" }).success).toBe(false);
        });
    });

    describe("attendee details", () => {
        it("requires a full name", () => {
            expect(parse({ fullName: "   " }).success).toBe(false);
        });

        it("rejects an overlong name", () => {
            expect(parse({ fullName: "a".repeat(201) }).success).toBe(false);
        });

        it("checks the phone number only when one is given", () => {
            expect(parse({ phone: "+61 400 123 456" }).success).toBe(true);
            expect(parse({ phone: "call me" }).success).toBe(false);
        });
    });
});