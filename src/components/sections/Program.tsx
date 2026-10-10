import { cn } from "@/lib/utils";
import type { CmsSection } from "@/types/content";
import { EVENT } from "@/lib/content/site";
import { SectionTag } from "@/components/shared/SectionTag";
import { RichText } from "@/components/shared/RichText";
import { CmsBox } from "@/components/cms/CmsBox";
import { CmsText } from "@/components/cms/CmsText";
import { CmsStyleField } from "@/components/cms/CmsStyleField";
import type { CmsStyleOption } from "@/components/cms/CmsStyleFieldClient";

const HEADING_CLASS = "mb-10 max-w-4xl text-2xl sm:text-3xl leading-[1.2] font-normal md:text-4xl";

const STAT_STYLES: CmsStyleOption[] = [
    { value: "primary", label: "Confirmed" },
    { value: "secondary", label: "Not confirmed yet (accent colour)" },
];

export const Program = ({ section }: { section?: CmsSection }) => {
    if (!section) return null;

    return (
        <section id="program" className="section-block-b container-site scroll-mt-24">
            <div className="section-panel bg-teal-dark text-cream">
                {/* teal blob peeking out of the bottom-left corner */}
                <div className="blob-decor bottom-[-25rem] left-[-8rem] size-160" />

                <div className="relative">
                    <CmsBox table="sections" rowId={section.id} label="Program section" values={{ heading: section.heading }}>
                        <SectionTag tone="gold">The Program</SectionTag>

                        <CmsText field="heading" label="Heading" multiline hint="highlight" editClassName={HEADING_CLASS}>
                            <h2 className={HEADING_CLASS}>
                                <RichText text={section.heading} accentClassName="text-gold" />
                            </h2>
                        </CmsText>
                    </CmsBox>

                    {/* TODO: point at the full program page once it exists */}
                    <a href={EVENT.programHref} className="btn-pill btn-gold mb-16">
                        View Full Program →
                    </a>

                    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {section.stats.map((stat) => (
                            <CmsBox
                                as="li"
                                key={stat.id}
                                table="stat_items"
                                rowId={stat.id}
                                label={`Program stat: ${stat.label}`}
                                values={{ value: stat.value, label: stat.label, style: stat.style }}
                                className="card hover-lift group bg-cream text-teal-dark hover:bg-gold"
                            >
                                <CmsStyleField options={STAT_STYLES} />

                                {/* secondary = not confirmed yet (e.g. "TBC"), shown in the accent colour */}
                                <CmsText field="value" label="Value" editClassName="mb-2 text-5xl font-bold">
                                    <span
                                        className={cn(
                                            "mb-2 block text-5xl font-bold transition-colors",
                                            stat.style === "secondary" && "text-teal group-hover:text-teal-dark",
                                        )}
                                    >
                                        {stat.value}
                                    </span>
                                </CmsText>
                                <CmsText field="label" label="Label" editClassName="eyebrow text-teal-dark/60">
                                    <span className="eyebrow text-teal-dark/60">{stat.label}</span>
                                </CmsText>
                            </CmsBox>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};