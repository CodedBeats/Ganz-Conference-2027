import type { CmsSection } from "@/types/content";
import { EVENT, type RegisterCta } from "@/lib/content/site";
import { SectionTag } from "@/components/shared/SectionTag";
import { RichText } from "@/components/shared/RichText";
import { ContentImage } from "@/components/shared/ContentImage";
import { PlaceholderBox } from "@/components/shared/PlaceholderBox";
import { CmsBox } from "@/components/cms/CmsBox";
import { CmsImageSlot } from "@/components/cms/CmsImageSlot";
import { CmsText } from "@/components/cms/CmsText";

const EXCERPT_CLASS = "mb-6 text-xl font-medium sm:mb-8 sm:text-xl md:text-2xl";
const HEADING_CLASS =
    "mb-8 text-5xl leading-[1.05] font-extralight tracking-tight sm:mb-12 sm:text-7xl md:text-[6.5rem]";

interface HeroProps {
    section?: CmsSection;
    /** Whether the Submissions section is published - the button would point at nothing otherwise. */
    hasSubmissions: boolean;
    registerCta: RegisterCta;
}

export const Hero = ({ section, hasSubmissions, registerCta }: HeroProps) => {
    if (!section) return null;

    return (
        <header id="top" className="relative overflow-hidden bg-teal-dark text-cream">
            {/* large background ring, independent of the medallion (the tight one is on .medallion-wrap below) */}
            <div className="ring-decor top-[-10%] right-[-5%] size-208 border-gold/20 md:size-240" />

            <div className="container-site relative grid items-center gap-12 py-14 z-1 sm:py-20 md:gap-16 md:py-28 lg:grid-cols-[3fr_1fr]">
                <div className="z-1">
                    <CmsBox
                        table="sections"
                        rowId={section.id}
                        label="Hero section"
                        values={{ subheading: section.subheading, excerpt: section.excerpt, heading: section.heading }}
                    >
                        <CmsText field="subheading" label="Tag line" editClassName="mb-6 max-w-sm text-sm text-gold">
                            {section.subheading && <SectionTag tone="outline">{section.subheading}</SectionTag>}
                        </CmsText>

                        <CmsText field="excerpt" label="Intro" multiline hint="highlight" editClassName={EXCERPT_CLASS}>
                            <p className={EXCERPT_CLASS}>
                                <RichText text={section.excerpt} accentClassName="text-gold" />
                            </p>
                        </CmsText>

                        <CmsText field="heading" label="Heading" multiline hint="highlight" editClassName={HEADING_CLASS}>
                            <h1 className={HEADING_CLASS}>
                                <RichText text={section.heading} accentClassName="font-normal text-gold" />
                            </h1>
                        </CmsText>
                    </CmsBox>

                    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-stretch">
                        <div className="flex gap-4 sm:contents">
                            {section.stats.map((stat) => (
                                <CmsBox
                                    key={stat.id}
                                    table="stat_items"
                                    rowId={stat.id}
                                    label={`Hero stat: ${stat.label}`}
                                    values={{ label: stat.label, value: stat.value }}
                                    className="hover-lift flex-1 rounded-2xl bg-teal-dark border-2 border-teal/50 sm:border-0 sm:bg-cream px-6 py-4 sm:flex-none"
                                >
                                    <CmsText field="label" label="Label" editClassName="eyebrow mb-1 text-cream/60 sm:text-teal-dark/60">
                                        <span className="eyebrow mb-1 text-cream/60 sm:text-teal-dark/60">{stat.label}</span>
                                    </CmsText>
                                    <CmsText field="value" label="Value" editClassName="text-sm font-medium text-cream sm:text-teal-dark sm:text-xl">
                                        <span className="text-sm font-medium text-cream sm:text-teal-dark sm:text-xl">
                                            {stat.value}
                                        </span>
                                    </CmsText>
                                </CmsBox>
                            ))}
                        </div>
                        {hasSubmissions && (
                            <a
                                href={EVENT.submissionsHref}
                                className="btn-pill btn-teal w-full py-5 sm:text-lg sm:w-auto sm:self-center"
                            >
                                Make a Submission →
                            </a>
                        )}
                        {/* label and link come from the CMS - see getRegisterCta */}
                        <a href={registerCta.href} className="btn-pill btn-gold w-full py-5 sm:text-lg sm:w-auto sm:self-center">
                            {registerCta.label} →
                        </a>
                    </div>
                </div>

                {/* logo medallion - the ring is pinned to it via .medallion-wrap in globals.css */}
                <CmsImageSlot
                    table="sections"
                    rowId={section.id}
                    field="image_id"
                    fileId={section.image?.id ?? null}
                    folder="general"
                    label="Hero logo"
                    className="flex justify-center lg:justify-end"
                    isHiddenWhenEmpty
                    placeholder={
                        <div className="medallion-wrap">
                            <div className="logo-medallion">
                                <PlaceholderBox label="Logo" className="size-full rounded-full" />
                            </div>
                        </div>
                    }
                >
                    <div className="medallion-wrap">
                        <div className="logo-medallion">
                            <ContentImage
                                image={section.image}
                                alt="GANZ - Gestalt Australia & New Zealand"
                                width={300}
                                height={261}
                                preload
                                className="h-auto w-full"
                            />
                        </div>
                    </div>
                </CmsImageSlot>
            </div>
        </header>
    );
};