import Image from "next/image";
import type { Keynote } from "@/types/content";
import { KEYNOTES } from "@/lib/content/keynotes";
import { SectionTag } from "@/components/shared/SectionTag";
import { PlaceholderBox } from "@/components/shared/PlaceholderBox";

const KeynoteCard = ({ keynote }: { keynote: Keynote }) => {
    if (!keynote.isAnnounced) {
        return (
            <li className="card hover-shadow flex flex-col bg-teal-light text-teal-dark">
                <PlaceholderBox label="TBA" className="mb-8 aspect-5/6 bg-teal/15 text-teal" />
                <h3 className="mb-1 text-2xl font-normal text-teal-dark/60">{keynote.name}</h3>
                <span className="eyebrow mb-5 text-teal">{keynote.subtitle}</span>
                <p className="text-base leading-relaxed text-teal-dark/60">{keynote.bio}</p>
            </li>
        );
    }

    return (
        <li className="card hover-shadow flex flex-col bg-teal-dark p-4 text-cream md:p-4">
            {keynote.imageSrc && (
                <Image
                    src={keynote.imageSrc}
                    alt={keynote.name}
                    width={750}
                    height={500}
                    className="mb-8 aspect-5/6 w-full rounded-2xl object-cover object-top"
                />
            )}
            <div className="px-3 pb-3">
                <h3 className="mb-1 text-2xl font-medium">{keynote.name}</h3>
                <span className="eyebrow mb-5 text-gold">{keynote.subtitle}</span>
                <p className="mb-6 text-base leading-relaxed text-cream/85">{keynote.bio}</p>
                {keynote.website && (
                    <a
                        href={keynote.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-b border-gold pb-0.5 font-medium text-gold transition-colors hover:text-cream"
                    >
                        {keynote.website.replace(/^https?:\/\//, "")} →
                    </a>
                )}
            </div>
        </li>
    );
};

export const Keynotes = () => {
    return (
        <section id="keynotes" className="section-block container-site scroll-mt-24">
            <div className="section-header-row">
                <div>
                    <SectionTag>Speakers</SectionTag>
                    <h2 className="section-heading">Keynote Presenters</h2>
                </div>
                <p className="side-note">Further keynote presenters will be announced through 2026.</p>
            </div>

            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {KEYNOTES.map((keynote) => (
                    <KeynoteCard key={keynote.id} keynote={keynote} />
                ))}
            </ul>
        </section>
    );
};