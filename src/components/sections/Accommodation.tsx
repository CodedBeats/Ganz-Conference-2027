import type { CmsSection } from "@/types/content";
import { SectionTag } from "@/components/shared/SectionTag";
import { RichText } from "@/components/shared/RichText";
import { ContentImage } from "@/components/shared/ContentImage";
import { CmsBox } from "@/components/cms/CmsBox";
import { CmsText } from "@/components/cms/CmsText";

const STATUS_CLASS =
    "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-xs font-medium tracking-[0.15em] uppercase btn-muted";

export const Accommodation = ({ section }: { section?: CmsSection }) => {
    if (!section) return null;

    return (
        <section
            id="accommodation"
            className="section-block-b container-site scroll-mt-24"
        >
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,32rem)_1fr] lg:gap-20">
                <CmsBox
                    table="sections"
                    rowId={section.id}
                    label="Accommodation section"
                    values={{ heading: section.heading, body: section.body, excerpt: section.excerpt }}
                >
                    <SectionTag>Accommodation</SectionTag>
                    <CmsText field="heading" label="Heading" multiline hint="highlight" editClassName="section-heading mb-5">
                        <h2 className="section-heading mb-5">
                            <RichText text={section.heading} />
                        </h2>
                    </CmsText>
                    <CmsText field="body" label="Body" multiline hint="highlight" editClassName="body-copy mb-2 sm:mb-8">
                        <p className="body-copy mb-2 sm:mb-8">
                            <RichText text={section.body} />
                        </p>
                    </CmsText>
                    {/* status pill, e.g. "Details to be confirmed" */}
                    <CmsText field="excerpt" label="Status" editClassName="text-sm font-medium">
                        {section.excerpt && <span className={STATUS_CLASS}>{section.excerpt}</span>}
                    </CmsText>
                </CmsBox>

                {section.image && (
                    <div className="hover-grow relative aspect-5/4 w-full">
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