import { EVENT } from "@/lib/content/site";

export const Contact = () => {
    return (
        <section id="contact" className="section-block-b container-site scroll-mt-24">
            <div className="section-panel bg-teal-dark text-center text-cream">
                {/* faint teal rings echoing the hero */}
                <div className="ring-decor top-1/2 left-1/2 size-160 -translate-x-1/2 -translate-y-1/2 border-teal/25" />
                <div className="ring-decor top-1/2 left-1/2 size-240 -translate-x-1/2 -translate-y-1/2 border-teal/15" />

                <div className="relative py-6 md:py-12">
                    <h2 className="mb-10 text-4xl leading-tight font-heading sm:text-6xl md:text-7xl">
                        We&apos;d love to hear from you.
                    </h2>
                    <a
                        href={`mailto:${EVENT.email}`}
                        className="btn-pill btn-gold-to-cream px-5 sm:px-10 py-5 text-2xl font-normal tracking-normal normal-case sm:text-4xl md:px-14 md:py-6"
                    >
                        {EVENT.email}
                    </a>
                </div>
            </div>
        </section>
    );
};