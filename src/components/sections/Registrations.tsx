import { cn } from "@/lib/utils";
import type { CmsSection, CmsStatItem } from "@/types/content";
import { SectionTag } from "@/components/shared/SectionTag";
import { RichText } from "@/components/shared/RichText";

// a tier is a top-level stat: label = title, value = subtitle, children = price rows, description = note
const TierCard = ({ tier }: { tier: CmsStatItem }) => {
    const isDark = tier.style === "secondary";

    return (
        <li className={cn("card hover-lift", isDark ? "bg-teal-dark text-cream" : "bg-cream text-teal-dark")}>
            <h3 className="mb-1 text-2xl font-medium">{tier.label}</h3>
            <span className={cn("eyebrow mb-6", isDark ? "text-cream/60" : "text-teal-dark/60")}>{tier.value}</span>

            <ul className="space-y-3">
                {tier.children.map((row) => (
                    <li key={row.id} className={cn("price-row", isDark && "bg-cream/10 text-cream")}>
                        <span className="text-base">{row.label}</span>
                        <span className={cn("text-lg font-bold", isDark ? "text-gold" : "text-teal")}>{row.value}</span>
                    </li>
                ))}
            </ul>

            {tier.description && (
                <p className={cn("mt-5 text-base leading-relaxed", isDark ? "text-cream/85" : "text-teal-dark/70")}>
                    {tier.description}
                </p>
            )}
        </li>
    );
};

export const Registrations = ({ section }: { section?: CmsSection }) => {
    if (!section) return null;

    return (
        <section id="registrations" className="section-block-b container-site scroll-mt-24">
            <div className="section-panel bg-gold text-teal-dark">
                <SectionTag>Registrations</SectionTag>

                <h2 className="section-heading mb-5">
                    <RichText text={section.heading} />
                </h2>
                <p className="mb-12 max-w-2xl text-lg leading-relaxed text-teal-dark/80">
                    <RichText text={section.body} />
                </p>

                <ul className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                    {section.stats.map((tier) => (
                        <TierCard key={tier.id} tier={tier} />
                    ))}
                </ul>
            </div>
        </section>
    );
};