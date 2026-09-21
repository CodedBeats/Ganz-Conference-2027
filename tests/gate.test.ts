import { afterEach, describe, expect, it, vi } from "vitest";
import { getExpectedGateToken, isCorrectPassword, isValidGateToken } from "../src/lib/gate";

afterEach(() => {
    vi.unstubAllEnvs();
});

describe("isCorrectPassword", () => {
    it("returns true for the correct password", () => {
        vi.stubEnv("SITE_PASSWORD", "hunter2");
        expect(isCorrectPassword("hunter2")).toBe(true);
    });

    it("returns false for the wrong password", () => {
        vi.stubEnv("SITE_PASSWORD", "hunter2");
        expect(isCorrectPassword("wrong")).toBe(false);
    });

    it("returns false when SITE_PASSWORD is unset", () => {
        vi.stubEnv("SITE_PASSWORD", "");
        expect(isCorrectPassword("")).toBe(false);
    });
});

describe("getExpectedGateToken / isValidGateToken", () => {
    it("returns null when SITE_PASSWORD is unset", () => {
        vi.stubEnv("SITE_PASSWORD", "");
        expect(getExpectedGateToken()).toBeNull();
    });

    it("round-trips: the derived token validates against itself", () => {
        vi.stubEnv("SITE_PASSWORD", "hunter2");
        const token = getExpectedGateToken();
        expect(token).not.toBeNull();
        expect(isValidGateToken(token ?? undefined)).toBe(true);
    });

    it("rejects a tampered token", () => {
        vi.stubEnv("SITE_PASSWORD", "hunter2");
        expect(isValidGateToken("not-the-right-token")).toBe(false);
    });

    it("rejects a token of mismatched length without throwing", () => {
        vi.stubEnv("SITE_PASSWORD", "hunter2");
        expect(() => isValidGateToken("short")).not.toThrow();
        expect(isValidGateToken("short")).toBe(false);
    });

    it("rejects any token when the gate is disabled", () => {
        vi.stubEnv("SITE_PASSWORD", "");
        const token = getExpectedGateToken();
        expect(isValidGateToken(token ?? "anything")).toBe(false);
    });
});
