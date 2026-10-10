import type { CmsSection } from "@/types/content";
import { SectionTag } from "@/components/shared/SectionTag";
import { RichText } from "@/components/shared/RichText";
import { FaqItem } from "@/components/sections/FaqItem";
import { CmsBox } from "@/components/cms/CmsBox";
import { CmsText } from "@/components/cms/CmsText";

export const Faq = ({ section }: { section?: CmsSection }) => {
    if (!section) return null;

    return (
        <section id="faqs" className="section-block-b container-site scroll-mt-24">
            <div className="section-panel bg-white">
                <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-20">
                    <CmsBox table="sections" rowId={section.id} label="FAQs section" values={{ heading: section.heading, body: section.body }}>
                        <SectionTag>FAQs</SectionTag>
                        <CmsText field="heading" label="Heading" multiline hint="highlight" editClassName="section-heading mb-6">
                            <h2 className="section-heading mb-6">
                                <RichText text={section.heading} />
                            </h2>
                        </CmsText>
                        <CmsText field="body" label="Side note" multiline hint="highlight" editClassName="side-note">
                            {section.body && (
                                <p className="side-note">
                                    <RichText text={section.body} />
                                </p>
                            )}
                        </CmsText>
                    </CmsBox>

                    {/* each FAQ is a stat: label = question, value = answer */}
                    <ul className="space-y-4">
                        {section.stats.map((item, index) => (
                            <CmsBox
                                as="li"
                                key={item.id}
                                table="stat_items"
                                rowId={item.id}
                                label={`FAQ: ${item.label}`}
                                values={{ label: item.label, value: item.value }}
                                className="rounded-3xl bg-teal-pale text-teal-dark"
                            >
                                <FaqItem
                                    id={item.id}
                                    defaultOpen={index === 0}
                                    question={
                                        <CmsText field="label" label="Question" multiline>
                                            {item.label}
                                        </CmsText>
                                    }
                                    answer={
                                        <CmsText field="value" label="Answer" multiline placeholder="Leave blank to show “Answer coming soon.”">
                                            <p>{item.value.trim() || "Answer coming soon."}</p>
                                        </CmsText>
                                    }
                                />
                            </CmsBox>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};