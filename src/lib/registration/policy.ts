/**
 * The registration terms a person accepts, and which version of them they saw.
 *
 * @remarks
 * The terms are the CMS-editable items of the `policies` section (the same text as `/policies`), so
 * GANZ can change them without a developer. Each registration stores the version and a sha256 of the
 * exact text shown; if the text changes while someone is filling in the form, the server notices the
 * version no longer matches and asks them to accept again (`policy_changed`).
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

export interface RegistrationPolicy {
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

/** The terms shown on `/register`, with their version. */
export async function getRegistrationPolicy(section: Pick<CmsSection, "stats"> | undefined): Promise<RegistrationPolicy> {
    const items = policyItemsFrom(section);
    const sha256 = await sha256Hex(policyText(items));
    return { items, sha256, version: sha256.slice(0, 12) };
}
