/**
 * Reads the `/register` form's `FormData` into the shape `registrationInputSchema` checks.
 *
 * @remarks
 * Used by the form (client-side check before submitting) and the server action, so both validate
 * exactly the same thing. Field names are the schema keys, except the flattened membership fields
 * ({@link REGISTER_FIELD_NAMES}).
 *
 * Client-safe.
 *
 * @module
 */

/** Input names that aren't simply a schema key. */
export const REGISTER_FIELD_NAMES = {
    membershipChoice: "membershipChoice",
    membershipName: "membershipName",
    membershipEmail: "membershipEmail",
    /**
     * The spam trap: visually hidden and skipped by keyboard and autofill, so only bots fill it in.
     * A neutral name, so browsers don't autofill it for real people.
     */
    honeypot: "hp_extra_info",
} as const;

const TEXT_FIELDS = [
    "ticketOption",
    "quotedTier",
    "fullName",
    "pronouns",
    "email",
    "phone",
    "dietaryDetails",
    "accessRequirements",
    "connectionToGestalt",
    "heardAbout",
    "policyVersion",
] as const;

const textValue = (formData: FormData, name: string): string => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
};

/** Whether the spam trap was filled in. */
export function isHoneypotFilled(formData: FormData): boolean {
    return textValue(formData, REGISTER_FIELD_NAMES.honeypot).trim() !== "";
}

/**
 * Builds the object to validate from the submitted form.
 *
 * @remarks
 * Deliberately doesn't validate or coerce beyond the form's own encoding: missing text becomes
 * `""`, unticked checkboxes become `false` or `[]`, and the schema decides what's acceptable.
 * A non-member's verification fields are never included, even if they were somehow submitted.
 * The honeypot is never part of the result (the schema is strict, so it would be rejected).
 */
export function formDataToRegistrationInput(formData: FormData): Record<string, unknown> {
    const choice = textValue(formData, REGISTER_FIELD_NAMES.membershipChoice);
    const membership =
        choice === "current_member" || choice === "joining_member"
            ? {
                  choice,
                  name: textValue(formData, REGISTER_FIELD_NAMES.membershipName),
                  email: textValue(formData, REGISTER_FIELD_NAMES.membershipEmail),
              }
            : { choice };

    return {
        ...Object.fromEntries(TEXT_FIELDS.map((name) => [name, textValue(formData, name)])),
        membership,
        dietary: formData.getAll("dietary").filter((value) => typeof value === "string"),
        policyAccepted: formData.get("policyAccepted") === "on",
    };
}
