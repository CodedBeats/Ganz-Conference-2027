// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
    DEFAULT_POLICY_AGREEMENT,
    DEFAULT_PRIVACY_STATEMENT,
    getRegistrationPolicy,
    policyItemsFrom,
    policyText,
    privacyPolicyUrlFrom,
    type RegisterTermsSection,
} from "../src/lib/registration/policy";
import type { CmsStatItem } from "../src/types/content";

const item = (label: string, value: string): CmsStatItem => ({
    id: label,
    label,
    value,
    description: null,
    style: "primary",
    sort_order: 0,
    image: null,
    ticketOption: null,
    audience: null,
    children: [],
});

const CANCELLATION = item("Refund & Cancellation Policy", "All registrations are non-refundable.\n\nTransfers may be requested.");
const POLICIES = { stats: [CANCELLATION] };

const register = (overrides: Partial<RegisterTermsSection> = {}): RegisterTermsSection => ({
    heading: "Privacy",
    body: "We use your details to run the conference.\n\nOnly the organisers see them.",
    excerpt: "I agree to the terms above.",
    subheading: null,
    ...overrides,
});

describe("policyItemsFrom", () => {
    it("reads each policy's title and paragraphs", () => {
        expect(policyItemsFrom(POLICIES)).toEqual([
            { title: "Refund & Cancellation Policy", paragraphs: ["All registrations are non-refundable.", "Transfers may be requested."] },
        ]);
    });

    it("has no items when the policies section is unpublished", () => {
        expect(policyItemsFrom(undefined)).toEqual([]);
    });
});

describe("privacyPolicyUrlFrom", () => {
    it("keeps an https link, and adds https to a pasted www address", () => {
        expect(privacyPolicyUrlFrom(register({ subheading: " https://www.ganz.org.au/privacy " }))).toBe("https://www.ganz.org.au/privacy");
        expect(privacyPolicyUrlFrom(register({ subheading: "www.ganz.org.au/privacy" }))).toBe("https://www.ganz.org.au/privacy");
    });

    it("drops anything that isn't an https link", () => {
        for (const subheading of [null, "", "   ", "http://ganz.org.au/privacy", "javascript:alert(1)", "/policies", "privacy policy"]) {
            expect(privacyPolicyUrlFrom(register({ subheading }))).toBeNull();
        }
    });
});

describe("getRegistrationPolicy", () => {
    it("uses Michelle's wording while the register section is missing", async () => {
        const policy = await getRegistrationPolicy(POLICIES, undefined);
        expect(policy.privacy).toBe(DEFAULT_PRIVACY_STATEMENT);
        expect(policy.agreement).toBe(DEFAULT_POLICY_AGREEMENT);
        expect(policy.privacyPolicyUrl).toBeNull();
    });

    it("falls back per field when the register section has blanks", async () => {
        const policy = await getRegistrationPolicy(POLICIES, register({ heading: null, body: "  ", excerpt: "" }));
        expect(policy.privacy).toBe(DEFAULT_PRIVACY_STATEMENT);
        expect(policy.agreement).toBe(DEFAULT_POLICY_AGREEMENT);
    });

    it("reads the privacy statement, agreement and link from the register section", async () => {
        const policy = await getRegistrationPolicy(POLICIES, register({ subheading: "https://ganz.org.au/privacy" }));
        expect(policy.privacy).toEqual({
            title: "Privacy",
            paragraphs: ["We use your details to run the conference.", "Only the organisers see them."],
        });
        expect(policy.agreement).toBe("I agree to the terms above.");
        expect(policy.privacyPolicyUrl).toBe("https://ganz.org.au/privacy");
        expect(policy.items.map((entry) => entry.title)).toEqual(["Refund & Cancellation Policy"]);
    });

    it("gives a stable version for the same text", async () => {
        const first = await getRegistrationPolicy(POLICIES, register());
        const second = await getRegistrationPolicy(POLICIES, register());
        expect(first.sha256).toMatch(/^[0-9a-f]{64}$/);
        expect(first.version).toBe(first.sha256.slice(0, 12));
        expect(second.version).toBe(first.version);
    });

    it("changes the version when any of the shown text changes, even slightly", async () => {
        const original = (await getRegistrationPolicy(POLICIES, register())).version;
        const edits = [
            getRegistrationPolicy({ stats: [item(CANCELLATION.label, "All registrations are non-refundable.\n\nTransfers may be requested in writing.")] }, register()),
            getRegistrationPolicy({ stats: [item("Privacy statement", "We keep your details safe."), CANCELLATION] }, register()),
            getRegistrationPolicy(POLICIES, register({ body: "We use your details to run the conference." })),
            getRegistrationPolicy(POLICIES, register({ heading: "Your privacy" })),
            getRegistrationPolicy(POLICIES, register({ excerpt: "I agree to the terms above. Registrations are non-refundable." })),
            getRegistrationPolicy(POLICIES, register({ subheading: "https://ganz.org.au/privacy" })),
        ];

        for (const edited of await Promise.all(edits)) expect(edited.version).not.toBe(original);
    });

    it("hashes the privacy statement, agreement and link along with the terms", async () => {
        const policy = await getRegistrationPolicy(POLICIES, register());

        // a version over the CMS terms alone would differ from the real one
        const termsOnly = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(policyText(policy.items, "", null)));
        const termsOnlyHex = Array.from(new Uint8Array(termsOnly), (byte) => byte.toString(16).padStart(2, "0")).join("");
        expect(policy.sha256).not.toBe(termsOnlyHex);
    });
});