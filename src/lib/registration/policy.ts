/**
 * The registration terms a person accepts, and which version of them they saw.
 *
 * @remarks
 * What's shown is the fixed {@link PRIVACY_STATEMENT} (Michelle's form, Q12) followed by the
 * CMS-editable items of the `policies` section (the same text as `/policies`), so GANZ can change the
 * terms without a developer. Each registration stores the version and a sha256 of the exact text
 * shown, privacy statement included; if any of it changes while someone is filling in the form, the
 * server notices the version no longer matches and asks them to accept again (`policy_changed`).
 *
 * Client-safe: hashing uses Web Crypto, which exists in browsers and Node.
 *
 * @module
 */
import { splitParagraphs } from "@/lib/content/text";
import type { CmsSection } from "@/types/content";

export interface PolicyItem {
    title: string;
    paragraphs: string[];
}

/** The privacy statement shown above the terms on `/register` (Michelle's form, Q12). */
export const PRIVACY_STATEMENT: PolicyItem = {
    title: "Privacy",
    paragraphs: [
        "The information you provide will be used to administer your conference registration, arrange catering and accessibility requirements, process payments and communicate important conference information. Access to personal information will be limited to those who need it for these purposes, in accordance with GANZ's applicable privacy obligations.",
    ],
};

export interface RegistrationPolicy {
    /** Always {@link PRIVACY_STATEMENT}; shown first. */
    privacy: PolicyItem;
    /** The CMS policy items (e.g. the refund and cancellation policy); empty when unpublished. */
    items: PolicyItem[];
    /** sha256 (hex) of the exact text, stored as `policy_text_sha256`. */
    sha256: string;
    /** The first 12 hex characters of {@link sha256}: what the form sends back. */
    version: string;
}

/** Reads the policy items out of the `policies` section; none when it's unpublished. */
export function policyItemsFrom(section: Pick<CmsSection, "stats"> | undefined): PolicyItem[] {
    return (section?.stats ?? []).map((item) => ({ title: item.label, paragraphs: splitParagraphs(item.value) }));
}

/**
 * The text that is hashed: every title and paragraph in order. JSON keeps item and paragraph
 * boundaries unambiguous, so moving a sentence between items changes the version too.
 */
export function policyText(items: readonly PolicyItem[]): string {
    return JSON.stringify(items.map((item) => [item.title, item.paragraphs]));
}

async function sha256Hex(text: string): Promise<string> {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** The privacy statement and terms shown on `/register`, with their version. */
export async function getRegistrationPolicy(section: Pick<CmsSection, "stats"> | undefined): Promise<RegistrationPolicy> {
    const items = policyItemsFrom(section);
    // hashed in the order shown, so the version covers the privacy statement too
    const sha256 = await sha256Hex(policyText([PRIVACY_STATEMENT, ...items]));
    return { privacy: PRIVACY_STATEMENT, items, sha256, version: sha256.slice(0, 12) };
}
