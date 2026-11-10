/**
 * Fixed registration settings that live in code rather than the database.
 *
 * @remarks
 * Client-safe. Anything GANZ can change from the dashboard belongs in `registration_settings`
 * or `ticket_prices` instead.
 *
 * @module
 */

/**
 * The time zone dates such as the Early Bird close are read in.
 *
 * @remarks
 * The conference is in Queensland, which has no daylight saving, so the close is a fixed instant.
 */
export const EARLY_BIRD_TIMEZONE = "Australia/Brisbane";