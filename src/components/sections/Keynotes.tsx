import { cn } from "@/lib/utils";
import type { CmsPerson, CmsSection } from "@/types/content";
import { SectionHeaderRow } from "@/components/shared/SectionHeaderRow";
import { PlaceholderBox } from "@/components/shared/PlaceholderBox";
import { ContentImage } from "@/components/shared/ContentImage";
import { CmsBox } from "@/components/cms/CmsBox";
import { CmsText } from "@/components/cms/CmsText";
import { CmsStyleField } from "@/components/cms/CmsStyleField";
import type { CmsStyleOption } from "@/components/cms/CmsStyleFieldClient";

const KEYNOTE_STYLES: CmsStyleOption[] = [
    { value: "primary", label: "Announced (photo card)" },
    { value: "secondary", label: "To be announced (placeholder card)" },
];

const KeynoteCard = ({ person }: { person: CmsPerson }) => {
    // secondary = a TBA slot: placeholder instead of a photo, pale card
    const isTba = person.style === "secondary";
    const accent = isTba ? "text-teal" : "text-gold";
    const nameClass = cn("mb-1 text-2xl", isTba ? "font-normal text-teal-dark/60" : "font-medium");
    // TBA cards end on the bio, so it only needs bottom spacing when something follows
    const descriptionClass = cn(
        "text-base leading-relaxed",
        isTba ? "text-teal-dark/60" : "text-cream/85",
        (!isTba || person.link) && "mb-6",
    );

    return (
        <CmsBox
            as="li"
            table="people"
            rowId={person.id}
            label={isTba ? (person.title ?? person.name) : `Keynote: ${person.name}`}
            values={{
                name: person.name,
                title: person.title,
                location: person.location,
                description: person.description,
                link: person.link,
                style: person.style,
            }}
            className={cn(
                "card hover-shadow flex flex-col",
                isTba ? "bg-teal-light text-teal-dark" : "bg-teal-dark p-4 text-cream md:p-4",
            )}
        >
            {isTba ? (
                <PlaceholderBox label="TBA" className="mb-8 aspect-5/6 bg-teal/15 text-teal" />
            ) : (
                <ContentImage
                    image={person.image}
                    alt={person.name}
                    width={750}
                    height={500}
                    className="mb-8 aspect-5/6 w-full rounded-2xl object-cover object-top"
                />
            )}

            <div className={cn(!isTba && "px-3 pb-3")}>
                <CmsStyleField options={KEYNOTE_STYLES} />

                <CmsText field="name" label="Name" editClassName={nameClass}>
                    <h3 className={nameClass}>{person.name}</h3>
                </CmsText>

                {/* title (e.g. "Keynote Two") and location each get their own line, hidden when empty */}
                <div className="mb-5 space-y-1">
                    <CmsText field="title" label="Title" editClassName={cn("eyebrow", accent)}>
                        {person.title && <span className={cn("eyebrow", accent)}>{person.title}</span>}
                    </CmsText>
                    <CmsText field="location" label="Location" editClassName={cn("eyebrow", accent)}>
                        {person.location && <span className={cn("eyebrow", accent)}>{person.location}</span>}
                    </CmsText>
                </div>

                <CmsText field="description" label="Bio" multiline editClassName={descriptionClass}>
                    {person.description && <p className={descriptionClass}>{person.description}</p>}
                </CmsText>

                {/* shown without the protocol, but edited as the full URL */}
                <CmsText field="link" label="Website" placeholder="https://…" editClassName="font-medium">
                    {person.link && (
                        <a
                            href={person.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                "border-b pb-0.5 font-medium transition-colors",
                                isTba ? "border-teal text-teal hover:text-teal-dark" : "border-gold text-gold hover:text-cream",
                            )}
                        >
                            {person.link.replace(/^https?:\/\//, "")} →
                        </a>
                    )}
                </CmsText>
            </div>
        </CmsBox>
    );
};

export const Keynotes = ({ section }: { section?: CmsSection }) => {
    if (!section) return null;

    return (
        <section id="keynotes" className="section-block container-site scroll-mt-24">
            <CmsBox table="sections" rowId={section.id} label="Keynotes section" values={{ heading: section.heading, body: section.body }}>
                <SectionHeaderRow tag="Speakers" heading={section.heading} note={section.body} />
            </CmsBox>

            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {section.people.map((person) => (
                    <KeynoteCard key={person.id} person={person} />
                ))}
            </ul>
        </section>
    );
};