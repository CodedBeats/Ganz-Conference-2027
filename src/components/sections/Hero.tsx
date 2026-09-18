import Image from "next/image";
import { EVENT } from "@/lib/content/site";
import { SectionTag } from "@/components/shared/SectionTag";

export const Hero = () => {
    return (
        <header id="top" className="relative overflow-hidden bg-teal-dark text-cream">
            {/* concentric gold rings anchored to the right edge, clipped by the header */}
            <div className="ring-decor top-[-10%] right-[-5%] size-208 border-gold/20 md:size-240" />
            <div className="ring-decor top-[8%] right-[6%] size-144 border-gold/20 md:size-168" />

            <div className="container-site relative grid items-center gap-16 py-20 md:py-28 lg:grid-cols-[3fr_2fr]">
                <div>
                    <SectionTag tone="outline">Celebrating 30 years of GANZ</SectionTag>

                    <p className="mb-8 text-lg font-medium sm:text-xl md:text-2xl">
                        13th National <span className="text-gold">Gestalt Australia & New Zealand</span>{" "}
                        Conference
                    </p>

                    <h1 className="mb-12 text-6xl leading-[1.05] font-extralight tracking-tight sm:text-7xl md:text-[6.5rem]">
                        In Our Bodies,
                        <br />
                        <span className="font-normal text-gold">Of The Field</span>
                    </h1>

                    <div className="flex flex-wrap items-stretch gap-4">
                        <div className="hover-lift rounded-2xl bg-cream px-6 py-4 text-teal-dark">
                            <span className="eyebrow mb-1 text-teal-dark/60">Dates</span>
                            <span className="text-lg font-medium sm:text-xl">{EVENT.dates}</span>
                        </div>
                        <div className="hover-lift rounded-2xl bg-cream px-6 py-4 text-teal-dark">
                            <span className="eyebrow mb-1 text-teal-dark/60">Venue</span>
                            <span className="text-lg font-medium sm:text-xl">{EVENT.venueShort}</span>
                        </div>
                        {/* TODO: swap for the dedicated /register page once registration (phase 2) is built */}
                        <a href={EVENT.registerHref} className="btn-pill btn-gold self-center py-5">
                            Register Now →
                        </a>
                    </div>
                </div>

                {/* logo medallion */}
                <div className="flex justify-center lg:justify-end">
                    <div className="flex aspect-square w-64 items-center justify-center rounded-full bg-white p-10 md:w-80">
                        <Image
                            src="/design/logo/GANZLogo_FullColour.png"
                            alt="GANZ - Gestalt Australia & New Zealand"
                            width={300}
                            height={261}
                            priority
                            className="h-auto w-full"
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};