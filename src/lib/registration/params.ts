/**
 * Typed parsing of the `/register` query string.
 *
 * @remarks
 * Links such as `/register?option=conference_workshop&audience=member` only *preselect* the form.
 * They never decide a price: the server works that out from the database. Anything unrecognised
 * is dropped, never guessed.
 *
 * Client-safe.
 *
 * @module
 */
import { AUDIENCES, TICKET_OPTIONS, type Audience, type TicketOption } from "./options";

/**
 * Returns `raw` as a member of `values`, or `undefined` if it isn't one.
 *
 * @remarks
 * A repeated query parameter (an array) is treated as unrecognised rather than picking one.
 */
export function parseOneOf<const T extends string>(values: readonly T[], raw: unknown): T | undefined {
    return values.find((value) => value === raw);
}

/** Search params as Next.js passes them to a page (after awaiting `searchParams`). */
export type SearchParams = Record<string, string | string[] | undefined>;

/** What a `/register` link may preselect. */
export interface RegisterPreselection {
    ticketOption?: TicketOption;
    audience?: Audience;
}

/** The registration form's path. */
export const REGISTER_PATH = "/register";

/**
 * A link to the registration form with a ticket preselected, e.g. from a public ticket card.
 *
 * @remarks
 * The values only preselect the form; see {@link parseRegisterSearchParams}.
 */
export function registerHref(ticketOption: TicketOption, audience: Audience): string {
    const query = new URLSearchParams({ option: ticketOption, audience });
    return `${REGISTER_PATH}?${query.toString()}`;
}

/** Reads `option` and `audience` from the `/register` query string. */
export function parseRegisterSearchParams(searchParams: SearchParams): RegisterPreselection {
    const ticketOption = parseOneOf(TICKET_OPTIONS, searchParams.option);
    const audience = parseOneOf(AUDIENCES, searchParams.audience);

    return {
        ...(ticketOption && { ticketOption }),
        ...(audience && { audience }),
    };
}