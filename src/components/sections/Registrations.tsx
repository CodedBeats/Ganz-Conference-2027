import { cn } from "@/lib/utils";
import type { CmsSection, CmsStatItem } from "@/types/content";
import { EVENT, REGISTER_CTA_DEFAULTS, type RegisterCta } from "@/lib/content/site";
import { splitParagraphs } from "@/lib/content/text";
import { SectionTag } from "@/components/shared/SectionTag";
import { RichText } from "@/components/shared/RichText";
import { CmsBox } from "@/components/cms/CmsBox";
import { CmsText } from "@/components/cms/CmsText";
import { CmsStyleField } from "@/components/cms/CmsStyleField";
import type { CmsStyleOption } from "@/components/cms/CmsStyleFieldClient";

const BODY_CLASS = "mb-8 max-w-2xl text-lg leading-relaxed text-teal-dark/80";
const CRITERIA_CLASS = "text-base leading-relaxed text-teal-dark/80";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

// tertiary is deliberately left out - it marks the info card, see Registrations below
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

            <CmsText field="description" label="Note" multiline hint="highlight" editClassName={noteClass}>
                {tier.description && (
                    <p className={noteClass}>
                        <RichText text={tier.description} accentClassName="font-medium" />
                    </p>
                )}
            </CmsText>
        </CmsBox>
    );
};

// the info card's contact row: label = what it is (editor only), value = the email address
const InfoCardEmail = ({ card, row }: { card: CmsStatItem; row: CmsStatItem }) => {
    const email = row.value.trim();

    return (
        <CmsBox
            table="stat_items"
            rowId={row.id}
            label={`${card.label}: ${row.label}`}
            values={{ value: row.value }}
            className="mt-auto pt-6"
        >
            <CmsText field="value" label="Contact email" placeholder="e.g. contact@ganz.org.au" editClassName="text-base">
                {EMAIL_PATTERN.test(email) && (
                    <a href={`mailto:${email}`} className="btn-pill btn-dark w-full hover:bg-teal hover:text-cream">
                        Apply by email
                    </a>
                )}
            </CmsText>
        </CmsBox>
    );
};

// an info card (e.g. Scholarships) is a tertiary stat: label = title, value = availability line,
// description = criteria paragraphs, first child = contact email. A soft cream tint over the gold
// panel keeps it with the tier cards without reading as another ticket.
const InfoCard = ({ card }: { card: CmsStatItem }) => {
    const [emailRow] = card.children;

    return (
        <CmsBox
            table="stat_items"
            rowId={card.id}
            label={`Info card: ${card.label}`}
            values={{ label: card.label, value: card.value, description: card.description }}
            className="card flex flex-1 flex-col bg-cream/45 text-teal-dark"
        >
            <CmsText field="label" label="Title" editClassName="mb-1 text-2xl font-medium">
                <h3 className="mb-1 text-2xl font-medium">{card.label}</h3>
            </CmsText>
            <CmsText field="value" label="Availability" placeholder="e.g. 5 scholarships available" editClassName="eyebrow mb-6 text-teal-dark/60">
                {card.value.trim() && <span className="eyebrow mb-6 text-teal-dark/60">{card.value}</span>}
            </CmsText>
            <CmsText field="description" label="Criteria" multiline hint="paragraphs" editClassName={CRITERIA_CLASS}>
                <div className="space-y-4">
                    {splitParagraphs(card.description).map((paragraph, index) => (
                        <p key={index} className={CRITERIA_CLASS}>
                            <RichText text={paragraph} accentClassName="font-medium" />
                        </p>
                    ))}
                </div>
            </CmsText>

            {emailRow && <InfoCardEmail card={card} row={emailRow} />}
        </CmsBox>
    );
};

// closed = registration isn't open yet, so it's a status label rather than something to click
const RegisterStatus = ({ cta }: { cta: RegisterCta }) => {
    if (cta.isOpen) {
        return (
            <a href={cta.href} className="btn-pill btn-dark mb-12 hover:bg-teal hover:text-cream">
                {cta.label} →
            </a>
        );
    }

    return (
        <span className="mb-12 inline-flex items-center gap-3 rounded-full bg-teal-dark/10 px-6 py-3 text-xs font-medium tracking-[0.15em] uppercase">
            <span className="size-2 animate-pulse rounded-full bg-teal-dark" aria-hidden="true" />
            {cta.label}
        </span>
    );
};

interface RegistrationsProps {
    section?: CmsSection;
    registerCta: RegisterCta;
}

/**
 * Ticket prices, driven by the `registrations` section.
 *
 * @remarks
 * Top-level stat items are ticket tiers (each with price rows as children), except
 * `tertiary` ones, which are info cards - e.g. Scholarships - shown in a column to the
 * right of the tiers. The tier style picker only offers primary/secondary, so a tier
 * can't be turned into an info card by accident.
 *
 * Field mapping: `heading` = heading, `body` = intro, `subheading` = registration button
 * label, `excerpt` = registration button link (see `getRegisterCta`).
 */
export const Registrations = ({ section, registerCta }: RegistrationsProps) => {
    if (!section) return null;

    const tiers = section.stats.filter((stat) => stat.style !== "tertiary");
    const infoCards = section.stats.filter((stat) => stat.style === "tertiary");
    const hasInfoCards = infoCards.length > 0;

    return (
        <section id="registrations" className="section-block-b container-site scroll-mt-24">
            <div className="section-panel bg-gold text-teal-dark">
                <CmsBox
                    table="sections"
                    rowId={section.id}
                    label="Registrations section"
                    values={{ heading: section.heading, body: section.body, subheading: section.subheading, excerpt: section.excerpt }}
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

                    {/* also drives the navbar and hero buttons */}
                    <CmsText field="subheading" label="Registration button label" placeholder={REGISTER_CTA_DEFAULTS.label} editClassName="mb-4 text-base">
                        <RegisterStatus cta={registerCta} />
                    </CmsText>
                    <CmsText
                        field="excerpt"
                        label="Registration button link (#registrations = not open yet, e.g. /register once it is)"
                        placeholder={REGISTER_CTA_DEFAULTS.href}
                        editClassName="mb-12 text-base"
                    />
                </CmsBox>

                <div className={cn("grid gap-6", hasInfoCards && "lg:grid-cols-3")}>
                    <ul className={cn("grid gap-6 sm:grid-cols-2", hasInfoCards ? "lg:col-span-2" : "md:grid-cols-3")}>
                        {tiers.map((tier) => (
                            <TierCard key={tier.id} tier={tier} />
                        ))}
                    </ul>

                    {hasInfoCards && (
                        <div className="flex flex-col gap-6">
                            {infoCards.map((card) => (
                                <InfoCard key={card.id} card={card} />
                            ))}
                        </div>
                    )}
                </div>

                <a
                    href={EVENT.policiesHref}
                    className="mt-8 inline-block text-sm font-medium underline decoration-current/40 underline-offset-4 transition-colors hover:decoration-current"
                >
                    Refund & cancellation policy →
                </a>
            </div>
        </section>
    );
};