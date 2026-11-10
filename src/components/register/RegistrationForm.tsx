"use client";

import { useRef, useState, useTransition, type FormEvent, type Ref } from "react";
import { cn } from "@/lib/utils";
import { RichText } from "@/components/shared/RichText";
import { EVENT } from "@/lib/content/site";
import { APPROVAL_TURNAROUND, JOIN_GANZ_NOTE, JOIN_GANZ_URL, PRIVACY_POLICY_URL } from "@/lib/registration/config";
import { formDataToRegistrationInput, REGISTER_FIELD_NAMES } from "@/lib/registration/formData";
import {
    AUDIENCE_LABELS,
    audienceFor,
    DIETARY_REQUIREMENT_LABELS,
    DIETARY_REQUIREMENTS,
    GESTALT_CONNECTION_LABELS,
    GESTALT_CONNECTIONS,
    HEARD_ABOUT_LABELS,
    HEARD_ABOUT_OPTIONS,
    MEMBERSHIP_CHOICE_LABELS,
    MEMBERSHIP_CHOICES,
    PRICE_TIER_LABELS,
    TICKET_OPTION_LABELS,
    TICKET_OPTIONS,
    type DietaryRequirement,
    type GestaltConnection,
    type HeardAbout,
    type MembershipChoice,
    type TicketOption,
} from "@/lib/registration/options";
import type { RegisterPreselection } from "@/lib/registration/params";
import type { PolicyItem } from "@/lib/registration/policy";
import type { RegistrationOffer } from "@/lib/registration/quote";
import {
    CREATE_REGISTRATION_ERROR_MESSAGES,
    FIELD_LIMITS,
    REGISTRATION_FIELD_PATHS,
    registrationInputSchema,
    toFieldErrors,
    type RegistrationFieldErrors,
    type RegistrationFieldPath,
    type RegistrationPreviewResult,
} from "@/lib/registration/schema";
import {
    CHOICE_CLASS,
    CHOICE_INPUT_CLASS,
    errorProps,
    FieldError,
    groupErrorProps,
    FieldShell,
    fieldId,
    FormSection,
    HINT_CLASS,
    INPUT_CLASS,
} from "./FormFields";

/** The exact wording of the agreement checkbox (Michelle's form, Q13). */
const POLICY_AGREEMENT =
    "I have read and agree to the above privacy and registration and cancellation terms. I understand that conference registrations are non-refundable.";

export interface RegistrationFormProps {
    /** `submitRegistration`, passed in from the page so this component never imports server code. */
    action: (previous: RegistrationPreviewResult, formData: FormData) => Promise<RegistrationPreviewResult>;
    offer: RegistrationOffer;
    /** The privacy statement, then the CMS terms, and the version the server will check. */
    policy: { privacy: PolicyItem; items: PolicyItem[]; version: string };
    /** From the `/register?option=…&audience=…` link; the person can change both. */
    preselection: RegisterPreselection;
}

interface Values {
    membershipChoice: MembershipChoice | "";
    membershipName: string;
    membershipEmail: string;
    ticketOption: TicketOption | "";
    fullName: string;
    pronouns: string;
    email: string;
    phone: string;
    dietary: DietaryRequirement[];
    dietaryDetails: string;
    accessRequirements: string;
    connectionToGestalt: GestaltConnection | "";
    heardAbout: HeardAbout | "";
    policyAccepted: boolean;
}

/** Which error each value clears when it's edited. */
const ERROR_PATH = {
    membershipChoice: "membership",
    membershipName: "membership.name",
    membershipEmail: "membership.email",
    ticketOption: "ticketOption",
    fullName: "fullName",
    pronouns: "pronouns",
    email: "email",
    phone: "phone",
    dietary: "dietary",
    dietaryDetails: "dietaryDetails",
    accessRequirements: "accessRequirements",
    connectionToGestalt: "connectionToGestalt",
    heardAbout: "heardAbout",
    policyAccepted: "policyAccepted",
} as const satisfies Record<keyof Values, RegistrationFieldPath>;

