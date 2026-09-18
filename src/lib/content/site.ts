import type { NavLink, StatItem } from "@/types/content";

/**
 * Section links in page order. `id` must match the `id` attribute on each
 * section so anchor links and the active-section observer line up.
 *
 * @see {@link useActiveSection} in `src/hooks/useActiveSection.ts`
 */
export const NAV_LINKS: NavLink[] = [
    { id: "welcome", label: "Welcome" },
    { id: "program", label: "Program" },
    { id: "keynotes", label: "Keynotes" },
    { id: "registrations", label: "Registrations" },
    { id: "location", label: "Location" },
    { id: "accommodation", label: "Accommodation" },
    { id: "sponsors", label: "Sponsors" },
    { id: "committee", label: "Committee" },
    { id: "faqs", label: "FAQs" },
    { id: "contact", label: "Contact" },
];

/** Core event facts reused across the hero, location, contact and footer. */
export const EVENT = {
    title: "In Our Bodies, Of The Field",
    edition: "13th National Gestalt Australia & New Zealand Conference",
    dates: "25-27 June 2027",
    venueShort: "Griffith University, Gold Coast QLD",
    venueName: "Griffith University Gold Coast Campus",
    addressLines: ["1 Parklands Dr,", "Southport QLD 4215", "Australia"],
    gettingHere:
        "G:link tram to Griffith University station. Approx. 25 minutes from Surfers Paradise, 30 minutes from Gold Coast Airport.",
    mapsHref:
        "https://www.google.com/maps/search/?api=1&query=Griffith+University+Gold+Coast+Campus",
    email: "contact@ganz.org.au",
    // TODO: point at the dedicated /register page once registration (phase 2) is built.
    registerHref: "#registrations",
    programHref: "#program",
} as const;

/** Headline numbers in the Program section. */
export const PROGRAM_STATS: StatItem[] = [
    { value: "3", label: "Days" },
    { value: "30", label: "Years of GANZ" },
    { value: "3", label: "Keynotes" },
    { value: "TBC", label: "Workshops", isPending: true },
];
