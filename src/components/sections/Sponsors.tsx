import type { CmsSection, CmsStatItem } from "@/types/content";
import { SectionTag } from "@/components/shared/SectionTag";
import { RichText } from "@/components/shared/RichText";
import { ContentImage } from "@/components/shared/ContentImage";
import { CmsBox } from "@/components/cms/CmsBox";
import { CmsText } from "@/components/cms/CmsText";

const HEADING_CLASS = "mb-5 text-3xl leading-tight font-heading sm:text-4xl md:text-5xl";
const BODY_CLASS = "mx-auto mb-12 max-w-xl text-lg leading-relaxed text-white/90";

// a sponsor is a stat: label = name, value = website (empty until known), image = logo
const SponsorSlot = ({ sponsor }: { sponsor: CmsStatItem }) => {
    const logo = (
        <ContentImage
            image={sponsor.image}
            alt={sponsor.label}
            width={240}
            height={120}
            className="max-h-20 w-auto"
            fallback={
                <span className="font-mono text-sm tracking-[0.3em] text-white/70 uppercase select-none">Logo</span>
            }
        />
    );

    return (
        <CmsBox
            as="li"
            table="stat_items"
            rowId={sponsor.id}
            label={`Sponsor: ${sponsor.label}`}
            values={{ label: sponsor.label, value: sponsor.value }}
            className="hover-lift flex aspect-2/1 flex-col items-center justify-center gap-3 rounded-3xl bg-white/10 hover:bg-white/25"
        >
            {sponsor.value ? (
                <a
                    href={sponsor.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={sponsor.label}
                    className="flex size-full items-center justify-center"
                >
                    {logo}
                </a>
            ) : (
                logo
            )}

            {/* neither shows as text on the page - the name is the logo's alt text, the website is its link */}
            <CmsText field="label" label="Sponsor name" editClassName="w-full px-5 text-left text-sm" />
            <CmsText field="value" label="Website" placeholder="https://… (optional)" editClassName="w-full px-5 pb-4 text-left text-sm" />
        </CmsBox>
    );
};

export const Sponsors = ({ section }: { section?: CmsSection }) => {
    if (!section) return null;

    return (
        <section id="sponsors" className="section-block-b container-site scroll-mt-24">
            <div className="section-panel bg-teal text-center text-white">
                <CmsBox table="sections" rowId={section.id} label="Sponsors section" values={{ heading: section.heading, body: section.body }}>
                    <SectionTag tone="white">Sponsors & Partners</SectionTag>

                    <CmsText field="heading" label="Heading" multiline hint="highlight" editClassName={HEADING_CLASS}>
                        <h2 className={HEADING_CLASS}>
                            <RichText text={section.heading} />
                        </h2>
                    </CmsText>
                    <CmsText field="body" label="Intro" multiline hint="highlight" editClassName={BODY_CLASS}>
                        <p className={BODY_CLASS}>
                            <RichText text={section.body} />
                        </p>
                    </CmsText>
                </CmsBox>

                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {section.stats.map((sponsor) => (
                        <SponsorSlot key={sponsor.id} sponsor={sponsor} />
                    ))}
                </ul>
            </div>
        </section>
    );
};