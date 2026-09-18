import Image from "next/image";
import { SPONSORS } from "@/lib/content/pricing";
import { SectionTag } from "@/components/shared/SectionTag";

export const Sponsors = () => {
    return (
        <section id="sponsors" className="container-site scroll-mt-24 pb-16 md:pb-24">
            <div className="section-panel bg-teal text-center text-white">
                <SectionTag tone="white">Sponsors & Partners</SectionTag>

                <h2 className="mb-5 text-3xl leading-tight font-extralight sm:text-4xl md:text-5xl">
                    Supporting thirty years of Gestalt practice.
                </h2>
                <p className="mx-auto mb-12 max-w-xl text-lg leading-relaxed text-white/90">
                    Sponsorship opportunities are open. To discuss partnering with the 13th GANZ Conference,
                    contact the committee.
                </p>

                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {SPONSORS.map((sponsor) => (
                        <li
                            key={sponsor.id}
                            className="hover-lift flex aspect-[2/1] items-center justify-center rounded-3xl bg-white/10 hover:bg-white/25"
                        >
                            {sponsor.logoSrc ? (
                                <Image
                                    src={sponsor.logoSrc}
                                    alt={sponsor.name}
                                    width={240}
                                    height={120}
                                    className="max-h-20 w-auto"
                                />
                            ) : (
                                <span className="font-mono text-[0.6rem] tracking-[0.3em] text-white/70 uppercase select-none">
                                    Logo
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
};