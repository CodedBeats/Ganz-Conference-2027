import { cn } from "@/lib/utils";
import { PRICING_TIERS } from "@/lib/content/pricing";
import { SectionTag } from "@/components/shared/SectionTag";

export const Registrations = () => {
    return (
        <section id="registrations" className="container-site scroll-mt-24 pb-16 md:pb-24">
            <div className="section-panel bg-gold text-teal-dark">
                <SectionTag>Registrations</SectionTag>

                <h2 className="section-heading mb-5">Join us on the Gold Coast.</h2>
                <p className="mb-12 max-w-2xl text-lg leading-relaxed text-teal-dark/80">
                    Registration opens in 2026. Rates are being finalised - join the mailing list and we will let
                    you know the moment early bird opens.
                </p>

                <ul className="grid gap-6 md:grid-cols-3">
                    {PRICING_TIERS.map((tier) => {
                        const isDark = tier.tone === "dark";

                        return (
                            <li
                                key={tier.id}
                                className={cn(
                                    "card hover-lift",
                                    isDark ? "bg-teal-dark text-cream" : "bg-cream text-teal-dark",
                                )}
                            >
                                <h3 className="mb-1 text-2xl font-medium">{tier.title}</h3>
                                <span className={cn("eyebrow mb-6", isDark ? "text-cream/60" : "text-teal-dark/60")}>
                                    {tier.subtitle}
                                </span>

                                <ul className="space-y-3">
                                    {tier.rows.map((row) => (
                                        <li
                                            key={row.label}
                                            className={cn("price-row", isDark && "bg-cream/10 text-cream")}
                                        >
                                            <span className="text-base">{row.label}</span>
                                            <span className={cn("text-lg font-bold", isDark ? "text-gold" : "text-teal")}>
                                                {row.price}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {tier.note && (
                                    <p className={cn("mt-5 text-base leading-relaxed", isDark ? "text-cream/85" : "text-teal-dark/70")}>
                                        {tier.note}
                                    </p>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
};