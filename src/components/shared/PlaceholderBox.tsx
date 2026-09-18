import { cn } from "@/lib/utils";

interface PlaceholderBoxProps {
    /** Text shown in the middle of the box, e.g. "TBC", "TBA", "LOGO". */
    label?: string;
    /** Size/aspect/colour overrides - the box has no intrinsic size of its own. */
    className?: string;
}

// Stand-in for images, maps and logos that haven't been supplied yet.
export const PlaceholderBox = ({ label = "TBC", className }: PlaceholderBoxProps) => {
    return (
        <div className={cn("placeholder-box", className)} aria-hidden="true">
            {label}
        </div>
    );
};