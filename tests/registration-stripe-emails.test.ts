import { describe, expect, it } from "vitest";
import { STRIPE_SOURCE } from "../src/lib/registration/config";
import { automaticEmailKey, EMAIL_RECIPIENT, manualEmailKey } from "../src/lib/registration/emails";
import { buildCheckoutMetadata, isHandledStripeEvent, parseCheckoutMetadata } from "../src/lib/registration/stripe";

const REGISTRATION_ID = "4f1c2f6e-6b39-4b8a-9d55-1b9c0a8c2e11";

describe("Stripe metadata", () => {
    it("round-trips our own metadata", () => {
        expect(parseCheckoutMetadata(buildCheckoutMetadata(REGISTRATION_ID))).toEqual({
            source: STRIPE_SOURCE,
            registration_id: REGISTRATION_ID,
        });
    });

    it.each([
        ["no metadata (e.g. a WooCommerce payment)", null],
        ["empty metadata", {}],
        ["another source", { source: "woocommerce", registration_id: REGISTRATION_ID }],
        ["our source but no registration", { source: STRIPE_SOURCE }],
        ["a registration id that isn't a UUID", { source: STRIPE_SOURCE, registration_id: "123" }],
    ])("ignores %s", (_label, metadata) => {
        expect(parseCheckoutMetadata(metadata)).toBeNull();
    });
});

describe("isHandledStripeEvent", () => {
    it("knows the three events we subscribe to", () => {
        expect(isHandledStripeEvent("checkout.session.completed")).toBe(true);
        expect(isHandledStripeEvent("checkout.session.expired")).toBe(true);
        expect(isHandledStripeEvent("charge.refunded")).toBe(true);
        expect(isHandledStripeEvent("payment_intent.succeeded")).toBe(false);
    });
});

describe("email idempotency keys", () => {
    it("gives each automatic email one key per registration", () => {
        expect(automaticEmailKey("refund_processed", REGISTRATION_ID)).toBe(`refund_processed:${REGISTRATION_ID}`);
        expect(automaticEmailKey("refund_processed", REGISTRATION_ID)).toBe(automaticEmailKey("refund_processed", REGISTRATION_ID));
    });

    it("gives every manual resend a new key that can't collide with an automatic one", () => {
        const first = manualEmailKey();
        expect(first).toMatch(/^manual:[0-9a-f-]{36}$/);
        expect(manualEmailKey()).not.toBe(first);
    });

    it("sends only the new registration alert to GANZ", () => {
        expect(Object.entries(EMAIL_RECIPIENT).filter(([, to]) => to === "admin").map(([template]) => template)).toEqual([
            "admin_new_registration_alert",
        ]);
    });
});