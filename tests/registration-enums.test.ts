/**
 * Drift checks between the TypeScript option tuples and the Postgres enums.
 *
 * Layer 1 (compile time): the type assertions below stop `tsc` / `next build` if a union and the
 * generated enum type differ. Layer 2 (this test run): the runtime tuples must equal the
 * generated `Constants` arrays, and every DB enum must be covered here. Layer 3 - that
 * `src/types/database.ts` is fresh against the migrations - needs the local DB, so it lives in
 * `tests/db/` (`npm run test:db`).
 */
import { describe, expect, it } from "vitest";
import { Constants, type Enums } from "../src/types/database";
import {
    AUDIENCE_LABELS,
    AUDIENCES,
    DIETARY_REQUIREMENT_LABELS,
    DIETARY_REQUIREMENTS,
    GESTALT_CONNECTION_LABELS,
    GESTALT_CONNECTIONS,
    HEARD_ABOUT_LABELS,
    HEARD_ABOUT_OPTIONS,
    MEMBERSHIP_CHOICE_LABELS,
    MEMBERSHIP_CHOICES,
    PRICE_TIER_LABELS,
    PRICE_TIERS,
    TICKET_OPTION_LABELS,
    TICKET_OPTIONS,
    type Audience,
    type DietaryRequirement,
    type GestaltConnection,
    type HeardAbout,
    type MembershipChoice,
    type PriceTier,
    type TicketOption,
} from "../src/lib/registration/options";
import {
    AUDIT_ACTION_LABELS,
    AUDIT_ACTIONS,
    AUDIT_ACTOR_LABELS,
    AUDIT_ACTORS,
    type AuditAction,
    type AuditActor,
} from "../src/lib/registration/audit";
import {
    EMAIL_STATUSES,
    EMAIL_TEMPLATE_LABELS,
    EMAIL_TEMPLATES,
    EMAIL_TRIGGERS,
    type EmailStatus,
    type EmailTemplate,
    type EmailTrigger,
} from "../src/lib/registration/emails";
import { REGISTRATION_STATUS_LABELS, REGISTRATION_STATUSES, type RegistrationStatus } from "../src/lib/registration/status";
import { STRIPE_EVENT_OUTCOMES, type StripeEventOutcome } from "../src/lib/registration/stripe";

/** `true` only when `A` and `B` are the same type (not merely assignable one way). */
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

// Layer 1: a `false` here is a type error.
const typeChecks: [
    Equal<TicketOption, Enums<"ticket_option">>,
    Equal<Audience, Enums<"audience">>,
    Equal<PriceTier, Enums<"price_tier">>,
    Equal<MembershipChoice, Enums<"membership_choice">>,
    Equal<RegistrationStatus, Enums<"registration_status">>,
    Equal<DietaryRequirement, Enums<"dietary_requirement">>,
    Equal<GestaltConnection, Enums<"gestalt_connection">>,
    Equal<HeardAbout, Enums<"heard_about">>,
    Equal<AuditActor, Enums<"audit_actor">>,
    Equal<AuditAction, Enums<"audit_action">>,
    Equal<StripeEventOutcome, Enums<"stripe_event_outcome">>,
    Equal<EmailTemplate, Enums<"email_template">>,
    Equal<EmailStatus, Enums<"email_status">>,
    Equal<EmailTrigger, Enums<"email_trigger">>,
] = [true, true, true, true, true, true, true, true, true, true, true, true, true, true];

type EnumName = keyof typeof Constants.public.Enums;

/** Every DB enum, with its TS tuple and (for sets shown to people) its labels. */
const ENUM_SETS: readonly { name: EnumName; values: readonly string[]; labels?: Record<string, string> }[] = [
    { name: "ticket_option", values: TICKET_OPTIONS, labels: TICKET_OPTION_LABELS },
    { name: "audience", values: AUDIENCES, labels: AUDIENCE_LABELS },
    { name: "price_tier", values: PRICE_TIERS, labels: PRICE_TIER_LABELS },
    { name: "membership_choice", values: MEMBERSHIP_CHOICES, labels: MEMBERSHIP_CHOICE_LABELS },
    { name: "registration_status", values: REGISTRATION_STATUSES, labels: REGISTRATION_STATUS_LABELS },
    { name: "dietary_requirement", values: DIETARY_REQUIREMENTS, labels: DIETARY_REQUIREMENT_LABELS },
    { name: "gestalt_connection", values: GESTALT_CONNECTIONS, labels: GESTALT_CONNECTION_LABELS },
    { name: "heard_about", values: HEARD_ABOUT_OPTIONS, labels: HEARD_ABOUT_LABELS },
    { name: "audit_actor", values: AUDIT_ACTORS, labels: AUDIT_ACTOR_LABELS },
    { name: "audit_action", values: AUDIT_ACTIONS, labels: AUDIT_ACTION_LABELS },
    { name: "stripe_event_outcome", values: STRIPE_EVENT_OUTCOMES },
    { name: "email_template", values: EMAIL_TEMPLATES, labels: EMAIL_TEMPLATE_LABELS },
    { name: "email_status", values: EMAIL_STATUSES },
    { name: "email_trigger", values: EMAIL_TRIGGERS },
];

describe("option tuples match the Postgres enums", () => {
    it("compiles the type-level checks", () => {
        expect(typeChecks.every(Boolean)).toBe(true);
    });

    it("covers every enum in the generated types", () => {
        expect(ENUM_SETS.map((set) => set.name).sort()).toEqual(Object.keys(Constants.public.Enums).sort());
    });

    it.each(ENUM_SETS)("$name has the same values as the DB", ({ name, values }) => {
        expect([...values].sort()).toEqual([...Constants.public.Enums[name]].sort());
    });

    it.each(ENUM_SETS.filter((set) => set.labels))("$name has a label for every value and nothing else", ({ values, labels }) => {
        expect(Object.keys(labels ?? {}).sort()).toEqual([...values].sort());
    });
});