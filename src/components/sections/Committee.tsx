import { cn } from "@/lib/utils";
import type { CmsPerson, CmsSection } from "@/types/content";
import { SectionHeaderRow } from "@/components/shared/SectionHeaderRow";
import { PlaceholderBox } from "@/components/shared/PlaceholderBox";
import { ContentImage } from "@/components/shared/ContentImage";

const MemberCard = ({ member }: { member: CmsPerson }) => {
    // secondary = a "More to come" style slot rather than a real person
    const isPlaceholder = member.style === "secondary";

    return (
        <li className={cn("hover-shadow rounded-3xl p-4 pb-6", isPlaceholder ? "bg-teal-light" : "bg-white")}>
            <ContentImage
                image={member.image}
                alt={member.name}
                width={400}
                height={400}
                className="mb-5 aspect-square w-full rounded-2xl object-cover"
                fallback={
                    <PlaceholderBox
                        label={isPlaceholder ? "TBA" : "TBC"}
                        className={cn("mb-5 aspect-square", isPlaceholder && "bg-teal/15 text-teal")}
                    />
                }
            />

            <div className="px-1">
                <h3 className={cn("mb-1 text-xl font-medium", isPlaceholder ? "text-teal-dark/60" : "text-teal-dark")}>
                    {member.name}
                </h3>
                <span className="eyebrow mb-4 text-teal">{member.title}</span>
                <p className="text-sm leading-relaxed text-teal-dark/60">{member.description}</p>
            </div>
        </li>
    );
};

export const Committee = ({ section }: { section?: CmsSection }) => {
    if (!section) return null;

    return (
        <section id="committee" className="section-block-b container-site scroll-mt-24">
            <SectionHeaderRow tag="Conference Committee" heading={section.heading} note={section.body} />

            <ul className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                {section.people.map((member) => (
                    <MemberCard key={member.id} member={member} />
                ))}
            </ul>
        </section>
    );
};