import { describe, expect, it } from "vitest";
import { parseOneOf, parseRegisterSearchParams, registerHref } from "../src/lib/registration/params";
import { AUDIENCES, TICKET_OPTIONS } from "../src/lib/registration/options";

describe("parseOneOf", () => {
    it("returns a known value", () => {
        expect(parseOneOf(TICKET_OPTIONS, "conference_workshop")).toBe("conference_workshop");
    });

    it.each([["unknown", "workshop_only"], ["wrong case", "Conference_Only"], ["missing", undefined], ["repeated", ["conference_only", "conference_only"]], ["a number", 1]])(
        "drops a %s value",
        (_label, raw) => {
            expect(parseOneOf(TICKET_OPTIONS, raw)).toBeUndefined();
        },
    );
});

describe("parseRegisterSearchParams", () => {
    it("preselects the option and audience from a link", () => {
        expect(parseRegisterSearchParams({ option: "conference_workshop", audience: "member" })).toEqual({
            ticketOption: "conference_workshop",
            audience: "member",
        });
    });

    it("leaves out anything unrecognised and ignores other params", () => {
        expect(parseRegisterSearchParams({ option: "free", audience: "non_member", amount: "1" })).toEqual({
            audience: "non_member",
        });
    });

    it("returns nothing for an empty query", () => {
        expect(parseRegisterSearchParams({})).toEqual({});
    });
});
describe("registerHref", () => {
    it.each(TICKET_OPTIONS.flatMap((option) => AUDIENCES.map((audience) => [option, audience] as const)))(
        "round-trips %s for %s through parseRegisterSearchParams",
        (option, audience) => {
            const url = new URL(registerHref(option, audience), "https://example.com");
            expect(url.pathname).toBe("/register");
            expect(parseRegisterSearchParams(Object.fromEntries(url.searchParams))).toEqual({ ticketOption: option, audience });
        },
    );
});
