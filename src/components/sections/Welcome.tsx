import type { CmsSection } from "@/types/content";
import { splitParagraphs } from "@/lib/content/text";
import { SectionTag } from "@/components/shared/SectionTag";
import { RichText } from "@/components/shared/RichText";
import { ContentImage } from "@/components/shared/ContentImage";

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
                <div className="space-y-7">
                    <SectionTag>Welcome</SectionTag>

                    <p className="lead-copy">
                        <RichText text={section.heading} accentClassName="text-teal" />
                    </p>

                    <BodyParagraphs paragraphs={paragraphs.slice(0, quoteIndex)} />

                    {section.excerpt && (
                        <blockquote className="card bg-gold px-10 py-9 text-lg leading-relaxed font-medium text-teal-dark sm:text-xl">
                            <RichText text={section.excerpt} />
                        </blockquote>
                    )}

                    <BodyParagraphs paragraphs={paragraphs.slice(quoteIndex)} />
                </div>

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