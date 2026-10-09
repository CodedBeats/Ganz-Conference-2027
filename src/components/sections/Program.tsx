import { cn } from "@/lib/utils";
import type { CmsSection } from "@/types/content";
import { EVENT } from "@/lib/content/site";
import { SectionTag } from "@/components/shared/SectionTag";
import { RichText } from "@/components/shared/RichText";

export const Program = ({ section }: { section?: CmsSection }) => {
    if (!section) return null;

    return (
        <section id="program" className="section-block-b container-site scroll-mt-24">
            <div className="section-panel bg-teal-dark text-cream">
                {/* teal blob peeking out of the bottom-left corner */}
                <div className="blob-decor bottom-[-25rem] left-[-8rem] size-160" />

                <div className="relative">
                    <SectionTag tone="gold">The Program</SectionTag>

                    <h2 className="mb-10 max-w-4xl text-2xl sm:text-3xl leading-[1.2] font-normal md:text-4xl">
                        <RichText text={section.heading} accentClassName="text-gold" />
                    </h2>

                    {/* TODO: point at the full program page once it exists */}
                    <a href={EVENT.programHref} className="btn-pill btn-gold mb-16">
                        View Full Program →
                    </a>

                    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {section.stats.map((stat) => (
                            <li
                                key={stat.id}
                                className="card hover-lift group bg-cream text-teal-dark hover:bg-gold"
                            >
                                {/* secondary = not confirmed yet (e.g. "TBC"), shown in the accent colour */}
                                <span
                                    className={cn(
                                        "mb-2 block text-5xl font-bold transition-colors",
                                        stat.style === "secondary" && "text-teal group-hover:text-teal-dark",
                                    )}
                                >
                                    {stat.value}
                                </span>
                                <span className="eyebrow text-teal-dark/60">{stat.label}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};