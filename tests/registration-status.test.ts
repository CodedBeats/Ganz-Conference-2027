import { describe, expect, it } from "vitest";
import { AUDIT_ACTORS, type AuditActor } from "../src/lib/registration/audit";
import { EMAIL_TEMPLATES } from "../src/lib/registration/emails";
import {
    canTransition,
    EMAILS_ON_ENTER,
    holdsPlace,
    isAttending,
    isPaidStatus,
    isTerminal,
    REGISTRATION_STATUSES,
    resolveTransition,
    statusAfterPayment,
    type RegistrationStatus,
} from "../src/lib/registration/status";

/**
 * The agreed transition table, written out independently of TRANSITIONS so a change to the
 * machine has to be made (and reviewed) in both places.
 */
const ALLOWED: readonly [RegistrationStatus, RegistrationStatus, AuditActor][] = [
    ["pending_payment", "confirmed", "stripe_webhook"],
    ["pending_payment", "awaiting_verification", "stripe_webhook"],
    ["pending_payment", "abandoned", "stripe_webhook"],
    ["pending_payment", "abandoned", "system"],
    ["awaiting_verification", "approved", "admin"],
    ["awaiting_verification", "rejected", "admin"],
    ["rejected", "refunded", "stripe_webhook"],
    ["confirmed", "refunded", "stripe_webhook"],
    ["awaiting_verification", "refunded", "stripe_webhook"],
    ["approved", "refunded", "stripe_webhook"],
    ["cancelled", "refunded", "stripe_webhook"],
    ["confirmed", "cancelled", "admin"],
    ["awaiting_verification", "cancelled", "admin"],
    ["approved", "cancelled", "admin"],
];

const isAllowed = (from: RegistrationStatus, to: RegistrationStatus, actor: AuditActor) =>
    ALLOWED.some(([f, t, a]) => f === from && t === to && a === actor);

const EVERY_MOVE = REGISTRATION_STATUSES.flatMap((from) =>
    REGISTRATION_STATUSES.flatMap((to) => AUDIT_ACTORS.map((actor) => [from, to, actor] as const)),
);

describe("canTransition", () => {
    it.each(EVERY_MOVE)("%s -> %s by %s", (from, to, actor) => {
        expect(canTransition(from, to, actor)).toBe(isAllowed(from, to, actor));
    });

    it("covers every ordered pair of statuses for every actor", () => {
        expect(EVERY_MOVE).toHaveLength(8 * 8 * 3);
    });

    it("never allows staying in place", () => {
        for (const status of REGISTRATION_STATUSES) {
            for (const actor of AUDIT_ACTORS) expect(canTransition(status, status, actor)).toBe(false);
        }
    });
});

describe("terminal statuses", () => {
    it("are exactly refunded and abandoned", () => {
        expect(REGISTRATION_STATUSES.filter(isTerminal)).toEqual(["refunded", "abandoned"]);
    });
});

describe("resolveTransition", () => {
    it("applies an allowed move", () => {
        expect(resolveTransition("pending_payment", "confirmed", "stripe_webhook")).toBe("apply");
    });

    it("treats a duplicate payment event as already done", () => {
        expect(resolveTransition("confirmed", "confirmed", "stripe_webhook")).toBe("already_done");
    });

    it("treats a payment event arriving after a refund as already done, never moving backwards", () => {
        expect(resolveTransition("refunded", "confirmed", "stripe_webhook")).toBe("already_done");
        expect(resolveTransition("approved", "awaiting_verification", "stripe_webhook")).toBe("already_done");
    });

    it("flags a payment for an abandoned checkout for review", () => {
        expect(resolveTransition("abandoned", "confirmed", "stripe_webhook")).toBe("not_allowed");
    });

    it("flags a move by the wrong actor for review", () => {
        expect(resolveTransition("awaiting_verification", "approved", "stripe_webhook")).toBe("not_allowed");
    });

    it("flags a non-member status on a member's path for review", () => {
        expect(resolveTransition("awaiting_verification", "confirmed", "stripe_webhook")).toBe("not_allowed");
    });
});

describe("statusAfterPayment", () => {
    it("confirms non-members and sends members to verification", () => {
        expect(statusAfterPayment("non_member")).toBe("confirmed");
        expect(statusAfterPayment("member")).toBe("awaiting_verification");
    });
});

describe("paid and attending", () => {
    it("treats every status after payment as paid", () => {
        expect(REGISTRATION_STATUSES.filter((status) => !isPaidStatus(status))).toEqual(["pending_payment", "abandoned"]);
    });

    it("counts only confirmed and approved as attending", () => {
        expect(REGISTRATION_STATUSES.filter(isAttending)).toEqual(["confirmed", "approved"]);
    });
});

describe("holdsPlace", () => {
    const expiresAt = new Date("2027-01-10T10:00:00Z");

    it("holds a place for confirmed, awaiting_verification and approved, whatever the time", () => {
        const muchLater = new Date("2027-06-01T00:00:00Z");
        const holders = REGISTRATION_STATUSES.filter((status) => holdsPlace(status, expiresAt, muchLater));
        expect(holders).toEqual(["confirmed", "awaiting_verification", "approved"]);
    });

    it("holds a pending place until 15 minutes after the session expires", () => {
        expect(holdsPlace("pending_payment", expiresAt, new Date("2027-01-10T10:14:59Z"))).toBe(true);
        expect(holdsPlace("pending_payment", expiresAt, new Date("2027-01-10T10:15:00Z"))).toBe(false);
    });
});

describe("EMAILS_ON_ENTER", () => {
    it("sends every template from some status", () => {
        const sent = new Set(Object.values(EMAILS_ON_ENTER).flat());
        expect([...sent].sort()).toEqual([...EMAIL_TEMPLATES].sort());
    });

    it("sends the right confirmation for each audience after payment", () => {
        expect(EMAILS_ON_ENTER[statusAfterPayment("non_member")]).toContain("non_member_confirmation");
        expect(EMAILS_ON_ENTER[statusAfterPayment("member")]).toContain("member_payment_received");
    });
});