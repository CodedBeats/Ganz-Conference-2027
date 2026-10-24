import type { CmsSection, CmsStatItem } from "@/types/content";
import { splitParagraphs } from "@/lib/content/text";
import { SectionTag } from "@/components/shared/SectionTag";
import { RichText } from "@/components/shared/RichText";
import { CmsBox } from "@/components/cms/CmsBox";
import { CmsText } from "@/components/cms/CmsText";

const POLICY_TITLE_CLASS = "mb-5 text-2xl leading-tight font-heading sm:text-3xl";

// a policy is a stat: label = title, value = paragraphs
const PolicyItem = ({ policy }: { policy: CmsStatItem }) => (
    <CmsBox
        as="li"
        table="stat_items"
        rowId={policy.id}
        label={`Policy: ${policy.label}`}
        values={{ label: policy.label, value: policy.value }}
        className="card bg-white"
    >
        <CmsText field="label" label="Title" editClassName={POLICY_TITLE_CLASS}>
            <h2 className={POLICY_TITLE_CLASS}>{policy.label}</h2>
        </CmsText>
        <CmsText field="value" label="Policy" multiline hint="paragraphs" editClassName="body-copy">
            <div className="space-y-5">
                {splitParagraphs(policy.value).map((paragraph, index) => (
                    <p key={index} className="body-copy">
                        <RichText text={paragraph} accentClassName="font-medium text-teal" />
                    </p>
                ))}
            </div>
        </CmsText>
    </CmsBox>
);

/**
 * Terms and policies (refunds, cancellations, ...), driven by the `policies` section and
 * rendered on `/policies` rather than the home page.
 *
 * @remarks
 * Field mapping: `heading` = page heading, `body` = optional intro, each stat item = one
 * policy (label = title, value = paragraphs).
 */
export const Policies = ({ section }: { section?: CmsSection }) => {
    if (!section) return null;

    return (
        <section id="policies" className="section-block container-site">
            <div className="mx-auto max-w-3xl">
                <CmsBox
                    className="mb-12"
                    table="sections"
                    rowId={section.id}
                    label="Policies page"
                    values={{ heading: section.heading, body: section.body }}
                >
                    <SectionTag>Policies</SectionTag>
                    <CmsText field="heading" label="Heading" multiline hint="highlight" editClassName="section-heading mb-6">
                        <h1 className="section-heading mb-6">
                            <RichText text={section.heading} accentClassName="text-teal" />
                        </h1>
                    </CmsText>
                    <CmsText field="body" label="Intro (optional)" multiline hint="highlight" editClassName="body-copy">
                        {section.body && (
                            <p className="body-copy">
                                <RichText text={section.body} accentClassName="font-medium text-teal" />
                            </p>
                        )}
                    </CmsText>
                </CmsBox>

                <ul className="space-y-6">
                    {section.stats.map((policy) => (
                        <PolicyItem key={policy.id} policy={policy} />
                    ))}
                </ul>
            </div>
        </section>
    );
};