const isWorkshopSoldOut = (offer: RegistrationOffer) => offer.isAvailable && offer.placesLeft <= 0;

/**
 * Starting values. A non-member link preselects that answer; a member link can't tell a current
 * member from someone joining, so it only shows member prices until they choose. A preselected
 * workshop ticket is dropped when the workshop is sold out.
 */
function initialValues(preselection: RegisterPreselection, offer: RegistrationOffer): Values {
    const isSoldOutWorkshop = preselection.ticketOption === "conference_workshop" && isWorkshopSoldOut(offer);
    return {
        membershipChoice: preselection.audience === "non_member" ? "non_member" : "",
        membershipName: "",
        membershipEmail: "",
        ticketOption: preselection.ticketOption && !isSoldOutWorkshop ? preselection.ticketOption : "",
        fullName: "",
        pronouns: "",
        email: "",
        phone: "",
        dietary: [],
        dietaryDetails: "",
        accessRequirements: "",
        connectionToGestalt: "",
        heardAbout: "",
        policyAccepted: false,
    };
}

const placesLeftText = (placesLeft: number) =>
    placesLeft <= 0
        ? "Sold out - three-day conference only is still available"
        : `${placesLeft} ${placesLeft === 1 ? "place" : "places"} left`;

/**
 * The registration form (Michelle's form, received 6 Nov): membership and ticket, attendee details,
 * dietary, access, about you, and the terms.
 *
 * @remarks
 * Submitting runs `registrationInputSchema` here first, so most mistakes show without a round trip,
 * then calls the server action, which checks everything again and works out the price itself. Until
 * payment is connected (P2-15) the action only returns a preview.
 *
 * Values are controlled state so they survive a refused submission, and the first field with an
 * error is focused after each attempt.
 */
