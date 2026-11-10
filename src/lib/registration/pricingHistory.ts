/**
 * Turns `pricing_audit_log` rows into the one-line summaries shown under Admin -> Tickets.
 *
 * Client-safe.
 *
 * @module
 */
import type { Json } from "@/types/database";
import { EARLY_BIRD_TIMEZONE } from "./config";
import { formatCents, isCents } from "./money";
import {
    AUDIENCE_LABELS,
    PRICE_TIER_LABELS,
    PRICE_TIERS,
    TICKET_OPTION_LABELS,
    type Audience,
    type PriceTier,
    type TicketOption,
} from "./options";
import { parseOneOf } from "./params";

/** A `pricing_audit_log` row with its price's key embedded (null for a settings change). */
export interface PricingAuditRow {
    id: number;
    before: Json;
    after: Json;
    changed_by: string;
    created_at: string;
    ticket_price: { ticket_option: TicketOption; audience: Audience; tier: PriceTier } | null;
}

/** One change, ready to display. */
export interface PricingChange {
    id: number;
    /** e.g. "11 Nov 2026, 2:05 pm", in conference time. */
    at: string;
    /** "You" or "Another admin". */
    by: string;
    summary: string;
}

const CHANGE_TIME = new Intl.DateTimeFormat("en-AU", {
    timeZone: EARLY_BIRD_TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short",
});

const CLOSE_DATE = new Intl.DateTimeFormat("en-AU", { timeZone: "UTC", dateStyle: "medium" });

/** Reads one field of a jsonb snapshot. */
function field(snapshot: Json, key: string): Json | undefined {
    if (typeof snapshot !== "object" || snapshot === null || Array.isArray(snapshot)) return undefined;
    return snapshot[key];
}

function describeAmount(value: Json | undefined): string {
    return typeof value === "number" && isCents(value) ? formatCents(value) : "?";
}

function describeTier(value: Json | undefined): string {
    const tier = parseOneOf(PRICE_TIERS, value);
    return tier ? PRICE_TIER_LABELS[tier] : "?";
}

/** A `YYYY-MM-DD` date as "5 Mar 2027", or "no date". */
function describeCloseDate(value: Json | undefined): string {
    return typeof value === "string" ? CLOSE_DATE.format(new Date(`${value}T00:00:00Z`)) : "no date";
}

/** The before -> after summaries for one audit row. A settings row can hold two changes. */
function summarise(row: PricingAuditRow): string {
    if (row.ticket_price) {
        const { ticket_option, audience, tier } = row.ticket_price;
        const name = `${AUDIENCE_LABELS[audience]} · ${TICKET_OPTION_LABELS[ticket_option]} · ${PRICE_TIER_LABELS[tier]}`;
        return `${name}: ${describeAmount(field(row.before, "amount_cents"))} → ${describeAmount(field(row.after, "amount_cents"))}`;
    }

    const parts: string[] = [];
    const [tierBefore, tierAfter] = [field(row.before, "current_tier"), field(row.after, "current_tier")];
    if (tierBefore !== tierAfter) parts.push(`Current tier: ${describeTier(tierBefore)} → ${describeTier(tierAfter)}`);

    const [dateBefore, dateAfter] = [field(row.before, "early_bird_closes_on"), field(row.after, "early_bird_closes_on")];
    if (dateBefore !== dateAfter) {
        parts.push(`Early Bird closes: ${describeCloseDate(dateBefore)} → ${describeCloseDate(dateAfter)}`);
    }

    return parts.join("; ") || "Settings saved";
}

/**
 * Describes audit rows for display.
 *
 * @param currentUserId - The signed-in admin, whose own changes read "You".
 */
export function describePricingChanges(rows: readonly PricingAuditRow[], currentUserId: string): PricingChange[] {
    return rows.map((row) => ({
        id: row.id,
        at: CHANGE_TIME.format(new Date(row.created_at)),
        by: row.changed_by === currentUserId ? "You" : "Another admin",
        summary: summarise(row),
    }));
}