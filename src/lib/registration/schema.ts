/**
 * The registration form schema, shared by the form (client) and the server action.
 *
 * @remarks
 * Built from the option tuples in `options.ts`, so a new option is accepted everywhere at once.
 * The schema has no amount field and rejects unknown keys, so a client can't send a price: the
 * server works the price out itself (`create_pending_registration`). The form sends the tier it
 * showed as `quotedTier`, only so the server can say the price changed instead of silently
 * charging a different one.
 *
 * Client-safe.
 *
 * @module
 */
import { z } from "zod";
import {
    DIETARY_REQUIREMENTS,
    GESTALT_CONNECTIONS,
    HEARD_ABOUT_OPTIONS,
    PRICE_TIERS,
    TICKET_OPTIONS,
} from "./options";

/** Text length limits. Mirrored by the `length(...)` checks in the registrations migration. */
export const FIELD_LIMITS = {
    name: 200,
    pronouns: 50,
    email: 254,
    phone: 40,
    dietaryDetails: 2000,
    accessRequirements: 4000,
    policyVersion: 100,
} as const;

/** Empty or whitespace-only text becomes `null`; anything else is trimmed. */
function blankToNull(value: unknown): unknown {
    if (value === undefined || value === null) return null;
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
}

const requiredText = (max: number) => z.string().trim().min(1, "This field is required.").max(max);

const optionalText = (max: number) => z.preprocess(blankToNull, z.string().max(max).nullable());

/** An optional single select: an empty choice (`""`, missing) becomes `null`. */
const optionalSelect = <const T extends readonly [string, ...string[]]>(values: T) =>
    z.preprocess(blankToNull, z.enum(values).nullable());

const emailAddress = z
    .string()
    .trim()
    .toLowerCase()
    .max(FIELD_LIMITS.email)
    .pipe(z.email("Enter a valid email address."));

const phoneNumber = z.preprocess(
    blankToNull,
    z
        .string()
        .max(FIELD_LIMITS.phone)
        .regex(/^\+?[\d\s()-]{6,}$/, "Enter a valid phone number.")
        .nullable(),
);

/** The name and email the person used to join GANZ, which GANZ check after payment. */
const memberVerification = {
    name: requiredText(FIELD_LIMITS.name),
    email: emailAddress,
};

/**
 * The membership question. Both member choices must give the name and email they joined with;
 * a non-member must not send them at all (strict objects reject the extra keys).
 */
export const membershipSchema = z.discriminatedUnion(
    "choice",
    [
        z.strictObject({ choice: z.literal("current_member"), ...memberVerification }),
        z.strictObject({ choice: z.literal("joining_member"), ...memberVerification }),
        z.strictObject({ choice: z.literal("non_member") }),
    ],
    { error: "Choose whether you're a GANZ member." },
);
export type MembershipInput = z.infer<typeof membershipSchema>;

/** Select all that apply, at least one, each once; "No dietary requirements" stands alone. */
export const dietarySchema = z
    .array(z.enum(DIETARY_REQUIREMENTS, "Choose from the dietary options listed."))
    .min(1, "Choose at least one option.")
    .refine((values) => new Set(values).size === values.length, "Choose each option only once.")
    .refine(
        (values) => !values.includes("none") || values.length === 1,
        "“No dietary requirements” can't be combined with other options.",
    );

/** Everything the registration form submits. */
export const registrationInputSchema = z.strictObject({
    ticketOption: z.enum(TICKET_OPTIONS, "Choose a registration option."),
    /** The tier the form showed. Not trusted for pricing; see the module notes. */
    quotedTier: z.enum(PRICE_TIERS, "Prices couldn't be loaded. Please reload the page."),

    fullName: requiredText(FIELD_LIMITS.name),
    pronouns: optionalText(FIELD_LIMITS.pronouns),
    email: emailAddress,
    phone: phoneNumber,

    membership: membershipSchema,

    dietary: dietarySchema,
    dietaryDetails: optionalText(FIELD_LIMITS.dietaryDetails),
    accessRequirements: optionalText(FIELD_LIMITS.accessRequirements),

    connectionToGestalt: optionalSelect(GESTALT_CONNECTIONS),
    heardAbout: optionalSelect(HEARD_ABOUT_OPTIONS),

    policyAccepted: z.literal(true, "You need to accept the privacy and cancellation terms to register."),
    /** The version label of the policy text the person was shown (P2-14). */
    policyVersion: requiredText(FIELD_LIMITS.policyVersion),
});

