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
    it.each(["23505", "23503", "23514", "23502", "22P02", "42501", "PGRST116"])(
        "explains DB code %s in plain English with a next step",
        (code) => {
            const handled = handleError(postgrestError(code), "test");

            expect(handled.code).toBe(code);
            expect(handled.message).not.toBe("Something went wrong. Please try again.");
            expect(handled.message).not.toContain(code);
            expect(handled.hint).toBeTruthy();
            expect(handled.codeMeaning).toBeTruthy();
        },
    );

    it("maps a duplicate value to unique-value copy", () => {
        expect(handleError(postgrestError("23505"), "test").message).toBe(
            "Another item already uses this value, and it has to be unique.",
        );
    });

    it("falls back for unknown DB codes, keeping the code and the raw message as its meaning", () => {
        expect(handleError(postgrestError("99999"), "test")).toEqual({
            message: "Something went wrong. Please try again.",
            hint: expect.stringContaining("Try again"),
            code: "99999",
            codeMeaning: "raw db message",
        });
    });

    it("still maps known auth errors without a hint", () => {
        const error = new AuthApiError("Invalid login credentials", 400, "invalid_credentials");

        expect(handleError(error, "login")).toEqual({
            message: "Incorrect email or password.",
            hint: null,
            code: "invalid_credentials",
            codeMeaning: null,
        });
    });

    it("falls back for anything else, keeps its message as details and logs with the context", () => {
        expect(handleError(new Error("boom"), "somewhere")).toEqual({
            message: "Something went wrong. Please try again.",
            hint: expect.any(String),
            code: null,
            codeMeaning: "boom",
        });
        expect(handleError(42, "somewhere").codeMeaning).toBeNull();
        expect(console.error).toHaveBeenCalledWith("[somewhere]", expect.any(Error));
    });
});
