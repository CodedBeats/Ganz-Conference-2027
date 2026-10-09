/** One run of CMS text - either plain or an accent-coloured highlight. */
export interface TextSegment {
    text: string;
    isHighlight: boolean;
}

/** A `*highlight*` pair on a single line. The capture group keeps the inner text in `split` output. */
const HIGHLIGHT_PATTERN = /\*([^*\n]+)\*/;

/**
 * Splits CMS body text into paragraphs on blank lines.
 *
 * @remarks
 * The CMS convention is `\n\n` between paragraphs and a single `\n` for a forced
 * line break inside one, so only blank lines (optionally with stray whitespace) split.
 *
 * @param text - Raw body text from a section, or `null` when the section has none.
 * @returns Trimmed, non-empty paragraphs in order.
 */
export function splitParagraphs(text: string | null): string[] {
    if (!text) return [];

    return text
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
}

/**
 * Splits CMS text into plain and highlighted segments using the `*asterisk*` convention.
 *
 * @remarks
 * A highlight must open and close on the same line. An unmatched `*` is left in the
 * text as-is rather than swallowing the rest of the string. Line breaks (`\n`) are
 * kept inside segments for the renderer to turn into `<br />`.
 *
 * @param text - Raw CMS text, e.g. `"In Our Bodies,\n*Of The Field*"`.
 * @returns Segments in order, with empty runs dropped.
 *
 * @see {@link RichText} in `src/components/shared/RichText.tsx`, which renders these
 */
export function parseHighlights(text: string): TextSegment[] {
    // with a capture group, `split` alternates plain / highlight / plain / ...
    return text
        .split(HIGHLIGHT_PATTERN)
        .map((part, index) => ({ text: part, isHighlight: index % 2 === 1 }))
        .filter((segment) => segment.text.length > 0);
}