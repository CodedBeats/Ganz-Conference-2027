import { describe, expect, it } from "vitest";
import { auditSnapshot, REDACTED } from "../src/lib/registration/audit";

describe("auditSnapshot", () => {
    it("records an attendee name correction with the old and new values", () => {
        const snapshot = auditSnapshot(
            { full_name: "Sam Taylor", email: "sam@example.com" },
            { full_name: "Alex Morgan", email: "sam@example.com" },
        );
        expect(snapshot).toEqual({ before: { full_name: "Sam Taylor" }, after: { full_name: "Alex Morgan" } });
    });

    it("records a status change", () => {
        expect(auditSnapshot({ status: "awaiting_verification" }, { status: "approved" })).toEqual({
            before: { status: "awaiting_verification" },
            after: { status: "approved" },
        });
    });

    it("records clearing a field as null", () => {
        expect(auditSnapshot({ pronouns: "they/them" }, { pronouns: null })).toEqual({
            before: { pronouns: "they/them" },
            after: { pronouns: null },
        });
    });

    it("never records private-detail values, only that they changed", () => {
        const snapshot = auditSnapshot({}, {}, ["dietary", "access_requirements"]);
        expect(snapshot).toEqual({
            before: { dietary: REDACTED, access_requirements: REDACTED },
            after: { dietary: REDACTED, access_requirements: REDACTED },
        });
    });

    it("ignores fields that aren't allowlisted", () => {
        // A caller passing a whole row can't smuggle other columns into the log
        const after = { full_name: "Alex", policy_text_sha256: "x" } as Parameters<typeof auditSnapshot>[1];
        expect(auditSnapshot({ full_name: "Sam" }, after).after).toEqual({ full_name: "Alex" });
    });
});