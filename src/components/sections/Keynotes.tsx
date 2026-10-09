import type { CmsPerson, CmsSection } from "@/types/content";
import { SectionHeaderRow } from "@/components/shared/SectionHeaderRow";
import { PlaceholderBox } from "@/components/shared/PlaceholderBox";
import { ContentImage } from "@/components/shared/ContentImage";

const KeynoteCard = ({ person }: { person: CmsPerson }) => {
    // announced keynotes show where they're from, TBA slots show their ordinal ("Keynote Two")
    const subtitle = person.location ?? person.title;

    if (person.style === "secondary") {
        return (
            <li className="card hover-shadow flex flex-col bg-teal-light text-teal-dark">
                <PlaceholderBox label="TBA" className="mb-8 aspect-5/6 bg-teal/15 text-teal" />
                <h3 className="mb-1 text-2xl font-normal text-teal-dark/60">{person.name}</h3>
                <span className="eyebrow mb-5 text-teal">{subtitle}</span>
                <p className="text-base leading-relaxed text-teal-dark/60">{person.description}</p>
            </li>
        );
    }

    return (
        <li className="card hover-shadow flex flex-col bg-teal-dark p-4 text-cream md:p-4">
            <ContentImage
                image={person.image}
                alt={person.name}
                width={750}
                height={500}
                className="mb-8 aspect-5/6 w-full rounded-2xl object-cover object-top"
            />
            <div className="px-3 pb-3">
                <h3 className="mb-1 text-2xl font-medium">{person.name}</h3>
                <span className="eyebrow mb-5 text-gold">{subtitle}</span>
                <p className="mb-6 text-base leading-relaxed text-cream/85">{person.description}</p>
                {person.link && (
                    <a
                        href={person.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-b border-gold pb-0.5 font-medium text-gold transition-colors hover:text-cream"
                    >
                        {person.link.replace(/^https?:\/\//, "")} →
                    </a>
                )}
            </div>
        </li>
    );
};

export const Keynotes = ({ section }: { section?: CmsSection }) => {
    if (!section) return null;

    return (
        <section id="keynotes" className="section-block container-site scroll-mt-24">
            <SectionHeaderRow tag="Speakers" heading={section.heading} note={section.body} />

            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {section.people.map((person) => (
                    <KeynoteCard key={person.id} person={person} />
                ))}
            </ul>
        </section>
    );
};