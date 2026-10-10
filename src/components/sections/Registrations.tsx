import { cn } from "@/lib/utils";
import type { CmsSection, CmsStatItem } from "@/types/content";
import { SectionTag } from "@/components/shared/SectionTag";
import { RichText } from "@/components/shared/RichText";
import { CmsBox } from "@/components/cms/CmsBox";
import { CmsText } from "@/components/cms/CmsText";
import { CmsStyleField } from "@/components/cms/CmsStyleField";
import type { CmsStyleOption } from "@/components/cms/CmsStyleFieldClient";

const BODY_CLASS = "mb-12 max-w-2xl text-lg leading-relaxed text-teal-dark/80";

const TIER_STYLES: CmsStyleOption[] = [
    { value: "primary", label: "Light card" },
    { value: "secondary", label: "Dark card" },
];

const PriceRow = ({ tier, row, isDark }: { tier: CmsStatItem; row: CmsStatItem; isDark: boolean }) => {
    const priceClass = cn("text-lg font-bold", isDark ? "text-gold" : "text-teal");

    return (
        <CmsBox
            as="li"
            table="stat_items"
            rowId={row.id}
            label={`Price: ${tier.label} - ${row.label}`}
            values={{ label: row.label, value: row.value }}
            className={cn("price-row gap-4", isDark && "bg-cream/10 text-cream")}
        >
            <CmsText field="label" label="Price label" editClassName="min-w-0 flex-1 text-base">
                <span className="text-base">{row.label}</span>
            </CmsText>
            <CmsText field="value" label="Price" editClassName={cn("w-28 text-right", priceClass)}>
                <span className={priceClass}>{row.value}</span>
            </CmsText>
        </CmsBox>
    );
};

// a tier is a top-level stat: label = title, value = subtitle, children = price rows, description = note
const TierCard = ({ tier }: { tier: CmsStatItem }) => {
    const isDark = tier.style === "secondary";
    const subtitleClass = cn("eyebrow mb-6", isDark ? "text-cream/60" : "text-teal-dark/60");
    const noteClass = cn("mt-5 text-base leading-relaxed", isDark ? "text-cream/85" : "text-teal-dark/70");

    return (
        <CmsBox
            as="li"
            table="stat_items"
            rowId={tier.id}
            label={`Registration tier: ${tier.label}`}
            values={{ label: tier.label, value: tier.value, description: tier.description, style: tier.style }}
            className={cn("card hover-lift", isDark ? "bg-teal-dark text-cream" : "bg-cream text-teal-dark")}
        >
            <CmsStyleField options={TIER_STYLES} />

            <CmsText field="label" label="Tier name" editClassName="mb-1 text-2xl font-medium">
                <h3 className="mb-1 text-2xl font-medium">{tier.label}</h3>
            </CmsText>
            <CmsText field="value" label="Subtitle" editClassName={subtitleClass}>
                <span className={subtitleClass}>{tier.value}</span>
            </CmsText>

            {/* each price row is its own row in the DB, so it gets its own box inside the tier's */}
            <ul className="space-y-3">
                {tier.children.map((row) => (
                    <PriceRow key={row.id} tier={tier} row={row} isDark={isDark} />
                ))}
            </ul>

            <CmsText field="description" label="Note" multiline editClassName={noteClass}>
                {tier.description && <p className={noteClass}>{tier.description}</p>}
            </CmsText>
        </CmsBox>
    );
};

export const Registrations = ({ section }: { section?: CmsSection }) => {
    if (!section) return null;

    return (
        <section id="registrations" className="section-block-b container-site scroll-mt-24">
            <div className="section-panel bg-gold text-teal-dark">
                <CmsBox
                    table="sections"
                    rowId={section.id}
                    label="Registrations section"
                    values={{ heading: section.heading, body: section.body }}
                >
                    <SectionTag>Registrations</SectionTag>

                    <CmsText field="heading" label="Heading" multiline hint="highlight" editClassName="section-heading mb-5">
                        <h2 className="section-heading mb-5">
                            <RichText text={section.heading} />
                        </h2>
                    </CmsText>
                    <CmsText field="body" label="Intro" multiline hint="highlight" editClassName={BODY_CLASS}>
                        <p className={BODY_CLASS}>
                            <RichText text={section.body} />
                        </p>
                    </CmsText>
                </CmsBox>

                <ul className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                    {section.stats.map((tier) => (
                        <TierCard key={tier.id} tier={tier} />
                    ))}
                </ul>
            </div>
        </section>
    );
};