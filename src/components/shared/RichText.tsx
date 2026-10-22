import { Fragment } from "react";
import { isExternalHref, parseHighlights, parseLinks } from "@/lib/content/text";

interface RichTextProps {
    /** CMS text using the `*highlight*`, `[label](url)` and `\n` line-break conventions. */
    text: string | null;
    /** Classes for the highlighted spans, e.g. `text-gold`. */
    accentClassName?: string;
}

// inherits the colour so links sit right on both the light and dark sections
const LINK_CLASS = "underline underline-offset-4 decoration-current/40 transition-colors hover:decoration-current";

const renderLines = (text: string) =>
    text.split("\n").map((line, index) => (
        <Fragment key={index}>
            {index > 0 && <br />}
            {line}
        </Fragment>
    ));

const renderLinks = (text: string) =>
    parseLinks(text).map((segment, index) => {
        if (!segment.href) return <Fragment key={index}>{renderLines(segment.text)}</Fragment>;

        const externalProps = isExternalHref(segment.href) ? { target: "_blank", rel: "noopener noreferrer" } : {};

        return (
            <a key={index} href={segment.href} className={LINK_CLASS} {...externalProps}>
                {renderLines(segment.text)}
            </a>
        );
    });

// Inline only - the caller owns the wrapping h1/h2/p so styling stays with the section.
export const RichText = ({ text, accentClassName }: RichTextProps) => {
    if (!text) return null;

    return (
        <>
            {parseHighlights(text).map((segment, index) =>
                segment.isHighlight ? (
                    <span key={index} className={accentClassName}>
                        {renderLinks(segment.text)}
                    </span>
                ) : (
                    <Fragment key={index}>{renderLinks(segment.text)}</Fragment>
                ),
            )}
        </>
    );
};