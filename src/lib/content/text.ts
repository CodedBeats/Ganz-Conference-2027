/** One run of CMS text - either plain or an accent-coloured highlight. */
export interface TextSegment {
    text: string;
    isHighlight: boolean;
}

/** One run of CMS text - plain, or a link when `href` is set. */
export interface LinkSegment {
    text: string;
    href?: string;
}

/** A `*highlight*` pair on a single line. The capture group keeps the inner text in `split` output. */
const HIGHLIGHT_PATTERN = /\*([^*\n]+)\*/;

/** A markdown `[label](url)` on a single line. Two capture groups, so `split` yields plain / label / url triples. */
const LINK_PATTERN = /\[([^\]\n]+)\]\(([^)\s]+)\)/;

/** Schemes and prefixes an editor may link to - anything else (e.g. `javascript:`) is left as text. */
const SAFE_HREF_PATTERN = /^(https?:\/\/|mailto:|tel:|#|\/)/i;

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

/**
 * Checks a CMS link target against the allow-list and normalises it.
 *
 * @remarks
 * Editors often paste `www.example.com` without the protocol, which the browser would
 * treat as a relative path, so that gets `https://` added. Protocol-relative `//host`
 * URLs are rejected along with unknown schemes - nobody types those on purpose.
 *
 * @param url - The text between the parentheses of `[label](url)`.
 * @returns A usable `href`, or `null` when the link shouldn't be rendered.
 */
export function resolveHref(url: string): string | null {
    if (/^www\./i.test(url)) return `https://${url}`;
    if (url.startsWith("//")) return null;

    return SAFE_HREF_PATTERN.test(url) ? url : null;
}

/** Whether a resolved `href` leaves the site, i.e. should open in a new tab. */
export function isExternalHref(href: string): boolean {
    return /^https?:\/\//i.test(href);
}

/**
 * Splits CMS text into plain and link segments using the markdown `[label](url)` convention.
 *
 * @remarks
 * Runs on the output of {@link parseHighlights}, so a link inside a highlight works but
 * markup inside a link label doesn't. A link whose URL fails {@link resolveHref} stays
 * in the text as written, the same way an unmatched `*` does, so the editor can spot it.
 *
 * @param text - Raw CMS text, e.g. `"See [the program](#program)."`.
 * @returns Segments in order, with empty runs dropped and adjacent plain runs merged.
 *
 * @see {@link RichText} in `src/components/shared/RichText.tsx`, which renders these
 */
export function parseLinks(text: string): LinkSegment[] {
    const parts = text.split(LINK_PATTERN);
    const segments: LinkSegment[] = [];

    const pushPlain = (plain: string) => {
        if (!plain) return;
        const last = segments.at(-1);
        if (last && !last.href) last.text += plain;
        else segments.push({ text: plain });
    };

    // `split` alternates plain, label, url, plain, label, url, ..., plain
    for (let index = 0; index < parts.length; index += 3) {
        pushPlain(parts[index]);
        if (index + 2 >= parts.length) break;

        const label = parts[index + 1];
        const url = parts[index + 2];
        const href = resolveHref(url);

        if (href) segments.push({ text: label, href });
        else pushPlain(`[${label}](${url})`);
    }

    return segments;
}