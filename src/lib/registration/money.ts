/**
 * Money as integer cents.
 *
 * @remarks
 * Every amount is a whole number of cents, branded as {@link Cents} so a raw `number` (for
 * example a dollar value, or a float from arithmetic) can't be passed where an amount is expected.
 * The only way in is {@link toCents} / {@link isCents}.
 *
 * @module
 */

declare const CENTS_BRAND: unique symbol;

/** A non-negative whole number of cents. */
export type Cents = number & { readonly [CENTS_BRAND]: true };

/** The only currency the conference charges in. The DB checks `currency = 'AUD'` too. */
export const CURRENCY = "AUD" as const;
export type Currency = typeof CURRENCY;

/** Whether `value` is a valid amount: a safe, non-negative integer. */
export function isCents(value: number): value is Cents {
    return Number.isSafeInteger(value) && value >= 0;
}

/**
 * Brands a number as {@link Cents}.
 *
 * @remarks
 * Throws rather than rounding: a fractional or negative amount means something upstream is
 * wrong, and silently fixing it could charge the wrong price.
 *
 * @throws RangeError if `value` isn't a safe, non-negative integer.
 */
export function toCents(value: number): Cents {
    if (!isCents(value)) {
        throw new RangeError(`Expected a whole, non-negative number of cents, got ${value}.`);
    }
    return value;
}

const WHOLE_DOLLARS = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

const DOLLARS_AND_CENTS = new Intl.NumberFormat("en-AU", { style: "currency", currency: CURRENCY });

/**
 * Formats cents as dollars for display, e.g. `108500` becomes `$1,085` and `48550` becomes `$485.50`.
 *
 * @remarks
 * Whole-dollar amounts drop the `.00`, which matches how the prices are written everywhere else.
 */
export function formatCents(amount: Cents): string {
    const isWholeDollars = amount % 100 === 0;
    return (isWholeDollars ? WHOLE_DOLLARS : DOLLARS_AND_CENTS).format(amount / 100);
}

/** Dollars as people type them: optional `$`, thousands commas, up to 2 decimal places. */
const DOLLARS = /^\$?\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?$/;

/**
 * Reads a dollar amount typed by an admin, e.g. `1085`, `1,085`, `$1,085.50`.
 *
 * @remarks
 * Works on the digits as text rather than multiplying a float by 100, so `0.29` is exactly 29
 * cents. Anything ambiguous (blank, negative, three decimal places, stray characters) is refused
 * rather than guessed.
 *
 * @returns The amount in cents, or `null` when the text isn't a valid amount.
 */
export function parseDollarsToCents(text: string): Cents | null {
    const match = DOLLARS.exec(text.trim());
    if (!match) return null;

    const [, wholeDollars, fraction = ""] = match;
    const cents = Number(wholeDollars.replaceAll(",", "")) * 100 + Number(fraction.padEnd(2, "0"));
    return isCents(cents) ? cents : null;
}

/** Cents as an editable dollar string: `108500` becomes `1085`, `48550` becomes `485.50`. */
export function centsToDollarInput(amount: Cents): string {
    const dollars = Math.floor(amount / 100);
    const cents = amount % 100;
    return cents === 0 ? String(dollars) : `${dollars}.${String(cents).padStart(2, "0")}`;
}