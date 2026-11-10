"use server";

/**
 * Admin mutations for registration pricing.
 *
 * @remarks
 * Every export is a Server Action, which makes it a public POST endpoint: each one re-checks the
 * caller is an admin on the server, whatever the UI showed. The database checks again
 * (`save_ticket_pricing` raises `not_admin`), so neither check alone is load-bearing.
 */

import { revalidatePath } from "next/cache";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { handleError, type HandledError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { pricingFormSchema, type PricingFormInput, type SavePricingResult } from "./pricingForm";

const failure = (message: string, hint: string | null): SavePricingResult => ({
    ok: false,
    error: { message, hint, code: null, codeMeaning: null },
});

const SIGNED_OUT = failure(
    "Your session has expired, so you're no longer signed in.",
    "Sign in again in a new tab at /login, then come back to this tab and click save - your changes are still here.",
);
const NO_PERMISSION = failure(
    "Your account doesn't have permission to change prices.",
    "Sign in with the admin account, then try again.",
);
const OUT_OF_DATE = failure(
    "The prices on this page are out of date.",
    "Refresh the page to load the current prices, then make your change again.",
);

/** Copy for the refusals `save_ticket_pricing` raises; anything else goes through {@link handleError}. */
function toSaveError(error: { code?: string; message: string }): SavePricingResult {
    switch (error.message) {
        case "not_admin":
            return NO_PERMISSION;
        case "invalid_prices":
        case "unknown_price":
            return OUT_OF_DATE;
        case "invalid_amount":
            return failure("Every price must be more than $0.", "Fix the price and save again.");
        default: {
            const handled: HandledError = handleError(error, "tickets:saveTicketPricing");
            return { ok: false, error: handled };
        }
    }
}

/**
 * Saves the Admin -> Tickets form: the 8 prices, the current tier and the Early Bird close date.
 *
 * @remarks
 * Only what changed is written, each change with an audit row (see `save_ticket_pricing`). The public
 * pages are revalidated with the same blanket `revalidatePath("/", "layout")` as the CMS.
 *
 * @returns The number of changes saved (0 when nothing differed), or a user-facing error.
 */
export async function saveTicketPricing(input: PricingFormInput): Promise<SavePricingResult> {
    const user = await getCurrentUser();
    if (!user) return SIGNED_OUT;
    if (!isAdminUser(user)) {
        console.warn(`[tickets:saveTicketPricing] rejected non-admin caller ${user.email}`);
        return NO_PERMISSION;
    }

    const parsed = pricingFormSchema.safeParse(input);
    if (!parsed.success) {
        return failure(parsed.error.issues[0]?.message ?? "Check the prices and try again.", "Fix the field and save again.");
    }

    const { prices, currentTier, earlyBirdClosesOn } = parsed.data;

    try {
        const supabase = await createClient();
        const { data, error } = await supabase.rpc("save_ticket_pricing", {
            p_price_ids: prices.map((price) => price.id),
            p_amounts_cents: prices.map((price) => price.amountCents),
            p_current_tier: currentTier,
            // Omitted means "no date" (the parameter defaults to null)
            ...(earlyBirdClosesOn && { p_early_bird_closes_on: earlyBirdClosesOn }),
        });
        if (error) return toSaveError(error);

        console.log(`[tickets] saveTicketPricing by ${user.email}: ${data} change(s)`);
        if (data > 0) revalidatePath("/", "layout");
        return { ok: true, changes: data };
    } catch (error) {
        return { ok: false, error: handleError(error, "tickets:saveTicketPricing") };
    }
}