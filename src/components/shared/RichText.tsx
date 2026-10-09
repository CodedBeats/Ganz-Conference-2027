import { Fragment } from "react";
import { parseHighlights } from "@/lib/content/text";

interface RichTextProps {
    /** CMS text using the `*highlight*` and `\n` line-break conventions. */
    text: string | null;
    /** Classes for the highlighted spans, e.g. `text-gold`. */
    accentClassName?: string;
}

const renderLines = (text: string) =>
    text.split("\n").map((line, index) => (
        <Fragment key={index}>
            {index > 0 && <br />}
            {line}
        </Fragment>
    ));

// Inline only - the caller owns the wrapping h1/h2/p so styling stays with the section.
export const RichText = ({ text, accentClassName }: RichTextProps) => {
    if (!text) return null;

    return (
        <>
            {parseHighlights(text).map((segment, index) =>
                segment.isHighlight ? (
                    <span key={index} className={accentClassName}>
                        {renderLines(segment.text)}
                    </span>
                ) : (
                    <Fragment key={index}>{renderLines(segment.text)}</Fragment>
                ),
            )}
        </>
    );
};