import type { PricingTier, Sponsor } from "@/types/content";

/** Registration tiers shown in the Registrations section, in display order. */
export const PRICING_TIERS: PricingTier[] = [
    {
        id: "members",
        title: "GANZ Members",
        subtitle: "Current financial members",
        rows: [
            { label: "Early Bird", price: "TBC" },
            { label: "Full Registration", price: "TBC" },
        ],
        tone: "light",
    },
    {
        id: "non-members",
        title: "Non-Members",
        subtitle: "All welcome",
        rows: [
            { label: "Early Bird", price: "TBC" },
            { label: "Full Registration", price: "TBC" },
        ],
        tone: "light",
    },
    {
        id: "scholarships",
        title: "Scholarships",
        subtitle: "Trainees & supported places",
        rows: [{ label: "Scholarship Rate", price: "TBC" }],
        note: "A limited number of supported places will be offered. Application details to follow.",
        tone: "dark",
    },
];

/** Sponsor logo slots. Empty `logoSrc` renders a "LOGO" placeholder card. */
export const SPONSORS: Sponsor[] = [
    { id: "sponsor-1", name: "Sponsor one" },
    { id: "sponsor-2", name: "Sponsor two" },
    { id: "sponsor-3", name: "Sponsor three" },
    { id: "sponsor-4", name: "Sponsor four" },
];