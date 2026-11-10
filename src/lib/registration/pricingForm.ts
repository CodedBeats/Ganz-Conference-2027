/**
 * The Admin -> Tickets form: what it submits, how it is validated, and what saving returns.
 *
 * @remarks
 * Shared by the editor (client, for inline errors) and `saveTicketPricing` (server, which re-checks
 * everything). Prices are typed in dollars and stored in cents.
 *
 * Client-safe.
 *
 * @module
 */
import { z } from "zod";
import type { HandledError } from "@/lib/errors";
import { parseDollarsToCents, type Cents } from "./money";
import { PRICE_TIERS } from "./options";

export type DollarsCheck = { ok: true; cents: Cents } | { ok: false; message: string };

/**
 * Checks one typed price.
 *
 * @remarks
 * Zero is refused as well as blanks and negatives: a free ticket isn't something the dashboard
 * should be able to create by accident (the DB checks `amount_cents > 0` too).
 */
export function checkDollars(text: string): DollarsCheck {
    if (text.trim() === "") return { ok: false, message: "Enter a price." };

    const cents = parseDollarsToCents(text);
    if (cents === null) return { ok: false, message: "Enter a price in dollars, e.g. 1085 or 1,085.50." };
    if (cents === 0) return { ok: false, message: "A price must be more than $0." };
    return { ok: true, cents };
}

const dollarsSchema = z.string().transform((text, context) => {
    const check = checkDollars(text);
    if (check.ok) return check.cents;
    context.addIssue({ code: "custom", message: check.message });
    return z.NEVER;
});

/** What the editor submits. `earlyBirdClosesOn` is `""` when the date input is cleared. */
export const pricingFormSchema = z.strictObject({
    prices: z
        .array(
            z
                .strictObject({ id: z.uuid(), dollars: dollarsSchema })
                .transform(({ id, dollars }) => ({ id, amountCents: dollars })),
        )
        .min(1),
    currentTier: z.enum(PRICE_TIERS),
    earlyBirdClosesOn: z.preprocess((value) => (value === "" ? null : value), z.iso.date().nullable()),
});

export type PricingFormInput = z.input<typeof pricingFormSchema>;
export type PricingFormValues = z.output<typeof pricingFormSchema>;

/** The result of saving the Tickets form. `changes` is 0 when nothing differed from what was saved. */
export type SavePricingResult = { ok: true; changes: number } | { ok: false; error: HandledError };