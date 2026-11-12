/**
 * The registration terms a person accepts, and which version of them they saw.
 *
 * @remarks
 * Everything shown is CMS-editable, so GANZ can change the terms without a developer:
 * - the `register` section: the privacy statement (`heading` = title, `body` = paragraphs), the
 *   agreement checkbox sentence (`excerpt`) and the full privacy policy link (`subheading`);
 * - the items of the `policies` section (the same text as `/policies`), e.g. the refund and
 *   cancellation policy.
 *
 * While the `register` section is missing or unpublished, the wording from Michelle's form is used
 * instead ({@link DEFAULT_PRIVACY_STATEMENT}, {@link DEFAULT_POLICY_AGREEMENT}), so the form never
 * breaks. Each registration stores the version and a sha256 of everything shown, the agreement
 * sentence and the link included; if any of it changes while someone is filling in the form, the
 * server notices the version no longer matches and asks them to accept again (`policy_changed`).
 *
 * Client-safe: hashing uses Web Crypto, which exists in browsers and Node.
 *
 * @module
 */
import { resolveHref, splitParagraphs } from "@/lib/content/text";
import type { CmsSection } from "@/types/content";

export interface PolicyItem {
    title: string;
    paragraphs: string[];
}

/** The privacy statement from Michelle's form (Q12), used until the CMS `register` section has one. */
export const DEFAULT_PRIVACY_STATEMENT: PolicyItem = {
    title: "Privacy",
    paragraphs: [
        "The information you provide will be used to administer your conference registration, arrange catering and accessibility requirements, process payments and communicate important conference information. Access to personal information will be limited to those who need it for these purposes, in accordance with GANZ's applicable privacy obligations.",
    ],
};

/** The agreement checkbox sentence from Michelle's form (Q13), used until the CMS has one. */
export const DEFAULT_POLICY_AGREEMENT =
    "I have read and agree to the above privacy and registration and cancellation terms. I understand that conference registrations are non-refundable.";

export interface RegistrationPolicy {
    /** The privacy statement; shown first. */
    privacy: PolicyItem;
    /** The CMS policy items (e.g. the refund and cancellation policy); empty when unpublished. */
    items: PolicyItem[];
    /** The sentence next to the agreement checkbox. */
    agreement: string;
    /** The full privacy policy, or `null` while GANZ haven't given one (the link is then hidden). */
    privacyPolicyUrl: string | null;
    /** sha256 (hex) of everything above, stored as `policy_text_sha256`. */
    sha256: string;
    /** The first 12 hex characters of {@link sha256}: what the form sends back. */
    version: string;
}

/** Reads the policy items out of the `policies` section; none when it's unpublished. */
export function policyItemsFrom(section: Pick<CmsSection, "stats"> | undefined): PolicyItem[] {
    return (section?.stats ?? []).map((item) => ({ title: item.label, paragraphs: splitParagraphs(item.value) }));
}

/** The fields of the `register` section the terms are read from. */
export type RegisterTermsSection = Pick<CmsSection, "heading" | "body" | "excerpt" | "subheading">;

/** The privacy statement from the `register` section, or the default while it has none. */
export function privacyStatementFrom(section: RegisterTermsSection | undefined): PolicyItem {
    const paragraphs = splitParagraphs(section?.body ?? null);
    if (paragraphs.length === 0) return DEFAULT_PRIVACY_STATEMENT;
    return { title: section?.heading?.trim() || DEFAULT_PRIVACY_STATEMENT.title, paragraphs };
}

/** The agreement sentence from the `register` section, or the default while it has none. */
export function agreementFrom(section: RegisterTermsSection | undefined): string {
    return section?.excerpt?.trim() || DEFAULT_POLICY_AGREEMENT;
}

/**
 * The privacy policy link from the `register` section.
 *
 * @remarks
 * Goes through the same check as CMS links ({@link resolveHref}, so a pasted `www.` address works),
 * then only an `https://` address is kept: it's an outside page, and anything else is more likely a
 * typo than a real link.
 */
export function privacyPolicyUrlFrom(section: RegisterTermsSection | undefined): string | null {
    const url = section?.subheading?.trim();
    if (!url) return null;
    const href = resolveHref(url);
    return href && /^https:\/\//i.test(href) ? href : null;
}

/**
 * The text that is hashed: every title and paragraph in order, then the agreement sentence and the
 * link. JSON keeps the boundaries unambiguous, so moving a sentence between items changes the version too.
 */
export function policyText(items: readonly PolicyItem[], agreement: string, privacyPolicyUrl: string | null): string {
    return JSON.stringify({
        items: items.map((item) => [item.title, item.paragraphs]),
        agreement,
        privacyPolicyUrl,
    });
}

async function sha256Hex(text: string): Promise<string> {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * The privacy statement, terms, agreement sentence and link shown on `/register`, with their version.
 *
 * @param policiesSection - The CMS `policies` section (the terms).
 * @param registerSection - The CMS `register` section (privacy statement, agreement, link).
 */
export async function getRegistrationPolicy(
    policiesSection: Pick<CmsSection, "stats"> | undefined,
    registerSection: RegisterTermsSection | undefined,
): Promise<RegistrationPolicy> {
    const privacy = privacyStatementFrom(registerSection);
    const items = policyItemsFrom(policiesSection);
    const agreement = agreementFrom(registerSection);
    const privacyPolicyUrl = privacyPolicyUrlFrom(registerSection);

    // hashed in the order shown, so the version covers the privacy statement too
    const sha256 = await sha256Hex(policyText([privacy, ...items], agreement, privacyPolicyUrl));
    return { privacy, items, agreement, privacyPolicyUrl, sha256, version: sha256.slice(0, 12) };
}