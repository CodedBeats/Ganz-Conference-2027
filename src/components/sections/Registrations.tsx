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
import { toTicketCardPricing, type TicketCardPriceRow, type TicketCardPricing } from "@/lib/registration/cards";
import type { Pricing } from "@/lib/registration/pricing";

const BODY_CLASS = "mb-8 max-w-2xl text-lg leading-relaxed text-teal-dark/80";
const CRITERIA_CLASS = "text-base leading-relaxed text-teal-dark/80";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

// tertiary is deliberately left out - it marks the info card, see Registrations below
const TIER_STYLES: CmsStyleOption[] = [
    { value: "primary", label: "Light card" },
    { value: "secondary", label: "Dark card" },
];

const TAG_CLASS = "rounded-full px-2.5 py-0.5 text-[0.6rem] font-medium tracking-[0.15em] uppercase";

// a price from ticket_prices (edited in Admin -> Tickets, not the CMS): the current tier is tagged
// "Now", Early Bird is struck through once GANZ switch to Full, and an upcoming tier is muted
const TicketPriceRow = ({ row, isDark }: { row: TicketCardPriceRow; isDark: boolean }) => (
    <li
        className={cn(
            "price-row gap-4",
            isDark && "bg-cream/10 text-cream",
            !row.isCurrent && !row.isClosed && "opacity-75",
            row.isClosed && "opacity-55",
        )}
    >
        <span className="flex min-w-0 flex-wrap items-center gap-2 text-base">
            {row.label}
            {row.isCurrent && <span className={cn(TAG_CLASS, "bg-gold text-teal-dark")}>Now</span>}
            {row.isClosed && <span className={cn(TAG_CLASS, isDark ? "bg-cream/15" : "bg-teal-dark/10")}>Closed</span>}
        </span>
        <span className={cn("text-lg font-bold", isDark ? "text-gold" : "text-teal", row.isClosed && "line-through")}>
            {row.price}
        </span>
    </li>
);

const placesLeftText = (placesLeft: number) =>
    placesLeft === 0 ? "Sold out - conference only is still available" : `${placesLeft} ${placesLeft === 1 ? "place" : "places"} left`;

// until registration opens (the CMS register link still points within the page) the card shows the
// same status label as the section's button; after that it links to the form with this ticket preselected
const TicketButton = ({ pricing, registerCta, isDark }: { pricing: TicketCardPricing; registerCta: RegisterCta; isDark: boolean }) => {
    if (!registerCta.isOpen || pricing.isSoldOut) {
        return (
            <span
                className={cn(
                    "inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-xs font-medium tracking-[0.15em] uppercase",
                    isDark ? "bg-cream/10 text-cream/70" : "bg-teal-dark/10 text-teal-dark/70",
                )}
            >
                {pricing.isSoldOut ? "Sold out" : registerCta.label}
            </span>
        );
    }

    return (
        <a href={pricing.registerHref} className={cn("btn-pill w-full", isDark ? "btn-gold" : "btn-dark hover:bg-teal hover:text-cream")}>
            Register →
        </a>
    );
};

// a tier is a top-level stat linked to a ticket: label = title, value = subtitle, description = note.
// Its prices and places left come from the database (see toTicketCardPricing).
const TierCard = ({ tier, pricing, registerCta }: { tier: CmsStatItem; pricing: Pricing; registerCta: RegisterCta }) => {
    const isDark = tier.style === "secondary";
    const subtitleClass = cn("eyebrow mb-6", isDark ? "text-cream/60" : "text-teal-dark/60");
    const noteClass = cn("mt-5 text-base leading-relaxed", isDark ? "text-cream/85" : "text-teal-dark/70");
    const cardPricing = toTicketCardPricing(tier, pricing);

    return (
        <CmsBox
            as="li"
            table="stat_items"
            rowId={tier.id}
            label={`Registration tier: ${tier.label} (prices are edited in Admin → Tickets)`}
            values={{ label: tier.label, value: tier.value, description: tier.description, style: tier.style }}
            className={cn("card hover-lift flex flex-col", isDark ? "bg-teal-dark text-cream" : "bg-cream text-teal-dark")}
        >
            <CmsStyleField options={TIER_STYLES} />

            <CmsText field="label" label="Tier name" editClassName="mb-1 text-2xl font-medium">
                <h3 className="mb-1 text-2xl font-medium">{tier.label}</h3>
            </CmsText>
            <CmsText field="value" label="Subtitle" editClassName={subtitleClass}>
                <span className={subtitleClass}>{tier.value}</span>
            </CmsText>

            {cardPricing && (
                <ul className="space-y-3">
                    {cardPricing.rows.map((row) => (
                        <TicketPriceRow key={row.tier} row={row} isDark={isDark} />
                    ))}
                </ul>
            )}

            {cardPricing && cardPricing.placesLeft !== null && (
                <p className={cn("mt-4 text-sm font-medium", isDark ? "text-gold" : "text-teal")}>
                    {placesLeftText(cardPricing.placesLeft)}
                </p>
            )}

            <CmsText field="description" label="Note" multiline hint="highlight" editClassName={noteClass}>
                {tier.description && (
                    <p className={noteClass}>
                        <RichText text={tier.description} accentClassName="font-medium" />
                    </p>
                )}
            </CmsText>

            {cardPricing && (
                <div className="mt-auto pt-6">
                    <TicketButton pricing={cardPricing} registerCta={registerCta} isDark={isDark} />
                </div>
            )}
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
    /** The 8 prices, tier and places left, from `getPricing`. */
    pricing: Pricing;
}

/**
 * Ticket prices, driven by the `registrations` section.
 *
 * @remarks
 * Top-level stat items are ticket tiers, except `tertiary` ones, which are info cards - e.g.
 * Scholarships - shown in a column to the right of the tiers. The tier style picker only offers
 * primary/secondary, so a tier can't be turned into an info card by accident.
 *
 * A tier's text is CMS-edited, but its prices, the current tier and the workshop places left come
 * from the database (Admin -> Tickets), through the card's `ticketOption` / `audience` link. If the
 * prices can't be loaded the cards show "To be confirmed" rather than breaking the page.
 *
 * Field mapping: `heading` = heading, `body` = intro, `subheading` = registration button
 * label, `excerpt` = registration button link (see `getRegisterCta`).
 */
export const Registrations = ({ section, registerCta, pricing }: RegistrationsProps) => {
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
                            <TierCard key={tier.id} tier={tier} pricing={pricing} registerCta={registerCta} />
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