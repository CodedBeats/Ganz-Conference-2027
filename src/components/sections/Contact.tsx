import type { CmsSection } from "@/types/content";
import { RichText } from "@/components/shared/RichText";
import { CmsBox } from "@/components/cms/CmsBox";
import { CmsText } from "@/components/cms/CmsText";

const HEADING_CLASS = "mb-10 text-4xl leading-tight font-heading sm:text-6xl md:text-7xl";

export const Contact = ({ section }: { section?: CmsSection }) => {
    if (!section) return null;

    // the section body holds the contact email
    const email = section.body?.trim();

    return (
        <section id="contact" className="section-block-b container-site scroll-mt-24">
            <div className="section-panel bg-teal-dark text-center text-cream">
                {/* faint teal rings echoing the hero */}
                <div className="ring-decor top-1/2 left-1/2 size-160 -translate-x-1/2 -translate-y-1/2 border-teal/25" />
                <div className="ring-decor top-1/2 left-1/2 size-240 -translate-x-1/2 -translate-y-1/2 border-teal/15" />

                <CmsBox
                    className="relative py-6 md:py-12"
                    table="sections"
                    rowId={section.id}
                    label="Contact section"
                    values={{ heading: section.heading, body: section.body }}
                >
                    <CmsText field="heading" label="Heading" multiline hint="highlight" editClassName={HEADING_CLASS}>
                        <h2 className={HEADING_CLASS}>
                            <RichText text={section.heading} />
                        </h2>
                    </CmsText>
                    <CmsText field="body" label="Contact email" placeholder="name@example.com" editClassName="mx-auto max-w-xl text-2xl sm:text-3xl">
                        {email && (
                            <a
                                href={`mailto:${email}`}
                                className="btn-pill btn-gold-to-cream px-5 sm:px-10 py-5 text-2xl font-normal tracking-normal normal-case sm:text-4xl md:px-14 md:py-6"
                            >
                                {email}
                            </a>
                        )}
                    </CmsText>
                </CmsBox>
            </div>
        </section>
    );
};