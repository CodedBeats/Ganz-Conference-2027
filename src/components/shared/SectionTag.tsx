import { cn } from "@/lib/utils";

type SectionTagTone = "light" | "dark" | "gold" | "white" | "outline";

interface SectionTagProps {
    children: React.ReactNode;
    tone?: SectionTagTone;
    className?: string;
}

// Colour combos used across the design so sections don't retype them.
const TONE_CLASSES: Record<SectionTagTone, string> = {
    light: "bg-teal-light text-teal", // on cream / gold backgrounds
    dark: "bg-teal-dark/60 text-gold", // on teal-dark panels (Program)
    gold: "bg-gold/15 text-gold", // alternate on teal-dark panels
    white: "bg-white/20 text-white", // on the teal Sponsors panel
    outline: "border border-gold text-gold", // hero
};

export const SectionTag = ({ children, tone = "light", className }: SectionTagProps) => {
    return <span className={cn("section-tag", TONE_CLASSES[tone], className)}>{children}</span>;
};