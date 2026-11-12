import type { CmsSection } from "@/types/content";
import { EVENT } from "@/lib/content/site";
import { splitParagraphs } from "@/lib/content/text";
import type { PolicyItem, RegistrationPolicy } from "@/lib/registration/policy";
import { RichText } from "@/components/shared/RichText";
import { CmsBox } from "@/components/cms/CmsBox";
import { CmsText } from "@/components/cms/CmsText";

const TITLE_CLASS = "mb-2 text-lg font-medium";
const PARAGRAPH_CLASS = "text-base leading-relaxed text-teal-dark/80";
const LINK_CLASS = "inline-block text-teal underline underline-offset-4";

const Paragraphs = ({ paragraphs }: { paragraphs: string[] }) => (
    <div className="space-y-3">
        {paragraphs.map((paragraph, index) => (
            <p key={index} className={PARAGRAPH_CLASS}>
                <RichText text={paragraph} accentClassName="font-medium text-teal" />
            </p>
        ))}
    </div>
);

const PolicyBlock = ({ item }: { item: PolicyItem }) => (
    <div>
        <h3 className={TITLE_CLASS}>{item.title}</h3>
        <Paragraphs paragraphs={item.paragraphs} />
    </div>
);

const PrivacyPolicyLink = ({ href }: { href: string | null }) => {
    if (!href) return null;

    return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
            Read the full privacy policy (opens in a new tab)
        </a>
    );
};

interface PrivacyProps {
    section: CmsSection | undefined;
    policy: RegistrationPolicy;
}

/**
 * The privacy statement, with the agreement sentence and the privacy policy link edited alongside it.
 *
 * @remarks
 * Without a `register` section there's no row to edit, so the defaults are shown as plain text.
 * The agreement sentence's view is the checkbox label in the form, so here it's only an edit field.
 */
const Privacy = ({ section, policy }: PrivacyProps) => {
    if (!section) {
        return (
            <div className="space-y-3">
                <PolicyBlock item={policy.privacy} />
                <PrivacyPolicyLink href={policy.privacyPolicyUrl} />
            </div>
        );
    }

    return (
        <CmsBox
            className="space-y-3"
            table="sections"
            rowId={section.id}
            label="Registration privacy and agreement"
            values={{ heading: section.heading, body: section.body, excerpt: section.excerpt, subheading: section.subheading }}
        >
            <CmsText field="heading" label="Privacy title" editClassName={TITLE_CLASS}>
                <h3 className={TITLE_CLASS}>{policy.privacy.title}</h3>
            </CmsText>
            <CmsText field="body" label="Privacy statement" multiline hint="paragraphs" editClassName={PARAGRAPH_CLASS}>
                <Paragraphs paragraphs={policy.privacy.paragraphs} />
            </CmsText>
            <CmsText field="excerpt" label="Checkbox sentence (shown next to the agreement checkbox)" multiline editClassName={PARAGRAPH_CLASS} />
            <CmsText field="subheading" label="Full privacy policy link" placeholder="https://…" editClassName={PARAGRAPH_CLASS}>
                <PrivacyPolicyLink href={policy.privacyPolicyUrl} />
            </CmsText>
        </CmsBox>
    );
};

// a policy is a stat: label = title, value = paragraphs (the same rows as on /policies)
const PolicyItemBox = ({ item }: { item: CmsSection["stats"][number] }) => (
    <CmsBox table="stat_items" rowId={item.id} label={`Policy: ${item.label}`} values={{ label: item.label, value: item.value }}>
        <CmsText field="label" label="Title" editClassName={TITLE_CLASS}>
            <h3 className={TITLE_CLASS}>{item.label}</h3>
        </CmsText>
        <CmsText field="value" label="Policy" multiline hint="paragraphs" editClassName={PARAGRAPH_CLASS}>
            <Paragraphs paragraphs={splitParagraphs(item.value)} />
        </CmsText>
    </CmsBox>
);

export interface RegisterTermsProps {
    /** The CMS `register` section (privacy statement, agreement sentence, link); absent when unpublished. */
    registerSection: CmsSection | undefined;
    /** The CMS `policies` section (the terms); absent when unpublished. */
    policiesSection: CmsSection | undefined;
    /** Built from the same two sections by `getRegistrationPolicy`, so what's shown is what's hashed. */
    policy: RegistrationPolicy;
}

/**
 * The text of the form's last section: the privacy statement, then the terms. Server-rendered so
 * admins can edit it in place on `/register`; the form slots it in above the agreement checkbox.
 */
export const RegisterTerms = ({ registerSection, policiesSection, policy }: RegisterTermsProps) => {
    const items = policiesSection?.stats ?? [];

    return (
        <div className="space-y-6">
            <Privacy section={registerSection} policy={policy} />
            {items.length === 0 && (
                <p className={PARAGRAPH_CLASS}>
                    Please read our{" "}
                    <a href={EVENT.policiesHref} target="_blank" rel="noopener noreferrer" className="text-teal underline underline-offset-4">
                        terms and policies
                    </a>{" "}
                    before registering.
                </p>
            )}
            {items.map((item) => (
                <PolicyItemBox key={item.id} item={item} />
            ))}
        </div>
    );
};