/**
 * Closed sets of registration options: one source of truth per set.
 *
 * @remarks
 * Each set is an `as const` tuple with a derived union type, plus a label record declared
 * with `satisfies Record<Key, string>`, so a key added without a label (or a label for a key
 * that doesn't exist) fails to compile. Every set here is also a Postgres enum; the tuples
 * must match the generated `Constants.public.Enums` exactly (see `tests/registration-enums.test.ts`).
 *
 * Client-safe: no server-only imports, so the form, the public cards and the server all share it.
 *
 * @module
 */

/** Ticket options. Matches the `ticket_option` enum. */
export const TICKET_OPTIONS = ["conference_only", "conference_workshop"] as const;
export type TicketOption = (typeof TICKET_OPTIONS)[number];

export const TICKET_OPTION_LABELS = {
    conference_only: "Three-day conference only",
    conference_workshop: "Conference + two-day pre-conference workshop",
} as const satisfies Record<TicketOption, string>;

/**
 * Who a price is for. Matches the `audience` enum.
 *
 * @remarks
 * Never entered directly by a person: it is derived from their membership choice ({@link audienceFor}).
 */
export const AUDIENCES = ["member", "non_member"] as const;
export type Audience = (typeof AUDIENCES)[number];

export const AUDIENCE_LABELS = {
    member: "GANZ members",
    non_member: "Non-members",
} as const satisfies Record<Audience, string>;

/** Price tiers. Matches the `price_tier` enum. */
export const PRICE_TIERS = ["early_bird", "full"] as const;
export type PriceTier = (typeof PRICE_TIERS)[number];

export const PRICE_TIER_LABELS = {
    early_bird: "Early Bird",
    full: "Full Registration",
} as const satisfies Record<PriceTier, string>;

/** The membership question (form Q1). Matches the `membership_choice` enum. */
export const MEMBERSHIP_CHOICES = ["current_member", "joining_member", "non_member"] as const;
export type MembershipChoice = (typeof MEMBERSHIP_CHOICES)[number];

export const MEMBERSHIP_CHOICE_LABELS = {
    current_member: "Yes, I'm a current GANZ member.",
    joining_member: "I'd like to join GANZ.",
    non_member: "I'd prefer to proceed as a non-member.",
} as const satisfies Record<MembershipChoice, string>;

/**
 * The audience (price column) each membership choice pays.
 *
 * @remarks
 * Both member choices pay the member price and are verified by GANZ after payment. Mirrored in
 * the DB by `public.audience_for()`, which generates `registrations.audience`.
 */
export const AUDIENCE_FOR_CHOICE = {
    current_member: "member",
    joining_member: "member",
    non_member: "non_member",
} as const satisfies Record<MembershipChoice, Audience>;

export function audienceFor(choice: MembershipChoice): Audience {
    return AUDIENCE_FOR_CHOICE[choice];
}

/**
 * Dietary requirements (form Q7, select all that apply). Matches the `dietary_requirement` enum.
 *
 * @remarks
 * `none` is exclusive: the form schema and a DB check both refuse it alongside anything else.
 */
export const DIETARY_REQUIREMENTS = ["none", "vegetarian", "vegan", "gluten_free", "other"] as const;
export type DietaryRequirement = (typeof DIETARY_REQUIREMENTS)[number];

export const DIETARY_REQUIREMENT_LABELS = {
    none: "No dietary requirements",
    vegetarian: "Vegetarian",
    vegan: "Vegan",
    gluten_free: "Gluten-free",
    other: "Other dietary requirement or food allergy",
} as const satisfies Record<DietaryRequirement, string>;

/** "What best describes your current role or connection to Gestalt practice?" (Q10, optional). */
export const GESTALT_CONNECTIONS = [
    "gestalt_practitioner",
    "gestalt_student",
    "educator_supervisor",
    "researcher_academic",
    "interested_not_practising",
    "other_mental_health_professional",
    "other",
] as const;
export type GestaltConnection = (typeof GESTALT_CONNECTIONS)[number];

export const GESTALT_CONNECTION_LABELS = {
    gestalt_practitioner: "Gestalt practitioner / psychotherapist",
    gestalt_student: "Gestalt student or trainee",
    educator_supervisor: "Educator / supervisor",
    researcher_academic: "Researcher / academic",
    interested_not_practising: "Interested in Gestalt but not currently practising",
    other_mental_health_professional: "Other counsellor/psychotherapist/mental health professional",
    other: "Other",
} as const satisfies Record<GestaltConnection, string>;

/** "How did you hear about the conference?" (Q11, optional). "Other" has no free-text field. */
export const HEARD_ABOUT_OPTIONS = [
    "ganz_newsletter",
    "social_media",
    "colleague_friend",
    "training_institute",
    "other",
] as const;
export type HeardAbout = (typeof HEARD_ABOUT_OPTIONS)[number];

export const HEARD_ABOUT_LABELS = {
    ganz_newsletter: "GANZ newsletter or email",
    social_media: "Social media",
    colleague_friend: "Colleague or friend",
    training_institute: "Gestalt training institute",
    other: "Other",
} as const satisfies Record<HeardAbout, string>;

/**
 * Parked: accommodation price range (Zoë, 9 Nov). Not agreed with GANZ, so it is not in the
 * schema or the form.
 *
 * @remarks
 * Adding it later is additive: a new `accommodation_range` enum, a nullable column on
 * `registration_private_details`, an optional form field and one line in the privacy statement.
 * Existing rows stay null, so nothing breaks.
 */
export const ACCOMMODATION_RANGES = ["premium", "high", "low", "billeting"] as const;
export type AccommodationRange = (typeof ACCOMMODATION_RANGES)[number];

export const ACCOMMODATION_RANGE_LABELS = {
    premium: "Premium",
    high: "High",
    low: "Low",
    billeting: "Billeting",
} as const satisfies Record<AccommodationRange, string>;