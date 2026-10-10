import { cn } from "@/lib/utils";
import { SectionTag } from "@/components/shared/SectionTag";
import { RichText } from "@/components/shared/RichText";
import { CmsText } from "@/components/cms/CmsText";

interface SectionHeaderRowProps {
    tag: string;
    heading: string | null;
    /** Short supporting copy shown opposite the heading on wide screens. */
    note?: string | null;
    noteClassName?: string;
}

// Tag + heading on the left, side note on the right - shared by the light, open-layout sections.
// Must sit inside the section's CmsBox: heading and note edit the section's `heading` and `body`.
export const SectionHeaderRow = ({ tag, heading, note, noteClassName }: SectionHeaderRowProps) => {
    return (
        <div className="section-header-row">
            <div>
                <SectionTag>{tag}</SectionTag>
                <CmsText field="heading" label="Heading" multiline hint="highlight" editClassName="section-heading">
                    <h2 className="section-heading">
                        <RichText text={heading} />
                    </h2>
                </CmsText>
            </div>
            <CmsText field="body" label="Side note" multiline editClassName={cn("side-note w-full", noteClassName)}>
                {note && <p className={cn("side-note", noteClassName)}>{note}</p>}
            </CmsText>
        </div>
    );
};