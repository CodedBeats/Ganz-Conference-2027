"use client";
import dynamic from 'next/dynamic';
// components
import { SectionTag } from "@/components/shared/SectionTag";
// lib
import { EVENT } from "@/lib/content/site";

// don't render map component on server
const Map = dynamic(
    () => import("@/components/ui/Map"), 
    { ssr: false }
);

export const Location = () => {
    return (
        <section id="location" className="section-block container-site scroll-mt-24">
            <div className="section-header-row">
                <div>
                    <SectionTag>Location</SectionTag>
                    <h2 className="section-heading">Finding us on campus.</h2>
                </div>
                <p className="side-note max-w-sm">
                    Griffith University&apos;s Gold Coast campus at Southport - not the Nathan, Mt Gravatt or Logan
                    campuses.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="h-96 overflow-hidden rounded-3xl lg:h-144">
                    <Map lat={EVENT.addressCords[0]} lng={EVENT.addressCords[1]} zoom={14} venueName="GANZ Conference Venue" />
                </div>

                <div className="card flex flex-col bg-teal-dark text-cream">
                    <span className="eyebrow mb-3 text-gold">Venue</span>
                    <h3 className="mb-8 text-3xl leading-tight font-medium">{EVENT.venueName}</h3>

                    <span className="eyebrow mb-3 text-cream/60">Address</span>
                    <p className="mb-8 text-xl leading-relaxed">
                        {EVENT.addressLines.map((line) => (
                            <span key={line} className="block">
                                {line}
                            </span>
                        ))}
                    </p>

                    <span className="eyebrow mb-3 text-cream/60">Getting here</span>
                    <p className="mb-10 text-lg leading-relaxed text-cream/90">{EVENT.gettingHere}</p>

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