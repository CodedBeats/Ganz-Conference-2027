import { describe, expect, it } from "vitest";
import { formDataToRegistrationInput, isHoneypotFilled, REGISTER_FIELD_NAMES } from "../src/lib/registration/formData";
import { registrationInputSchema, toFieldErrors } from "../src/lib/registration/schema";

const formData = (entries: [string, string][]) => {
    const data = new FormData();
    for (const [name, value] of entries) data.append(name, value);
    return data;
};

const COMPLETE: [string, string][] = [
    ["ticketOption", "conference_workshop"],
    ["quotedTier", "early_bird"],
    ["fullName", "Sam Taylor"],
    ["pronouns", ""],
    ["email", "sam@example.com"],
    ["phone", ""],
    [REGISTER_FIELD_NAMES.membershipChoice, "current_member"],
    [REGISTER_FIELD_NAMES.membershipName, "Samantha Taylor"],
    [REGISTER_FIELD_NAMES.membershipEmail, "sam.t@example.com"],
    ["dietary", "vegan"],
    ["dietary", "gluten_free"],
    ["dietaryDetails", ""],
    ["accessRequirements", ""],
    ["connectionToGestalt", ""],
    ["heardAbout", "social_media"],
    ["policyAccepted", "on"],
    ["policyVersion", "abc123def456"],
    [REGISTER_FIELD_NAMES.honeypot, ""],
];

describe("formDataToRegistrationInput", () => {
    it("builds input the schema accepts from a complete member submission", () => {
        const input = formDataToRegistrationInput(formData(COMPLETE));
        expect(input).toMatchObject({
            membership: { choice: "current_member", name: "Samantha Taylor", email: "sam.t@example.com" },
            dietary: ["vegan", "gluten_free"],
            policyAccepted: true,
        });

        const parsed = registrationInputSchema.safeParse(input);
        expect(parsed.success).toBe(true);
        expect(parsed.data).toMatchObject({ connectionToGestalt: null, heardAbout: "social_media", pronouns: null });
    });

    it("never includes verification details for a non-member", () => {
        const input = formDataToRegistrationInput(
            formData([...COMPLETE.filter(([name]) => name !== REGISTER_FIELD_NAMES.membershipChoice), [REGISTER_FIELD_NAMES.membershipChoice, "non_member"]]),
        );
        expect(input.membership).toEqual({ choice: "non_member" });
        expect(registrationInputSchema.safeParse(input).success).toBe(true);
    });

    it("treats an unticked policy box and no dietary choices as false and empty", () => {
        const input = formDataToRegistrationInput(formData(COMPLETE.filter(([name]) => name !== "policyAccepted" && name !== "dietary")));
        expect(input).toMatchObject({ policyAccepted: false, dietary: [] });
    });

    it("leaves the honeypot out of the input", () => {
        const input = formDataToRegistrationInput(formData([...COMPLETE, [REGISTER_FIELD_NAMES.honeypot, "spam"]]));
        expect(input).not.toHaveProperty(REGISTER_FIELD_NAMES.honeypot);
    });

    it("maps an empty form to an error on every required field", () => {
        const parsed = registrationInputSchema.safeParse(formDataToRegistrationInput(new FormData()));
        if (parsed.success) throw new Error("expected errors");
        expect(Object.keys(toFieldErrors(parsed.error)).sort()).toEqual(
            ["dietary", "email", "fullName", "membership", "policyAccepted", "policyVersion", "quotedTier", "ticketOption"].sort(),
        );
    });
});

describe("toFieldErrors", () => {
    it("puts nested membership errors on the right input", () => {
        const input = formDataToRegistrationInput(
            formData([
                ...COMPLETE.filter(([name]) => name !== REGISTER_FIELD_NAMES.membershipEmail),
                [REGISTER_FIELD_NAMES.membershipEmail, "not-an-email"],
            ]),
        );
        const parsed = registrationInputSchema.safeParse(input);
        if (parsed.success) throw new Error("expected errors");
        expect(toFieldErrors(parsed.error)).toEqual({ "membership.email": ["Enter a valid email address."] });
    });

    it("explains a missing membership answer in plain words", () => {
        const input = formDataToRegistrationInput(formData(COMPLETE.filter(([name]) => name !== REGISTER_FIELD_NAMES.membershipChoice)));
        const parsed = registrationInputSchema.safeParse(input);
        if (parsed.success) throw new Error("expected errors");
        expect(toFieldErrors(parsed.error).membership).toEqual(["Choose whether you're a GANZ member."]);
    });
});

describe("isHoneypotFilled", () => {
    it("spots a filled-in spam trap", () => {
        expect(isHoneypotFilled(formData(COMPLETE))).toBe(false);
        expect(isHoneypotFilled(formData([[REGISTER_FIELD_NAMES.honeypot, "http://spam.example"]]))).toBe(true);
    });
});
