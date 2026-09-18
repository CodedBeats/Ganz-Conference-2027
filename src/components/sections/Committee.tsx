import Image from "next/image";
import { cn } from "@/lib/utils";
import { COMMITTEE } from "@/lib/content/committee";
import { SectionTag } from "@/components/shared/SectionTag";
import { PlaceholderBox } from "@/components/shared/PlaceholderBox";

export const Committee = () => {
    return (
        <section id="committee" className="container-site scroll-mt-24 pb-16 md:pb-24">
            <div className="section-header-row">
                <div>
                    <SectionTag>Conference Committee</SectionTag>
                    <h2 className="section-heading">Held by many hands.</h2>
                </div>
                <p className="side-note">The committee continues to grow. Bios and photographs to follow.</p>
            </div>

            <ul className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                {COMMITTEE.map((member) => (
                    <li
                        key={member.id}
                        className={cn(
                            "hover-shadow rounded-3xl p-4 pb-6",
                            member.isPlaceholder ? "bg-teal-light" : "bg-white",
                        )}
                    >
                        {member.imageSrc ? (
                            <Image
                                src={member.imageSrc}
                                alt={member.name}
                                width={400}
                                height={400}
                                className="mb-5 aspect-square w-full rounded-2xl object-cover"
                            />
                        ) : (
                            <PlaceholderBox
                                label={member.isPlaceholder ? "TBA" : "TBC"}
                                className={cn("mb-5 aspect-square", member.isPlaceholder && "bg-teal/15 text-teal")}
                            />
                        )}

                        <div className="px-1">
                            <h3
                                className={cn(
                                    "mb-1 text-xl font-medium",
                                    member.isPlaceholder ? "text-teal-dark/60" : "text-teal-dark",
                                )}
                            >
                                {member.name}
                            </h3>
                            <span className="eyebrow mb-4 text-teal">{member.role}</span>
                            <p className="text-sm leading-relaxed text-teal-dark/60">{member.bio}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
};