import Image from "next/image";
import { NAV_LINKS, EVENT } from "@/lib/content/site";

// footer splits the nav into two columns; ABOUT holds the last four links
const ABOUT_IDS = new Set(["sponsors", "committee", "faqs", "contact"]);
const CONFERENCE_LINKS = NAV_LINKS.filter((link) => !ABOUT_IDS.has(link.id));
const ABOUT_LINKS = NAV_LINKS.filter((link) => ABOUT_IDS.has(link.id));

const FLAGS = [
    { src: "/design/imgs/flag-aboriginal.jpg", alt: "Aboriginal flag" },
    { src: "/design/imgs/flag-tsi.jpg", alt: "Torres Strait Islander flag" },
    { src: "/design/imgs/flag-maori.jpg", alt: "Tino Rangatiratanga (Māori) flag" },
];

const FooterLinks = ({ heading, links }: { heading: string; links: typeof NAV_LINKS }) => (
    <div>
        <span className="eyebrow mb-5 text-teal-dark/50">{heading}</span>
        <ul className="space-y-2.5">
            {links.map((link) => (
                <li key={link.id}>
                    <a href={`#${link.id}`} className="text-base text-teal-dark transition-colors hover:text-teal">
                        {link.id === "keynotes" ? "Keynote Presenters" : link.label}
                    </a>
                </li>
            ))}
        </ul>
    </div>
);

export const Footer = () => {
    return (
        <footer className="container-site border-t border-teal-dark/10 pt-16 pb-10">
            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
                <div>
                    <Image
                        src="/design/logo/GANZLogo_FullColour.png"
                        alt="GANZ - Gestalt Australia & New Zealand"
                        width={120}
                        height={104}
                        className="mb-6 h-24 w-auto"
                    />
                    <p className="max-w-xs text-base leading-relaxed text-teal-dark/70">
                        Gestalt Australia & New Zealand - The professional association for Gestalt practitioners
                        across Australia and Aotearoa New Zealand.
                    </p>
                </div>

                <FooterLinks heading="Conference" links={CONFERENCE_LINKS} />
                <FooterLinks heading="About" links={ABOUT_LINKS} />

                <div>
                    <span className="eyebrow mb-5 text-teal-dark/50">Details</span>
                    <ul className="space-y-3 text-base text-teal-dark">
                        <li>{EVENT.dates}</li>
                        <li>
                            Griffith University
                            <br />
                            Gold Coast, QLD, Australia
                        </li>
                        <li>
                            <a href={`mailto:${EVENT.email}`} className="transition-colors hover:text-teal">
                                {EVENT.email}
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            {/* acknowledgement of country */}
            <div className="mt-14 flex flex-col gap-6 border-t border-teal-dark/10 pt-8 md:flex-row md:items-start md:gap-10">
                <ul className="flex shrink-0 items-center gap-3">
                    {FLAGS.map((flag) => (
                        <li key={flag.src}>
                            <Image
                                src={flag.src}
                                alt={flag.alt}
                                width={48}
                                height={28}
                                className="h-6 w-auto rounded-sm"
                            />
                        </li>
                    ))}
                </ul>
                <p className="text-sm leading-relaxed text-teal-dark/70">
                    GANZ acknowledges the lands, waterways and skies across Australia and Aotearoa (New Zealand)
                    where we live, meet and practise. We honour the continuing connection of First Nations peoples
                    to Country, acknowledge that sovereignty was never ceded in Australia, and honour Te Tiriti o
                    Waitangi in Aotearoa. We honour the richness of Indigenous healing practices and our ongoing
                    learning alongside First Nations peoples.
                </p>
            </div>

            <p className="mt-8 border-t border-teal-dark/10 pt-6 text-sm text-teal-dark/60">
                © 2027 Gestalt Australia & New Zealand. All rights reserved.
            </p>
        </footer>
    );
};