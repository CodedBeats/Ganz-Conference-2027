import { cn } from "@/lib/utils";
import { EVENT, PROGRAM_STATS } from "@/lib/content/site";
import { SectionTag } from "@/components/shared/SectionTag";

export const Program = () => {
    return (
        <section id="program" className="container-site scroll-mt-24 pb-16 md:pb-24">
            <div className="section-panel bg-teal-dark text-cream">
                {/* teal blob peeking out of the bottom-left corner */}
                <div className="blob-decor bottom-[-25rem] left-[-8rem] size-160" />

                <div className="relative">
                    <SectionTag tone="gold">The Program</SectionTag>

                    <h2 className="mb-10 max-w-4xl text-3xl leading-[1.2] font-normal sm:text-3xl md:text-4xl">
                        Explore a dynamic three-day program featuring keynote presentations, clinical
                        conversations, research discussions, experiential workshops, and somatic offerings that
                        invite us to <span className="text-gold">move, rest, play</span> and reconnect with our
                        bodies.
                    </h2>

                    {/* TODO: point at the full program page once it exists */}
                    <a href={EVENT.programHref} className="btn-pill btn-gold mb-16">
                        View Full Program →
                    </a>

                    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {PROGRAM_STATS.map((stat) => (
                            <li
                                key={stat.label}
                                className="card hover-lift group bg-cream text-teal-dark hover:bg-gold"
                            >
                                <span
                                    className={cn(
                                        "mb-2 block text-5xl font-bold transition-colors",
                                        stat.isPending && "text-teal group-hover:text-teal-dark",
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
