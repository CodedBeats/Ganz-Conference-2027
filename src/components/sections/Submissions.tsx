import { Globe } from "lucide-react";
import type { CmsSection, CmsStatItem } from "@/types/content";
import { getFileUrl } from "@/lib/cms/files";
import { splitParagraphs } from "@/lib/content/text";
import { SectionTag } from "@/components/shared/SectionTag";
import { RichText } from "@/components/shared/RichText";
import { PlaceholderBox } from "@/components/shared/PlaceholderBox";
import { CmsBox } from "@/components/cms/CmsBox";
import { CmsImageSlot } from "@/components/cms/CmsImageSlot";
import { CmsText } from "@/components/cms/CmsText";

const FORMAT_NAME_CLASS = "text-xl leading-snug font-medium";
const FORMAT_NOTE_CLASS = "mt-2 text-base leading-relaxed text-teal-dark/70";
const DETAIL_VALUE_CLASS = "text-2xl leading-snug font-medium";
const EMAIL_CLASS = "text-lg break-all";
const VIRTUAL_NOTE_CLASS = "max-w-2xl text-base leading-relaxed text-teal-dark/70";
const GUIDELINES_CLASS = "mb-6 text-base leading-relaxed text-cream/80";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

// a format is a stat: label = format name, value = optional one-liner under it
const FormatCard = ({ format, index }: { format: CmsStatItem; index: number }) => (
    <CmsBox
        as="li"
        table="stat_items"
        rowId={format.id}
        label={`Submission format: ${format.label}`}
        values={{ label: format.label, value: format.value }}
        className="card hover-lift bg-white"
    >
        <span className="eyebrow mb-4 text-teal">{String(index + 1).padStart(2, "0")}</span>
        <CmsText field="label" label="Format" editClassName={FORMAT_NAME_CLASS}>
            <h3 className={FORMAT_NAME_CLASS}>{format.label}</h3>
        </CmsText>
        <CmsText field="value" label="Short description (optional)" multiline editClassName={FORMAT_NOTE_CLASS}>
            {format.value.trim() && <p className={FORMAT_NOTE_CLASS}>{format.value}</p>}
        </CmsText>
    </CmsBox>
);

// a detail is a stat: label = gold caption, value = the text. An email value renders as a mailto link.
const SubmissionDetail = ({ detail }: { detail: CmsStatItem }) => {
    const value = detail.value.trim();
    const isEmail = EMAIL_PATTERN.test(value);

    return (
        <CmsBox
            as="li"
            table="stat_items"
            rowId={detail.id}
            label={`Submission detail: ${detail.label}`}
            values={{ label: detail.label, value: detail.value }}
        >
            <CmsText field="label" label="Label" editClassName="eyebrow mb-2 text-gold">
                <span className="eyebrow mb-2 text-gold">{detail.label}</span>
            </CmsText>
            <CmsText field="value" label="Value" editClassName={isEmail ? EMAIL_CLASS : DETAIL_VALUE_CLASS}>
                {isEmail ? (
                    <a href={`mailto:${value}`} className={`${EMAIL_CLASS} underline-offset-4 transition-colors hover:text-gold hover:underline`}>
                        {value}
                    </a>
                ) : (
                    <p className={DETAIL_VALUE_CLASS}>{detail.value}</p>
                )}
            </CmsText>
        </CmsBox>
    );
};

/**
 * The call for submissions, driven by the `submissions` section. Linked from the hero
 * button and the footer, not the navbar.
 *
 * @remarks
 * Like the footer, the section's stat items are two unrendered group rows - "Formats"
 * and "Details" - whose children are the editable rows, so each list can grow without
 * the two getting mixed up.
 *
 * Field mapping: `heading` = heading, `body` = invitation paragraphs, `excerpt` = the
 * virtual/overseas note, `subheading` = the line above the guidelines button, `image` =
 * the guidelines PDF (the button is hidden until one is set).
 */
