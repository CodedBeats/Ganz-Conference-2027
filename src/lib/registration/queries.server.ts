import "server-only";

/**
 * Server-side reads for prices, settings and the pricing history.
 *
 * @remarks
 * Uses the cookie client, so RLS applies: prices, settings and the places-left count are public,
 * and the history is admin-only.
 *
 * @module
 */
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { buildPriceTable, type Pricing } from "./pricing";
import type { PricingAuditRow } from "./pricingHistory";

/**
 * Loads the settings, the 8 prices and the workshop places left, in parallel.
 *
 * @remarks
 * Never throws: a failure is logged and reported as `isAvailable: false`. Cached per request, so the
 * page and its components share one load.
 */
export const getPricing = cache(async (): Promise<Pricing> => {
    try {
        const supabase = await createClient();
        const [settings, prices, placesLeft] = await Promise.all([
            supabase.from("registration_settings").select("current_tier, early_bird_closes_on, workshop_capacity").single(),
            supabase.from("ticket_prices").select("id, ticket_option, audience, tier, amount_cents, is_active"),
            supabase.rpc("workshop_places_left"),
        ]);

        const error = settings.error ?? prices.error ?? placesLeft.error;
        if (error || !settings.data || !prices.data || placesLeft.data === null) {
            console.error("[getPricing] couldn't load pricing", error);
            return { isAvailable: false };
        }

        const built = buildPriceTable(prices.data);
        if (!built.ok) {
            console.error("[getPricing] duplicate price rows", built.duplicates);
            return { isAvailable: false };
        }

        return { isAvailable: true, settings: settings.data, table: built.table, placesLeft: placesLeft.data };
    } catch (error) {
        console.error("[getPricing] couldn't load pricing", error);
        return { isAvailable: false };
    }
});

/**
 * The most recent price and tier changes, newest first. Admin-only (RLS returns nothing otherwise).
 *
 * @returns An empty list if the history can't be loaded; the editor still works without it.
 */
export async function getPricingHistory(limit = 10): Promise<PricingAuditRow[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("pricing_audit_log")
        .select("id, before, after, changed_by, created_at, ticket_price:ticket_prices(ticket_option, audience, tier)")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("[getPricingHistory]", error);
        return [];
    }
    return data;
}