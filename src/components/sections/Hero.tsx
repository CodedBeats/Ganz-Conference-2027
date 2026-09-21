import Image from "next/image";
import { EVENT } from "@/lib/content/site";
import { SectionTag } from "@/components/shared/SectionTag";

export const Hero = () => {
    return (
        <header id="top" className="relative overflow-hidden bg-teal-dark text-cream">
            {/* large background ring, independent of the medallion (the tight one is on .medallion-wrap below) */}
            <div className="ring-decor top-[-10%] right-[-5%] size-208 border-gold/20 md:size-240" />

            <div className="container-site relative grid items-center gap-12 py-14 z-1 sm:py-20 md:gap-16 md:py-28 lg:grid-cols-[3fr_1fr]">
                <div className="z-1">
                    <SectionTag tone="outline">Celebrating 30 years of GANZ</SectionTag>

                    <p className="mb-6 text-xl font-medium sm:mb-8 sm:text-xl md:text-2xl">
                        13th National <span className="text-gold">Gestalt Australia & New Zealand</span>{" "}
                        Conference
                    </p>

                    <h1 className="mb-8 text-5xl leading-[1.05] font-extralight tracking-tight sm:mb-12 sm:text-7xl md:text-[6.5rem]">
                        In Our Bodies,
                        <br />
                        <span className="font-normal text-gold">Of The Field</span>
                    </h1>

                    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-stretch">
                        <div className="flex gap-4 sm:contents">
                            <div className="hover-lift flex-1 rounded-2xl bg-teal-dark border-2 border-teal/50 sm:border-0 sm:bg-cream px-6 py-4 sm:flex-none">
                                <span className="eyebrow mb-1 text-cream/60 sm:text-teal-dark/60">Dates</span>
                                <span className="text-sm font-medium text-cream sm:text-teal-dark sm:text-xl">{EVENT.dates}</span>
                            </div>
                            <div className="hover-lift flex-1 rounded-2xl bg-teal-dark border-2 border-teal/50 sm:border-0 sm:bg-cream px-6 py-4 sm:flex-none">
                                <span className="eyebrow mb-1 text-white/60 sm:text-teal-dark/60">Venue</span>
                                <span className="ext-sm font-medium text-cream sm:text-teal-dark sm:text-xl">{EVENT.venueShort}</span>
                            </div>
                        </div>
                        {/* TODO: swap for the dedicated /register page once registration (phase 2) is built */}
                        <a href={EVENT.registerHref} className="btn-pill btn-gold w-full py-5 sm:text-lg sm:w-auto sm:self-center">
                            Register Now →
                        </a>
                    </div>
                </div>

                {/* logo medallion - the ring is pinned to it via .medallion-wrap in globals.css */}
                <div className="flex justify-center lg:justify-end">
                    <div className="medallion-wrap">
                        <div className="logo-medallion">
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
            </div>
        </header>
    );
};