export const Submissions = ({ section }: { section?: CmsSection }) => {
    if (!section) return null;

    const formats = section.stats.find((stat) => stat.label === "Formats")?.children ?? [];
    const details = section.stats.find((stat) => stat.label === "Details")?.children ?? [];
    const paragraphs = splitParagraphs(section.body);

    return (
        <section id="submissions" className="section-block-b container-site scroll-mt-24">
            <div className="section-panel bg-teal-pale text-teal-dark">
                {/* faint rings off the top-right corner, echoing the hero */}
                <div className="ring-decor top-[-12rem] right-[-10rem] size-160 border-teal/20" />
                <div className="ring-decor top-[-20rem] right-[-18rem] size-240 border-teal/10" />

                <div className="relative grid gap-10 lg:grid-cols-[1fr_minmax(0,24rem)] lg:gap-16">
                    <div>
                        <CmsBox
                            className="mb-10 space-y-5"
                            table="sections"
                            rowId={section.id}
                            label="Submissions section"
                            values={{ heading: section.heading, body: section.body }}
                        >
                            <SectionTag className="bg-teal-dark text-cream">Submissions</SectionTag>

                            <CmsText field="heading" label="Heading" multiline hint="highlight" editClassName="section-heading">
                                <h2 className="section-heading">
                                    <RichText text={section.heading} accentClassName="text-teal" />
                                </h2>
                            </CmsText>

                            <CmsText field="body" label="Invitation" multiline hint="paragraphs" editClassName="body-copy">
                                {paragraphs.map((paragraph, index) => (
                                    <p key={index} className="body-copy">
                                        <RichText text={paragraph} accentClassName="font-medium text-teal" />
                                    </p>
                                ))}
                            </CmsText>
                        </CmsBox>

                        {formats.length > 0 && (
                            <>
                                <span className="eyebrow mb-4 text-teal-dark/60">We are seeking submissions for</span>
                                <ul className="mb-10 grid gap-4 sm:grid-cols-3">
                                    {formats.map((format, index) => (
                                        <FormatCard key={format.id} format={format} index={index} />
                                    ))}
                                </ul>
                            </>
                        )}

                        <div className="flex items-start gap-3">
                            <Globe className="mt-1 size-5 shrink-0 text-teal" aria-hidden="true" />
                            <CmsBox
                                className="flex-1"
                                table="sections"
                                rowId={section.id}
                                label="Virtual presenting note"
                                values={{ excerpt: section.excerpt }}
                            >
                                <CmsText field="excerpt" label="Virtual presenting note" multiline hint="highlight" editClassName={VIRTUAL_NOTE_CLASS}>
                                    <p className={VIRTUAL_NOTE_CLASS}>
                                        <RichText text={section.excerpt} accentClassName="font-medium text-teal" />
                                    </p>
                                </CmsText>
                            </CmsBox>
                        </div>
                    </div>

                    {/* key details: closing date, where to send, and the guidelines PDF */}
                    <div className="card flex flex-col bg-teal-dark text-cream lg:self-start">
                        <ul className="mb-8 space-y-7">
                            {details.map((detail) => (
                                <SubmissionDetail key={detail.id} detail={detail} />
                            ))}
                        </ul>

                        <div className="border-t border-cream/15 pt-7">
                            <CmsBox
                                table="sections"
                                rowId={section.id}
                                label="Submission guidelines"
                                values={{ subheading: section.subheading }}
                            >
                                <CmsText field="subheading" label="Guidelines blurb" multiline editClassName={GUIDELINES_CLASS}>
                                    {section.subheading && <p className={GUIDELINES_CLASS}>{section.subheading}</p>}
                                </CmsText>
                            </CmsBox>

                            <CmsImageSlot
                                table="sections"
                                rowId={section.id}
                                field="image_id"
                                fileId={section.image?.id ?? null}
                                folder="general"
                                accept="pdf"
                                label="Submission guidelines"
                                isHiddenWhenEmpty
                                placeholder={<PlaceholderBox label="Guidelines PDF" className="h-14 rounded-full text-sm" />}
                            >
                                {section.image && (
                                    <a
                                        href={getFileUrl(section.image.file_ref)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-pill btn-gold w-full py-4"
                                    >
                                        Submission guidelines (PDF) ↗
                                    </a>
                                )}
                            </CmsImageSlot>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};