export type RegistrationInput = z.infer<typeof registrationInputSchema>;

/**
 * Every place a validation error can attach to, as a dotted path. `membership` is the membership
 * question itself; `form` is for errors on hidden fields (e.g. the tier), shown in the summary.
 *
 * In the order they appear on `/register`, which is the order the form focuses errors in.
 */
export const REGISTRATION_FIELD_PATHS = [
    "membership",
    "membership.name",
    "membership.email",
    "ticketOption",
    "quotedTier",
    "fullName",
    "pronouns",
    "email",
    "phone",
    "dietary",
    "dietaryDetails",
    "accessRequirements",
    "connectionToGestalt",
    "heardAbout",
    "policyAccepted",
    "policyVersion",
    "form",
] as const;
export type RegistrationFieldPath = (typeof REGISTRATION_FIELD_PATHS)[number];

export type RegistrationFieldErrors = Partial<Record<RegistrationFieldPath, string[]>>;

const isFieldPath = (path: string): path is RegistrationFieldPath =>
    REGISTRATION_FIELD_PATHS.some((known) => known === path);

/**
 * Groups validation issues by the field they belong to.
 *
 * @remarks
 * Uses the full dotted path, so `membership.email` errors land on that input rather than on the
 * membership question. An issue inside an array (e.g. `dietary.1`) goes to the array's field, and
 * anything unrecognised goes to `form`, so no error is silently dropped.
 */
export function toFieldErrors(error: z.ZodError): RegistrationFieldErrors {
    const errors: RegistrationFieldErrors = {};

    for (const issue of error.issues) {
        const fullPath = issue.path.map(String).join(".");
        const topLevel = String(issue.path[0] ?? "");
        const field = isFieldPath(fullPath) ? fullPath : isFieldPath(topLevel) ? topLevel : "form";
        errors[field] = [...(errors[field] ?? []), issue.message];
    }
    return errors;
}

/** Reasons the server can refuse a valid submission. */
export const CREATE_REGISTRATION_ERRORS = [
    "sold_out",
    "tier_changed",
    "policy_changed",
    "price_unavailable",
    "payment_unavailable",
    "rate_limited",
] as const;
export type CreateRegistrationError = (typeof CREATE_REGISTRATION_ERRORS)[number];

/** What the person is told for each refusal. */
export const CREATE_REGISTRATION_ERROR_MESSAGES = {
    sold_out:
        "The conference + workshop places have all been taken. Three-day conference only registration is still open.",
    tier_changed: "Prices changed while you were registering. Please check the updated price and submit again.",
    policy_changed: "The registration terms were updated while you were registering. Please read them and accept again.",
    price_unavailable: "That ticket isn't available at the moment. Please contact us if you need help registering.",
    payment_unavailable: "We couldn't start the payment. Please try again in a few minutes.",
    rate_limited: "There have been too many attempts from your connection. Please wait a few minutes and try again.",
} as const satisfies Record<CreateRegistrationError, string>;

/** The registration server action's result (P2-15). */
export type CreateRegistrationResult =
    | { ok: true; checkoutUrl: string }
    | { ok: false; error: "invalid"; fieldErrors: RegistrationFieldErrors }
    | { ok: false; error: CreateRegistrationError };

/** What a preview submission would be charged, worked out on the server. */
export interface RegistrationPreview {
    ticket: string;
    audience: string;
    tier: string;
    /** Formatted, e.g. `$1,085`. */
    amount: string;
}

/**
 * The result of submitting `/register` while payment isn't connected yet.
 *
 * @remarks
 * Temporary: P2-15 replaces the `preview` outcome with a redirect to Stripe Checkout
 * (see {@link CreateRegistrationResult}). Nothing is saved for a preview.
 */
export type RegistrationPreviewResult =
    | { status: "idle" }
    | { status: "invalid"; fieldErrors: RegistrationFieldErrors }
    | { status: "error"; error: CreateRegistrationError }
    | { status: "preview"; preview: RegistrationPreview };