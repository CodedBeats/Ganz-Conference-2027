import type { CmsSection } from "@/types/content";
import { SectionTag } from "@/components/shared/SectionTag";
import { RichText } from "@/components/shared/RichText";
import { FaqItem } from "@/components/sections/FaqItem";

export const Faq = ({ section }: { section?: CmsSection }) => {
    if (!section) return null;

    return (
        <section id="faqs" className="section-block-b container-site scroll-mt-24">
            <div className="section-panel bg-white">
                <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-20">
                    <div>
                        <SectionTag>FAQs</SectionTag>
                        <h2 className="section-heading mb-6">
                            <RichText text={section.heading} />
                        </h2>
                        {section.body && (
                            <p className="side-note">
                                <RichText text={section.body} />
                            </p>
                        )}
                    </div>

                    {/* each FAQ is a stat: label = question, value = answer */}
                    <ul className="space-y-4">
                        {section.stats.map((item, index) => (
                            <FaqItem
                                key={item.id}
                                id={item.id}
                                question={item.label}
                                answer={item.value}
                                defaultOpen={index === 0}
                            />
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};