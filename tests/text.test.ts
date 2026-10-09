import { describe, expect, it } from "vitest";
import { parseHighlights, splitParagraphs } from "../src/lib/content/text";

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