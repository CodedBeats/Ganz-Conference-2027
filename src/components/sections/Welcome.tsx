import type { CmsSection } from "@/types/content";
import { splitParagraphs } from "@/lib/content/text";
import { SectionTag } from "@/components/shared/SectionTag";
import { RichText } from "@/components/shared/RichText";
import { ContentImage } from "@/components/shared/ContentImage";
import { CmsBox } from "@/components/cms/CmsBox";
import { CmsText } from "@/components/cms/CmsText";
import { CmsHideWhileEditing } from "@/components/cms/CmsHideWhileEditing";

const QUOTE_CLASS = "card bg-gold px-10 py-9 text-lg leading-relaxed font-medium text-teal-dark sm:text-xl";

const BodyParagraphs = ({ paragraphs }: { paragraphs: string[] }) =>
    paragraphs.map((paragraph, index) => (
        <p key={index} className="body-copy">
            <RichText text={paragraph} accentClassName="text-teal" />
        </p>
    ));

export const Welcome = ({ section }: { section?: CmsSection }) => {
    if (!section) return null;

    // the excerpt sits as a pull quote halfway through the letter, however long it gets
    const paragraphs = splitParagraphs(section.body);
    const quoteIndex = Math.floor(paragraphs.length / 2);

    return (
        <section id="welcome" className="section-block container-site scroll-mt-24">
            {/* items-start so the sticky image column has room to travel down the taller copy column */}
            <div className="grid items-start gap-12 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-20">
                <CmsBox
                    className="space-y-7"
                    table="sections"
                    rowId={section.id}
                    label="Welcome section"
                    values={{ heading: section.heading, body: section.body, excerpt: section.excerpt }}
                >
                    <SectionTag>Welcome</SectionTag>

                    <CmsText field="heading" label="Intro" multiline hint="highlight" editClassName="lead-copy">
                        <p className="lead-copy">
                            <RichText text={section.heading} accentClassName="text-teal" />
                        </p>
                    </CmsText>

                    {/* while editing, the whole letter is one textarea here and the second half below is hidden */}
                    <CmsText field="body" label="Letter" multiline hint="paragraphs" editClassName="body-copy">
                        <BodyParagraphs paragraphs={paragraphs.slice(0, quoteIndex)} />
                    </CmsText>

                    <CmsText field="excerpt" label="Pull quote" multiline hint="highlight" editClassName={QUOTE_CLASS}>
                        {section.excerpt && (
                            <blockquote className={QUOTE_CLASS}>
                                <RichText text={section.excerpt} />
                            </blockquote>
                        )}
                    </CmsText>

                    <CmsHideWhileEditing>
                        <BodyParagraphs paragraphs={paragraphs.slice(quoteIndex)} />
                    </CmsHideWhileEditing>
                </CmsBox>

                {/* stays pinned below the navbar while the welcome copy scrolls past */}
                {section.image && (
                    <div className="relative aspect-4/5 w-full lg:sticky lg:top-28">
                        <ContentImage
                            image={section.image}
                            alt=""
                            fill
                            className="rounded-3xl object-cover shadow-lg shadow-teal-dark/10"
                        />
                    </div>
                )}
            </div>
        </section>
    );
};