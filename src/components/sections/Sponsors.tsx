import type { CmsSection, CmsStatItem } from "@/types/content";
import { SectionTag } from "@/components/shared/SectionTag";
import { RichText } from "@/components/shared/RichText";
import { ContentImage } from "@/components/shared/ContentImage";

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
        <li className="hover-lift flex aspect-2/1 items-center justify-center rounded-3xl bg-white/10 hover:bg-white/25">
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
        </li>
    );
};

export const Sponsors = ({ section }: { section?: CmsSection }) => {
    if (!section) return null;

    return (
        <section id="sponsors" className="section-block-b container-site scroll-mt-24">
            <div className="section-panel bg-teal text-center text-white">
                <SectionTag tone="white">Sponsors & Partners</SectionTag>

                <h2 className="mb-5 text-3xl leading-tight font-heading sm:text-4xl md:text-5xl">
                    <RichText text={section.heading} />
                </h2>
                <p className="mx-auto mb-12 max-w-xl text-lg leading-relaxed text-white/90">
                    <RichText text={section.body} />
                </p>

                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {section.stats.map((sponsor) => (
                        <SponsorSlot key={sponsor.id} sponsor={sponsor} />
                    ))}
                </ul>
            </div>
        </section>
    );
};