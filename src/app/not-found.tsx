import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SectionTag } from "@/components/shared/SectionTag";
import { CmsPage } from "@/components/cms/CmsPage";
import { getPageContent } from "@/lib/content/getPageContent";
import { NAV_LINKS, getRegisterCta, sectionHref } from "@/lib/content/site";

export const metadata: Metadata = {
    title: "Page Not Found - GANZ Conference 2027",
};

// the sections people most often come looking for
const QUICK_LINK_IDS = new Set(["program", "keynotes", "registrations", "location", "faqs"]);
const QUICK_LINKS = NAV_LINKS.filter((link) => QUICK_LINK_IDS.has(link.id));

// the "0" of 404 as an open ring - Gestalt closure: the eye completes it anyway, and the faint
// dotted ring behind is that completed shape. Sized in em so it scales with the numerals.
const OpenCircle = () => (
    <svg viewBox="0 0 100 100" fill="none" className="mx-[0.05em] inline-block size-[0.7em] overflow-visible">
        <circle cx="50" cy="50" r="45" strokeWidth="1.5" strokeDasharray="1 5" strokeLinecap="round" className="stroke-cream/30" />
        <g className="origin-center motion-safe:animate-[spin_18s_linear_infinite]">
            <circle cx="50" cy="50" r="45" strokeWidth="5" strokeDasharray="228 55" strokeLinecap="round" className="stroke-gold" />
        </g>
    </svg>
);

const NotFound = async () => {
    // the navbar and footer need the home page's content too, so this loads the same sections
    const content = await getPageContent();

    return (
        <CmsPage>
            <Navbar registerCta={getRegisterCta(content.registrations)} />
            <main className="flex-1">
                <section className="relative overflow-hidden bg-teal-dark text-cream">
                    <div className="ring-decor top-[-25%] left-[-15%] size-160 border-gold/15 md:size-200" />
                    <div className="blob-decor -right-24 -bottom-24 size-80 bg-teal/25 blur-3xl" />

                    <div className="container-site relative grid items-center gap-8 py-16 z-1 sm:py-24 md:py-32 lg:grid-cols-2 lg:gap-16">
                        <p
                            aria-hidden
                            className="flex items-baseline justify-center text-[9rem] leading-none font-extralight tracking-tight sm:text-[13rem] lg:order-last lg:justify-end lg:text-[15rem]"
                        >
                            4<OpenCircle />4
                        </p>

                        <div>
                            <SectionTag tone="outline">Error 404 · Page not found</SectionTag>
                            <h1 className="mb-6 text-5xl leading-[1.05] font-extralight tracking-tight sm:text-6xl md:text-7xl">
                                Something&apos;s <span className="font-normal text-gold">missing</span> from the field.
                            </h1>
                            <p className="mb-10 max-w-xl text-lg leading-relaxed text-cream/75 sm:text-xl">
                                The page you&apos;re looking for may have moved, or the link might be incomplete. Like any open
                                gestalt, it&apos;s asking to be closed - let&apos;s get you back to somewhere whole.
                            </p>

                            <div className="flex flex-col gap-4 sm:flex-row">
                                <Link href="/" className="btn-pill btn-gold py-5 sm:text-base">
                                    Back to home →
                                </Link>
                                <a
                                    href={sectionHref("contact")}
                                    className="btn-pill border border-cream/30 py-5 text-cream hover:text-teal-dark sm:text-base"
                                >
                                    Contact us
                                </a>
                            </div>

                            <nav aria-label="Popular sections" className="mt-12 border-t border-cream/15 pt-8">
                                <span className="eyebrow mb-4 text-cream/50">Or jump to</span>
                                <ul className="flex flex-wrap gap-2.5">
                                    {QUICK_LINKS.map((link) => (
                                        <li key={link.id}>
                                            <a
                                                href={sectionHref(link.id)}
                                                className="hover-lift inline-block rounded-full bg-cream/10 px-4 py-2 text-sm text-cream hover:bg-cream hover:text-teal-dark"
                                            >
                                                {link.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        </div>
                    </div>
                </section>
            </main>
            <Footer section={content.footer} />
        </CmsPage>
    );
};

export default NotFound;