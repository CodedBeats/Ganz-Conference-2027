import { cn } from "@/lib/utils";
import { SectionTag } from "@/components/shared/SectionTag";
import { RichText } from "@/components/shared/RichText";

interface SectionHeaderRowProps {
    tag: string;
    heading: string | null;
    /** Short supporting copy shown opposite the heading on wide screens. */
    note?: string | null;
    noteClassName?: string;
}

// Tag + heading on the left, side note on the right - shared by the light, open-layout sections.
export const SectionHeaderRow = ({ tag, heading, note, noteClassName }: SectionHeaderRowProps) => {
    return (
        <div className="section-header-row">
            <div>
                <SectionTag>{tag}</SectionTag>
                <h2 className="section-heading">
                    <RichText text={heading} />
                </h2>
            </div>
            {note && <p className={cn("side-note", noteClassName)}>{note}</p>}
        </div>
    );
};