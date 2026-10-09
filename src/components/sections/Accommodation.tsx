import type { CmsSection } from "@/types/content";
import { SectionTag } from "@/components/shared/SectionTag";
import { RichText } from "@/components/shared/RichText";
import { ContentImage } from "@/components/shared/ContentImage";

export const Accommodation = ({ section }: { section?: CmsSection }) => {
    if (!section) return null;

    return (
        <section
            id="accommodation"
            className="section-block-b container-site scroll-mt-24"
        >
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,32rem)_1fr] lg:gap-20">
                <div>
                    <SectionTag>Accommodation</SectionTag>
                    <h2 className="section-heading mb-5">
                        <RichText text={section.heading} />
                    </h2>
                    <p className="body-copy mb-2 sm:mb-8">
                        <RichText text={section.body} />
                    </p>
                    {/* status pill, e.g. "Details to be confirmed" */}
                    {section.excerpt && (
                        <span className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-xs font-medium tracking-[0.15em] uppercase btn-muted">
                            {section.excerpt}
                        </span>
                    )}
                </div>

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