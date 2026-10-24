import type { CmsSection, CmsStatItem } from "@/types/content";
import { sectionHref } from "@/lib/content/site";
import { splitParagraphs } from "@/lib/content/text";
import { SectionTag } from "@/components/shared/SectionTag";
import { RichText } from "@/components/shared/RichText";
import { ContentImage } from "@/components/shared/ContentImage";
import { PlaceholderBox } from "@/components/shared/PlaceholderBox";
import { CmsBox } from "@/components/cms/CmsBox";
import { CmsImageSlot } from "@/components/cms/CmsImageSlot";
import { CmsText } from "@/components/cms/CmsText";

const DETAIL_VALUE_CLASS = "text-xl leading-snug font-medium";

// a detail is a stat: label = gold caption, value = the text
const WorkshopDetail = ({ detail }: { detail: CmsStatItem }) => (
    <CmsBox
        as="li"
        table="stat_items"
        rowId={detail.id}
        label={`Workshop detail: ${detail.label}`}
        values={{ label: detail.label, value: detail.value }}
    >
        <CmsText field="label" label="Label" editClassName="eyebrow mb-2 text-gold">
            <span className="eyebrow mb-2 text-gold">{detail.label}</span>
        </CmsText>
        <CmsText field="value" label="Value" multiline hint="highlight" editClassName={DETAIL_VALUE_CLASS}>
            <p className={DETAIL_VALUE_CLASS}>
                <RichText text={detail.value} accentClassName="text-gold" />
            </p>
        </CmsText>
    </CmsBox>
);

/**
 * The pre-conference workshop, driven by the `workshop` section. Linked from the
 * Conference + Workshop ticket notes and the footer, not the navbar.
 *
 * @remarks
 * Field mapping: `heading` = heading, `body` = description paragraphs, `image` = optional
 * photo above the details card. Each stat item is one row in the details card
 * (label = caption, value = text).
 */
export const Workshop = ({ section }: { section?: CmsSection }) => {
    if (!section) return null;

    const paragraphs = splitParagraphs(section.body);

    return (
        <section id="workshop" className="section-block-b container-site scroll-mt-24">
            {/* white, since the teal-light share band sits right above */}
            <div className="section-panel bg-white text-teal-dark">
                {/* faint ring off the bottom-left corner */}
                <div className="ring-decor bottom-[-14rem] left-[-12rem] size-160 border-teal/25" />

                <div className="relative grid gap-10 lg:grid-cols-[1fr_minmax(0,24rem)] lg:gap-16">
                    <CmsBox
                        className="space-y-5"
                        table="sections"
                        rowId={section.id}
                        label="Workshop section"
                        values={{ heading: section.heading, body: section.body }}
                    >
                        <SectionTag>Pre-Conference Workshop</SectionTag>

                        <CmsText field="heading" label="Heading" multiline hint="highlight" editClassName="section-heading">
                            <h2 className="section-heading">
                                <RichText text={section.heading} accentClassName="text-teal" />
                            </h2>
                        </CmsText>

                        <CmsText field="body" label="Description" multiline hint="paragraphs" editClassName="body-copy">
                            {paragraphs.map((paragraph, index) => (
                                <p key={index} className="body-copy">
                                    <RichText text={paragraph} accentClassName="font-medium text-teal" />
                                </p>
                            ))}
                        </CmsText>
                    </CmsBox>

                    <div className="flex flex-col gap-6 lg:self-start">
                        <CmsImageSlot
                            table="sections"
                            rowId={section.id}
                            field="image_id"
                            fileId={section.image?.id ?? null}
                            folder="general"
                            label="Workshop section"
                            className="relative aspect-4/3 w-full"
                            isHiddenWhenEmpty
                            placeholder={<PlaceholderBox label="Image" className="absolute inset-0 rounded-3xl" />}
                        >
                            <ContentImage image={section.image} alt="" fill className="rounded-3xl object-cover" />
                        </CmsImageSlot>

                        <div className="card bg-teal-dark text-cream">
                            <ul className="mb-8 space-y-7">
                                {section.stats.map((detail) => (
                                    <WorkshopDetail key={detail.id} detail={detail} />
                                ))}
                            </ul>

                            <a href={sectionHref("registrations")} className="btn-pill btn-gold w-full py-4">
                                See ticket prices →
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};