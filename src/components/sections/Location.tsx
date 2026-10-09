"use client";
import { Fragment } from "react";
import dynamic from 'next/dynamic';
// components
import { SectionHeaderRow } from "@/components/shared/SectionHeaderRow";
import { RichText } from "@/components/shared/RichText";
// lib
import { EVENT } from "@/lib/content/site";
import type { CmsSection } from "@/types/content";

// don't render map component on server
const Map = dynamic(
    () => import("@/components/ui/Map"),
    { ssr: false }
);

export const Location = ({ section }: { section?: CmsSection }) => {
    if (!section) return null;

    // first stat is the venue headline, the rest (address, getting here, ...) are label/value blocks
    const [venue, ...details] = section.stats;

    return (
        <section id="location" className="section-block container-site scroll-mt-24">
            <SectionHeaderRow tag="Location" heading={section.heading} note={section.body} noteClassName="max-w-sm" />

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="h-72 overflow-hidden rounded-3xl md:h-96 lg:h-144">
                    <Map
                        lat={EVENT.addressCords[0]}
                        lng={EVENT.addressCords[1]}
                        zoom={14}
                        venueName={venue?.value ?? "Conference venue"}
                    />
                </div>

                <div className="card flex flex-col bg-teal-dark text-cream">
                    {venue && (
                        <>
                            <span className="eyebrow mb-3 text-gold">{venue.label}</span>
                            <h3 className="mb-8 text-3xl leading-tight font-medium">{venue.value}</h3>
                        </>
                    )}

                    {details.map((stat) => (
                        <Fragment key={stat.id}>
                            <span className="eyebrow mb-3 text-cream/60">{stat.label}</span>
                            <p className="mb-8 text-lg leading-relaxed text-cream/90">
                                <RichText text={stat.value} />
                            </p>
                        </Fragment>
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