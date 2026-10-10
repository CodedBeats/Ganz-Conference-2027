import type { CmsSection } from "@/types/content";
import { EVENT } from "@/lib/content/site";
import { SectionTag } from "@/components/shared/SectionTag";
import { RichText } from "@/components/shared/RichText";
import { ContentImage } from "@/components/shared/ContentImage";
import { CmsBox } from "@/components/cms/CmsBox";
import { CmsText } from "@/components/cms/CmsText";

const EXCERPT_CLASS = "mb-6 text-xl font-medium sm:mb-8 sm:text-xl md:text-2xl";
const HEADING_CLASS =
    "mb-8 text-5xl leading-[1.05] font-extralight tracking-tight sm:mb-12 sm:text-7xl md:text-[6.5rem]";

export const Hero = ({ section }: { section?: CmsSection }) => {
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
                        {/* TODO: swap for the dedicated /register page once registration (phase 2) is built */}
                        <a href={EVENT.registerHref} className="btn-pill btn-gold w-full py-5 sm:text-lg sm:w-auto sm:self-center">
                            Register Now →
                        </a>
                    </div>
                </div>

                {/* logo medallion - the ring is pinned to it via .medallion-wrap in globals.css */}
                {section.image && (
                    <div className="flex justify-center lg:justify-end">
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
                    </div>
                )}
            </div>
        </header>
    );
};