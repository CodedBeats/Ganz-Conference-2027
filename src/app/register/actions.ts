"use server";

/**
 * The `/register` form's submit action - a preview until payment is connected (P2-15).
 *
 * @remarks
 * A Server Action is a public POST endpoint, so nothing from the browser is trusted: the input is
 * re-validated, and the price, the tier and the audience are all worked out here from the database.
 * Nothing is saved.
 */

import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { getPageContent } from "@/lib/content/getPageContent";
import { isHoneypotFilled, formDataToRegistrationInput } from "@/lib/registration/formData";
import { AUDIENCE_LABELS, PRICE_TIER_LABELS, TICKET_OPTION_LABELS } from "@/lib/registration/options";
import { formatCents } from "@/lib/registration/money";
import { getRegistrationPolicy } from "@/lib/registration/policy";
import { quoteRegistration } from "@/lib/registration/quote";
import { getPricing } from "@/lib/registration/queries.server";
import { checkRateLimit } from "@/lib/registration/rateLimit.server";
import { registrationInputSchema, toFieldErrors, type RegistrationPreviewResult } from "@/lib/registration/schema";

const NOT_OPEN_YET = "Registration isn't open yet. Sign in with the admin account to test this form.";

/**
 * Checks a registration and says what it would cost.
 *
 * @remarks
 * In order: the caller must be an admin (only admins can test the form for now, and this endpoint is
 * reachable whatever the page shows), the honeypot (a bot gets an uneventful `idle`), the rate limit,
 * validation, the policy version (the terms may have changed in the CMS since the page loaded), then
 * the price from the server's own settings.
 */
export async function submitRegistration(
    _previous: RegistrationPreviewResult,
    formData: FormData,
): Promise<RegistrationPreviewResult> {
    const user = await getCurrentUser();
    if (!user || !isAdminUser(user)) {
        console.warn("[register] rejected a submission from a non-admin");
        return { status: "invalid", fieldErrors: { form: [NOT_OPEN_YET] } };
    }

    if (isHoneypotFilled(formData)) {
        console.warn("[register] honeypot filled, ignoring submission");
        return { status: "idle" };
    }

    if (!(await checkRateLimit("register"))) return { status: "error", error: "rate_limited" };

    const parsed = registrationInputSchema.safeParse(formDataToRegistrationInput(formData));
    if (!parsed.success) return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
    const input = parsed.data;

    const [content, pricing] = await Promise.all([getPageContent(), getPricing()]);

    const policy = await getRegistrationPolicy(content.policies);
    if (input.policyVersion !== policy.version) return { status: "error", error: "policy_changed" };

    const quote = quoteRegistration(input, pricing);
    if (!quote.ok) return { status: "error", error: quote.error };

    console.log(`[register] preview: ${quote.key.option} / ${quote.key.audience} / ${quote.key.tier}`);
    return {
        status: "preview",
        preview: {
            ticket: TICKET_OPTION_LABELS[quote.key.option],
            audience: AUDIENCE_LABELS[quote.key.audience],
            tier: PRICE_TIER_LABELS[quote.key.tier],
            amount: formatCents(quote.amount),
        },
    };
}
