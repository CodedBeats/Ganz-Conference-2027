import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthApiError } from "@supabase/supabase-js";
import { handleError, isPostgrestError } from "../src/lib/errors";

const postgrestError = (code: string) => ({ message: "raw db message", code, details: null, hint: null });

beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("isPostgrestError", () => {
    it("recognises PostgREST error objects", () => {
        expect(isPostgrestError(postgrestError("23505"))).toBe(true);
    });

    it("rejects other values", () => {
        expect(isPostgrestError(new Error("boom"))).toBe(false);
        expect(isPostgrestError({ code: "23505", message: "no details or hint" })).toBe(false);
        expect(isPostgrestError(null)).toBe(false);
        expect(isPostgrestError("23505")).toBe(false);
    });
});

describe("handleError", () => {
    it.each([
        ["23505", "That already exists."],
        ["23503", "This is still in use elsewhere, so it can't be removed."],
        ["23514", "One of the values isn't allowed."],
        ["23502", "A required field is missing."],
        ["22P02", "One of the values is in the wrong format."],
        ["42501", "You don't have permission to do that."],
        ["PGRST116", "That item couldn't be found."],
    ])("maps DB code %s to friendly copy", (code, message) => {
        expect(handleError(postgrestError(code), "test")).toEqual({ message, code });
    });

    it("falls back for unknown DB codes but keeps the code", () => {
        expect(handleError(postgrestError("99999"), "test")).toEqual({
            message: "Something went wrong. Please try again.",
            code: "99999",
        });
    });

    it("still maps auth errors", () => {
        const error = new AuthApiError("Invalid login credentials", 400, "invalid_credentials");

        expect(handleError(error, "login")).toEqual({ message: "Incorrect email or password.", code: "invalid_credentials" });
    });

    it("falls back for anything else and logs with the context", () => {
        expect(handleError(new Error("boom"), "somewhere")).toEqual({
            message: "Something went wrong. Please try again.",
            code: null,
        });
        expect(console.error).toHaveBeenCalledWith("[somewhere]", expect.any(Error));
    });
});