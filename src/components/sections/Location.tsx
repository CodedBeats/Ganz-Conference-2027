import { SectionHeaderRow } from "@/components/shared/SectionHeaderRow";
import { RichText } from "@/components/shared/RichText";
import { LocationMap } from "@/components/sections/LocationMap";
import { CmsBox } from "@/components/cms/CmsBox";
import { CmsText } from "@/components/cms/CmsText";
import { EVENT } from "@/lib/content/site";
import type { CmsSection } from "@/types/content";

const VENUE_CLASS = "mb-8 text-3xl leading-tight font-medium";
const DETAIL_CLASS = "mb-8 text-lg leading-relaxed text-cream/90";

export const Location = ({ section }: { section?: CmsSection }) => {
    if (!section) return null;

    // first stat is the venue headline, the rest (address, getting here, ...) are label/value blocks
    const [venue, ...details] = section.stats;

    return (
        <section id="location" className="section-block container-site scroll-mt-24">
            <CmsBox table="sections" rowId={section.id} label="Location section" values={{ heading: section.heading, body: section.body }}>
                <SectionHeaderRow tag="Location" heading={section.heading} note={section.body} noteClassName="max-w-sm" />
            </CmsBox>

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="h-72 overflow-hidden rounded-3xl md:h-96 lg:h-144">
                    <LocationMap venueName={venue?.value || "Conference venue"} />
                </div>

                <div className="card flex flex-col bg-teal-dark text-cream">
                    {venue && (
                        <CmsBox
                            table="stat_items"
                            rowId={venue.id}
                            label={`Venue: ${venue.value}`}
                            values={{ label: venue.label, value: venue.value }}
                        >
                            <CmsText field="label" label="Label" editClassName="eyebrow mb-3 text-gold">
                                <span className="eyebrow mb-3 text-gold">{venue.label}</span>
                            </CmsText>
                            <CmsText field="value" label="Venue name" editClassName={VENUE_CLASS}>
                                <h3 className={VENUE_CLASS}>{venue.value}</h3>
                            </CmsText>
                        </CmsBox>
                    )}

                    {details.map((stat) => (
                        <CmsBox
                            key={stat.id}
                            table="stat_items"
                            rowId={stat.id}
                            label={`Location detail: ${stat.label}`}
                            values={{ label: stat.label, value: stat.value }}
                        >
                            <CmsText field="label" label="Label" editClassName="eyebrow mb-3 text-cream/60">
                                <span className="eyebrow mb-3 text-cream/60">{stat.label}</span>
                            </CmsText>
                            <CmsText field="value" label="Details" multiline hint="highlight" editClassName={DETAIL_CLASS}>
                                <p className={DETAIL_CLASS}>
                                    <RichText text={stat.value} />
                                </p>
                            </CmsText>
                        </CmsBox>
                    ))}

                    <a
                        href={EVENT.mapsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-pill btn-gold mt-auto self-start"
                    >
                        Open in Maps →
                    </a>
                </div>
            </div>
        </section>
    );
};