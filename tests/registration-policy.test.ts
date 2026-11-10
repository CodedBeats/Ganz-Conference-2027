// @vitest-environment node
import { describe, expect, it } from "vitest";
import { getRegistrationPolicy, policyItemsFrom, policyText, PRIVACY_STATEMENT } from "../src/lib/registration/policy";
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

describe("policyItemsFrom", () => {
    it("reads each policy's title and paragraphs", () => {
        expect(policyItemsFrom({ stats: [CANCELLATION] })).toEqual([
            { title: "Refund & Cancellation Policy", paragraphs: ["All registrations are non-refundable.", "Transfers may be requested."] },
        ]);
    });

    it("has no items when the policies section is unpublished", () => {
        expect(policyItemsFrom(undefined)).toEqual([]);
    });
});

describe("getRegistrationPolicy", () => {
    it("gives a stable version for the same text", async () => {
        const first = await getRegistrationPolicy({ stats: [CANCELLATION] });
        const second = await getRegistrationPolicy({ stats: [CANCELLATION] });
        expect(first.sha256).toMatch(/^[0-9a-f]{64}$/);
        expect(first.version).toBe(first.sha256.slice(0, 12));
        expect(second.version).toBe(first.version);
    });

    it("changes the version when the text changes, even slightly", async () => {
        const original = await getRegistrationPolicy({ stats: [CANCELLATION] });
        const edited = await getRegistrationPolicy({
            stats: [item(CANCELLATION.label, "All registrations are non-refundable.\n\nTransfers may be requested in writing.")],
        });
        expect(edited.version).not.toBe(original.version);
    });

    it("puts the privacy statement first and includes it in the version", async () => {
        const policy = await getRegistrationPolicy({ stats: [CANCELLATION] });
        expect(policy.privacy).toBe(PRIVACY_STATEMENT);
        expect(policy.items.map((item) => item.title)).toEqual(["Refund & Cancellation Policy"]);

        // a version over the CMS terms alone would differ from the real one
        const termsOnly = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(policyText(policy.items)));
        const termsOnlyHex = Array.from(new Uint8Array(termsOnly), (byte) => byte.toString(16).padStart(2, "0")).join("");
        expect(policy.sha256).not.toBe(termsOnlyHex);
    });

    it("changes the version when a policy is added", async () => {
        const original = await getRegistrationPolicy({ stats: [CANCELLATION] });
        const withPrivacy = await getRegistrationPolicy({ stats: [item("Privacy statement", "We keep your details safe."), CANCELLATION] });
        expect(withPrivacy.version).not.toBe(original.version);
    });
});
