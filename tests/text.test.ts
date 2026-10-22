import { describe, expect, it } from "vitest";
import { isExternalHref, parseHighlights, parseLinks, resolveHref, splitParagraphs } from "../src/lib/content/text";

describe("splitParagraphs", () => {
    it("splits on blank lines and trims each paragraph", () => {
        expect(splitParagraphs("  One.\n\nTwo.  \n\nThree.")).toEqual(["One.", "Two.", "Three."]);
    });

    it("keeps single line breaks inside a paragraph", () => {
        expect(splitParagraphs("Line one\nline two\n\nNext")).toEqual(["Line one\nline two", "Next"]);
    });

    it("treats whitespace-only lines as blank and drops empty paragraphs", () => {
        expect(splitParagraphs("A\n  \nB\n\n\n\n")).toEqual(["A", "B"]);
    });

    it("returns an empty array for null or empty text", () => {
        expect(splitParagraphs(null)).toEqual([]);
        expect(splitParagraphs("")).toEqual([]);
    });
});

describe("parseHighlights", () => {
    it("returns a single plain segment when there are no highlights", () => {
        expect(parseHighlights("Where to stay")).toEqual([{ text: "Where to stay", isHighlight: false }]);
    });

    it("marks asterisk-wrapped runs as highlights", () => {
        expect(parseHighlights("13th National *Gestalt Australia & New Zealand* Conference")).toEqual([
            { text: "13th National ", isHighlight: false },
            { text: "Gestalt Australia & New Zealand", isHighlight: true },
            { text: " Conference", isHighlight: false },
        ]);
    });

    it("handles highlights at the start, end and back to back", () => {
        expect(parseHighlights("*a* b *c**d*")).toEqual([
            { text: "a", isHighlight: true },
            { text: " b ", isHighlight: false },
            { text: "c", isHighlight: true },
            { text: "d", isHighlight: true },
        ]);
    });

    it("keeps line breaks inside segments", () => {
        expect(parseHighlights("In Our Bodies,\n*Of The Field*")).toEqual([
            { text: "In Our Bodies,\n", isHighlight: false },
            { text: "Of The Field", isHighlight: true },
        ]);
    });

    it("leaves an unmatched asterisk as literal text", () => {
        expect(parseHighlights("Price *TBC")).toEqual([{ text: "Price *TBC", isHighlight: false }]);
    });

    it("does not let a highlight span a line break", () => {
        expect(parseHighlights("*one\ntwo*")).toEqual([{ text: "*one\ntwo*", isHighlight: false }]);
    });
});

describe("resolveHref", () => {
    it("allows web, email, phone, anchor and site-relative links", () => {
        for (const url of ["https://ganz.org.au", "http://example.com", "mailto:info@ganz.org.au", "tel:+61400000000", "#program", "/admin"]) {
            expect(resolveHref(url)).toBe(url);
        }
    });

    it("adds https to a bare www address", () => {
        expect(resolveHref("www.ganz.org.au")).toBe("https://www.ganz.org.au");
    });

    it("rejects unknown schemes, protocol-relative and bare domains", () => {
        expect(resolveHref("javascript:alert(1)")).toBeNull();
        expect(resolveHref("//evil.com")).toBeNull();
        expect(resolveHref("ganz.org.au")).toBeNull();
    });
});

describe("isExternalHref", () => {
    it("is true only for http(s) links", () => {
        expect(isExternalHref("https://ganz.org.au")).toBe(true);
        expect(isExternalHref("#program")).toBe(false);
        expect(isExternalHref("mailto:info@ganz.org.au")).toBe(false);
    });
});

describe("parseLinks", () => {
    it("returns a single plain segment when there are no links", () => {
        expect(parseLinks("No links here")).toEqual([{ text: "No links here" }]);
    });

    it("splits a link out of the middle of the text", () => {
        expect(parseLinks("See [the program](#program) for details.")).toEqual([
            { text: "See " },
            { text: "the program", href: "#program" },
            { text: " for details." },
        ]);
    });

    it("handles links at the start, end and back to back", () => {
        expect(parseLinks("[a](/a)[b](/b) and [c](https://c.com)")).toEqual([
            { text: "a", href: "/a" },
            { text: "b", href: "/b" },
            { text: " and " },
            { text: "c", href: "https://c.com" },
        ]);
    });

    it("normalises a www link", () => {
        expect(parseLinks("[GANZ](www.ganz.org.au)")).toEqual([{ text: "GANZ", href: "https://www.ganz.org.au" }]);
    });

    it("leaves a disallowed link as literal text, merged with its neighbours", () => {
        expect(parseLinks("Click [me](javascript:alert(1)) now")).toEqual([{ text: "Click [me](javascript:alert(1)) now" }]);
    });

    it("leaves unclosed and line-spanning links as literal text", () => {
        expect(parseLinks("[text](https://a.com")).toEqual([{ text: "[text](https://a.com" }]);
        expect(parseLinks("[one\ntwo](https://a.com)")).toEqual([{ text: "[one\ntwo](https://a.com)" }]);
    });
});