export const RegistrationForm = ({ action, offer, policy, preselection }: RegistrationFormProps) => {
    const [values, setValues] = useState<Values>(() => initialValues(preselection, offer));
    const [fieldErrors, setFieldErrors] = useState<RegistrationFieldErrors>({});
    const [result, setResult] = useState<RegistrationPreviewResult>({ status: "idle" });
    const [isPending, startTransition] = useTransition();
    const outcomeRef = useRef<HTMLDivElement>(null);

    const clearError = (path: RegistrationFieldPath) =>
        setFieldErrors((prev) => (prev[path] ? { ...prev, [path]: undefined } : prev));

    const setValue = <K extends keyof Values>(key: K, value: Values[K]) => {
        setValues((prev) => ({ ...prev, [key]: value }));
        clearError(ERROR_PATH[key]);
    };

    const toggleDietary = (value: DietaryRequirement, isChecked: boolean) => {
        setValues((prev) => {
            if (!isChecked) return { ...prev, dietary: prev.dietary.filter((item) => item !== value) };
            // "No dietary requirements" stands alone, so picking it clears the rest and vice versa
            if (value === "none") return { ...prev, dietary: ["none"] };
            return { ...prev, dietary: [...prev.dietary.filter((item) => item !== "none"), value] };
        });
        clearError("dietary");
    };

    const copyMyDetails = () => {
        setValues((prev) => ({ ...prev, membershipName: prev.fullName, membershipEmail: prev.email }));
        clearError("membership.name");
        clearError("membership.email");
    };

    const focusFirstError = (errors: RegistrationFieldErrors) => {
        const first = REGISTRATION_FIELD_PATHS.find((path) => errors[path]?.length);
        if (first) document.getElementById(fieldId(first))?.focus();
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        const parsed = registrationInputSchema.safeParse(formDataToRegistrationInput(formData));
        if (!parsed.success) {
            const errors = toFieldErrors(parsed.error);
            setFieldErrors(errors);
            setResult({ status: "idle" });
            focusFirstError(errors);
            return;
        }

        setFieldErrors({});
        startTransition(async () => {
            const next = await action(result, formData);
            setResult(next);
            if (next.status === "invalid") {
                setFieldErrors(next.fieldErrors);
                focusFirstError(next.fieldErrors);
            } else if (next.status !== "idle") {
                outcomeRef.current?.focus();
            }
        });
    };

    const audience = values.membershipChoice ? audienceFor(values.membershipChoice) : (preselection.audience ?? null);
    const isMember = values.membershipChoice === "current_member" || values.membershipChoice === "joining_member";
    const selectedPrice =
        offer.isAvailable && audience && values.ticketOption ? offer.prices[audience][values.ticketOption] : null;
    const errorsFor = (path: RegistrationFieldPath) => fieldErrors[path];

    return (
        <form onSubmit={handleSubmit} noValidate className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
            {/* spam trap: hidden from people and assistive tech, only bots fill it in */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label>
                    Leave this empty
                    <input type="text" name={REGISTER_FIELD_NAMES.honeypot} tabIndex={-1} autoComplete="off" defaultValue="" />
                </label>
            </div>
            <input type="hidden" name="quotedTier" value={offer.isAvailable ? offer.tier : ""} />
            <input type="hidden" name="policyVersion" value={policy.version} />

            <div className="min-w-0 space-y-6">
                {!offer.isAvailable && (
                    <p role="alert" className="rounded-2xl bg-gold/40 px-5 py-4 text-teal-dark">
                        Registration prices couldn&apos;t be loaded right now, so the form can&apos;t be submitted. Please try
                        again in a little while.
                    </p>
                )}

                {/* Section 1: membership and ticket */}
                <FormSection number={1} title="Membership and registration">
                    <fieldset id={fieldId("membership")} tabIndex={-1} {...groupErrorProps("membership", errorsFor("membership"))} className="outline-none">
                        <legend className="mb-2 font-medium">Are you a GANZ member?</legend>
                        <p className={HINT_CLASS}>
                            GANZ members receive $150 off. Your membership needs to be active when you register.
                        </p>
                        <div className="space-y-3">
                            {MEMBERSHIP_CHOICES.map((choice) => (
                                <label key={choice} className={CHOICE_CLASS}>
                                    <input
                                        type="radio"
                                        name={REGISTER_FIELD_NAMES.membershipChoice}
                                        value={choice}
                                        checked={values.membershipChoice === choice}
                                        onChange={() => setValue("membershipChoice", choice)}
                                        className={CHOICE_INPUT_CLASS}
                                    />
                                    <span>{MEMBERSHIP_CHOICE_LABELS[choice]}</span>
                                </label>
                            ))}
                        </div>
                        <FieldError path="membership" errors={errorsFor("membership")} />
                    </fieldset>

                    {values.membershipChoice === "joining_member" && (
                        <div className="rounded-2xl bg-teal-pale px-5 py-4 text-base leading-relaxed">
                            <p className="mb-2">
                                Join GANZ on the main GANZ website first, then come back to this page to finish registering
                                at the member price. This page stays open while you do.
                            </p>
                            <p className="mb-3 text-teal-dark/75">{JOIN_GANZ_NOTE}</p>
                            <a href={JOIN_GANZ_URL} target="_blank" rel="noopener noreferrer" className="btn-pill btn-dark hover:bg-teal hover:text-cream">
                                Join GANZ (opens in a new tab)
                            </a>
                        </div>
                    )}

                    {isMember && (
                        <div className="space-y-4 rounded-2xl border border-teal-dark/10 px-5 py-5">
                            <p className="text-base leading-relaxed text-teal-dark/80">
                                GANZ will check your membership after you pay, using the name and email you joined with.
                                This usually takes {APPROVAL_TURNAROUND.label}.
                            </p>
                            <button type="button" onClick={copyMyDetails} className="text-sm font-medium text-teal underline underline-offset-4">
                                Same as my details below
                            </button>
                            <FieldShell path="membership.name" label="Name you joined GANZ with" errors={errorsFor("membership.name")}>
                                <input
                                    id={fieldId("membership.name")}
                                    name={REGISTER_FIELD_NAMES.membershipName}
                                    autoComplete="name"
                                    maxLength={FIELD_LIMITS.name}
                                    value={values.membershipName}
                                    onChange={(event) => setValue("membershipName", event.target.value)}
                                    {...errorProps("membership.name", errorsFor("membership.name"))}
                                    className={INPUT_CLASS}
                                />
                            </FieldShell>
                            <FieldShell path="membership.email" label="Email you joined GANZ with" errors={errorsFor("membership.email")}>
                                <input
                                    id={fieldId("membership.email")}
                                    type="email"
                                    name={REGISTER_FIELD_NAMES.membershipEmail}
                                    autoComplete="email"
                                    maxLength={FIELD_LIMITS.email}
                                    value={values.membershipEmail}
                                    onChange={(event) => setValue("membershipEmail", event.target.value)}
                                    {...errorProps("membership.email", errorsFor("membership.email"))}
                                    className={INPUT_CLASS}
                                />
                            </FieldShell>
                        </div>
                    )}

                    <fieldset id={fieldId("ticketOption")} tabIndex={-1} {...groupErrorProps("ticketOption", errorsFor("ticketOption"))} className="outline-none">
                        <legend className="mb-2 font-medium">Registration option</legend>
                        <p className={HINT_CLASS}>
                            {offer.isAvailable
                                ? `${PRICE_TIER_LABELS[offer.tier]} prices${audience ? ` for ${AUDIENCE_LABELS[audience]}` : ""}.`
                                : "Prices to be confirmed."}
                            {!audience && " Choose your membership above to see your price."}
                        </p>
                        <div className="space-y-3">
                            {TICKET_OPTIONS.map((option) => {
                                const price = offer.isAvailable && audience ? offer.prices[audience][option] : null;
                                const isSoldOut = option === "conference_workshop" && isWorkshopSoldOut(offer);
                                const isUnavailable = !offer.isAvailable || isSoldOut || (audience !== null && price === null);

                                return (
                                    <label key={option} className={CHOICE_CLASS}>
                                        <input
                                            type="radio"
                                            name="ticketOption"
                                            value={option}
                                            checked={values.ticketOption === option}
                                            disabled={isUnavailable}
                                            onChange={() => setValue("ticketOption", option)}
                                            className={CHOICE_INPUT_CLASS}
                                        />
                                        <span className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                                            <span>
                                                {TICKET_OPTION_LABELS[option]}
                                                {option === "conference_workshop" && offer.isAvailable && (
                                                    <span className={cn("block text-sm", isSoldOut ? "font-medium text-red-700" : "text-teal")}>
                                                        {placesLeftText(offer.placesLeft)}
                                                    </span>
                                                )}
                                            </span>
                                            {price && <span className="text-lg font-bold text-teal">{price}</span>}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                        <FieldError path="ticketOption" errors={errorsFor("ticketOption")} />
                    </fieldset>
                </FormSection>

                {/* Section 2: attendee details */}
                <FormSection number={2} title="Your details" description="One person per registration. Groups register separately.">
                    <FieldShell
                        path="fullName"
                        label="Full name"
                        hint="The name you'd like us to use for your registration and name badge."
                        errors={errorsFor("fullName")}
                    >
                        <input
                            id={fieldId("fullName")}
                            name="fullName"
                            autoComplete="name"
                            maxLength={FIELD_LIMITS.name}
                            value={values.fullName}
                            onChange={(event) => setValue("fullName", event.target.value)}
                            {...errorProps("fullName", errorsFor("fullName"))}
                            className={INPUT_CLASS}
                        />
                    </FieldShell>
                    <FieldShell path="pronouns" label="Pronouns" isOptional hint="Listed on your name badge if provided." errors={errorsFor("pronouns")}>
                        <input
                            id={fieldId("pronouns")}
                            name="pronouns"
                            maxLength={FIELD_LIMITS.pronouns}
                            value={values.pronouns}
                            onChange={(event) => setValue("pronouns", event.target.value)}
                            {...errorProps("pronouns", errorsFor("pronouns"))}
                            className={INPUT_CLASS}
                        />
                    </FieldShell>
                    <FieldShell path="email" label="Email" hint="For your confirmation and important conference information." errors={errorsFor("email")}>
                        <input
                            id={fieldId("email")}
                            type="email"
                            name="email"
                            autoComplete="email"
                            maxLength={FIELD_LIMITS.email}
                            value={values.email}
                            onChange={(event) => setValue("email", event.target.value)}
                            {...errorProps("email", errorsFor("email"))}
                            className={INPUT_CLASS}
                        />
                    </FieldShell>
                    <FieldShell path="phone" label="Phone" isOptional hint="Only for urgent conference communication." errors={errorsFor("phone")}>
                        <input
                            id={fieldId("phone")}
                            type="tel"
                            name="phone"
                            autoComplete="tel"
                            maxLength={FIELD_LIMITS.phone}
                            value={values.phone}
                            onChange={(event) => setValue("phone", event.target.value)}
                            {...errorProps("phone", errorsFor("phone"))}
                            className={INPUT_CLASS}
                        />
                    </FieldShell>
                </FormSection>

                {/* Section 3: dietary */}
                <FormSection number={3} title="Dietary requirements">
                    <fieldset id={fieldId("dietary")} tabIndex={-1} {...groupErrorProps("dietary", errorsFor("dietary"))} className="outline-none">
                        <legend className="mb-2 font-medium">Do you have any dietary requirements?</legend>
                        <p className={HINT_CLASS}>Select all that apply.</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {DIETARY_REQUIREMENTS.map((value) => (
                                <label key={value} className={CHOICE_CLASS}>
                                    <input
                                        type="checkbox"
                                        name="dietary"
                                        value={value}
                                        checked={values.dietary.includes(value)}
                                        onChange={(event) => toggleDietary(value, event.target.checked)}
                                        className={CHOICE_INPUT_CLASS}
                                    />
                                    <span>{DIETARY_REQUIREMENT_LABELS[value]}</span>
                                </label>
                            ))}
                        </div>
                        <FieldError path="dietary" errors={errorsFor("dietary")} />
                    </fieldset>
                    <FieldShell
                        path="dietaryDetails"
                        label="Dietary details"
                        isOptional
                        hint="Helpful if you selected any requirements, e.g. allergies or how severe they are."
                        errors={errorsFor("dietaryDetails")}
                    >
                        <textarea
                            id={fieldId("dietaryDetails")}
                            name="dietaryDetails"
                            rows={3}
                            maxLength={FIELD_LIMITS.dietaryDetails}
                            value={values.dietaryDetails}
                            onChange={(event) => setValue("dietaryDetails", event.target.value)}
                            {...errorProps("dietaryDetails", errorsFor("dietaryDetails"))}
                            className={INPUT_CLASS}
                        />
                    </FieldShell>
                </FormSection>

                {/* Section 4: access */}
                <FormSection number={4} title="Access requirements">
                    <FieldShell
                        path="accessRequirements"
                        label="Do you have any access, adjustment, sensory or participation needs?"
                        isOptional
                        hint="Share as much or as little as you wish. Only the GANZ organisers can see this."
                        errors={errorsFor("accessRequirements")}
                    >
                        <textarea
                            id={fieldId("accessRequirements")}
                            name="accessRequirements"
                            rows={4}
                            maxLength={FIELD_LIMITS.accessRequirements}
                            value={values.accessRequirements}
                            onChange={(event) => setValue("accessRequirements", event.target.value)}
                            {...errorProps("accessRequirements", errorsFor("accessRequirements"))}
                            className={INPUT_CLASS}
                        />
                    </FieldShell>
                </FormSection>

                {/* Section 5: about you */}
                <FormSection number={5} title="About you">
                    <FieldShell
                        path="connectionToGestalt"
                        label="What best describes your current role or connection to Gestalt practice?"
                        isOptional
                        errors={errorsFor("connectionToGestalt")}
                    >
                        <select
                            id={fieldId("connectionToGestalt")}
                            name="connectionToGestalt"
                            value={values.connectionToGestalt}
                            onChange={(event) => setValue("connectionToGestalt", GESTALT_CONNECTIONS.find((value) => value === event.target.value) ?? "")}
                            {...errorProps("connectionToGestalt", errorsFor("connectionToGestalt"))}
                            className={INPUT_CLASS}
                        >
                            <option value="">Prefer not to say</option>
                            {GESTALT_CONNECTIONS.map((value) => (
                                <option key={value} value={value}>
                                    {GESTALT_CONNECTION_LABELS[value]}
                                </option>
                            ))}
                        </select>
                    </FieldShell>
                    <FieldShell path="heardAbout" label="How did you hear about the conference?" isOptional errors={errorsFor("heardAbout")}>
                        <select
                            id={fieldId("heardAbout")}
                            name="heardAbout"
                            value={values.heardAbout}
                            onChange={(event) => setValue("heardAbout", HEARD_ABOUT_OPTIONS.find((value) => value === event.target.value) ?? "")}
                            {...errorProps("heardAbout", errorsFor("heardAbout"))}
                            className={INPUT_CLASS}
                        >
                            <option value="">Prefer not to say</option>
                            {HEARD_ABOUT_OPTIONS.map((value) => (
                                <option key={value} value={value}>
                                    {HEARD_ABOUT_LABELS[value]}
                                </option>
                            ))}
                        </select>
                    </FieldShell>
                </FormSection>

                {/* Section 6: privacy and terms */}
                <FormSection number={6} title="Privacy and registration terms">
                    <PolicyText privacy={policy.privacy} items={policy.items} />
                    <div>
                        <label className={cn(CHOICE_CLASS, "bg-cream")}>
                            <input
                                id={fieldId("policyAccepted")}
                                type="checkbox"
                                name="policyAccepted"
                                checked={values.policyAccepted}
                                onChange={(event) => setValue("policyAccepted", event.target.checked)}
                                {...errorProps("policyAccepted", errorsFor("policyAccepted"))}
                                className={CHOICE_INPUT_CLASS}
                            />
                            <span className="font-medium">{POLICY_AGREEMENT}</span>
                        </label>
                        <FieldError path="policyAccepted" errors={errorsFor("policyAccepted")} />
                    </div>
                </FormSection>
            </div>

            {/* the summary sits beside the form on wide screens and after it on phones */}
            <aside className="card bg-teal-dark text-cream lg:sticky lg:top-28">
                <h2 className="mb-5 text-2xl leading-tight font-heading">Your registration</h2>
                <dl className="mb-6 space-y-3 text-base">
                    <SummaryRow label="Membership" value={values.membershipChoice ? AUDIENCE_LABELS[audienceFor(values.membershipChoice)] : null} />
                    <SummaryRow label="Option" value={values.ticketOption ? TICKET_OPTION_LABELS[values.ticketOption] : null} />
                    <SummaryRow label="Pricing" value={offer.isAvailable ? PRICE_TIER_LABELS[offer.tier] : null} />
                    <div className="flex items-baseline justify-between gap-4 border-t border-cream/15 pt-3">
                        <dt className="text-cream/70">Total</dt>
                        <dd className="text-2xl font-bold text-gold">{selectedPrice ?? "-"}</dd>
                    </div>
                </dl>

                <Outcome ref={outcomeRef} result={result} errors={errorsFor("form")} />

                <p className="mb-5 text-sm leading-relaxed text-cream/70">
                    Payment isn&apos;t connected yet. Submitting checks your details and shows what you would pay - nothing is
                    saved.
                </p>
                <button
                    type="submit"
                    disabled={isPending || !offer.isAvailable}
                    className="btn-pill btn-gold w-full disabled:pointer-events-none disabled:opacity-60"
                >
                    {isPending ? "Checking…" : "Check my registration"}
                </button>
            </aside>
        </form>
    );
};

const SummaryRow = ({ label, value }: { label: string; value: string | null }) => (
    <div className="flex items-baseline justify-between gap-4">
        <dt className="text-cream/70">{label}</dt>
        <dd className="text-right font-medium">{value ?? "-"}</dd>
    </div>
);

const PolicyBlock = ({ item }: { item: PolicyItem }) => (
    <div>
        <h3 className="mb-2 text-lg font-medium">{item.title}</h3>
        <div className="space-y-3">
            {item.paragraphs.map((paragraph, index) => (
                <p key={index} className="text-base leading-relaxed text-teal-dark/80">
                    <RichText text={paragraph} accentClassName="font-medium text-teal" />
                </p>
            ))}
        </div>
    </div>
);

// the privacy statement first, then the CMS terms (or a link to /policies if they're unpublished)
const PolicyText = ({ privacy, items }: { privacy: PolicyItem; items: PolicyItem[] }) => (
    <div className="space-y-6">
        <PolicyBlock item={privacy} />
        {items.length === 0 && (
            <p className="text-base leading-relaxed text-teal-dark/80">
                Please read our{" "}
                <a href={EVENT.policiesHref} target="_blank" rel="noopener noreferrer" className="text-teal underline underline-offset-4">
                    terms and policies
                </a>{" "}
                before registering.
            </p>
        )}
        {items.map((item) => (
            <PolicyBlock key={item.title} item={item} />
        ))}
        {PRIVACY_POLICY_URL && (
            <a href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer" className="inline-block text-teal underline underline-offset-4">
                Read the full privacy policy (opens in a new tab)
            </a>
        )}
    </div>
);

interface OutcomeProps {
    ref: Ref<HTMLDivElement>;
    result: RegistrationPreviewResult;
    /** Errors on hidden fields, e.g. the tier. */
    errors: string[] | undefined;
}

/** The server's answer: the preview, or why it was refused. Focused when it appears. */
const Outcome = ({ ref, result, errors }: OutcomeProps) => {
    const canReload = result.status === "error" && (result.error === "tier_changed" || result.error === "policy_changed");

    if (result.status === "preview") {
        return (
            <div ref={ref} tabIndex={-1} role="status" className="mb-6 rounded-2xl bg-cream px-5 py-4 text-teal-dark outline-none">
                <p className="mb-2 font-medium">Everything checks out.</p>
                <p className="text-sm leading-relaxed">
                    {result.preview.ticket} at the {result.preview.tier} {result.preview.audience.toLowerCase()} price:{" "}
                    <span className="font-bold">{result.preview.amount}</span>. Payment isn&apos;t connected yet, so this is a
                    preview and nothing was saved.
                </p>
            </div>
        );
    }

    const message = result.status === "error" ? CREATE_REGISTRATION_ERROR_MESSAGES[result.error] : errors?.[0];
    const hasFieldErrors = result.status === "invalid";
    if (!message && !hasFieldErrors) return null;

    return (
        <div ref={ref} tabIndex={-1} role="alert" className="mb-6 rounded-2xl bg-gold px-5 py-4 text-sm text-teal-dark outline-none">
            <p className="font-medium">{message ?? "Some answers need fixing - they're marked in the form."}</p>
            {canReload && (
                <button type="button" onClick={() => window.location.reload()} className="mt-2 font-medium underline underline-offset-4">
                    Reload the page
                </button>
            )}
        </div>
    );
};
