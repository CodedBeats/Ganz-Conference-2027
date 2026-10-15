import { cn } from "@/lib/utils";
import { DialogDescription } from "@/components/ui/dialog";
import type { CmsError } from "@/types/cms";

interface CmsErrorDetailsProps {
    error: CmsError;
    /** Renders the message as the dialog's description - only valid inside a `Dialog`. */
    isInDialog?: boolean;
    className?: string;
}

/** "What happened" / "What to do" / technical details - how every CMS error is explained. */
export const CmsErrorDetails = ({ error, isInDialog = false, className }: CmsErrorDetailsProps) => {
    const Message = isInDialog ? DialogDescription : "p";

    return (
        <div className={cn("space-y-4 text-base leading-relaxed", className)}>
            <section>
                <h3 className="eyebrow mb-1 text-teal-dark/50">What happened</h3>
                <Message className="text-base text-teal-dark">{error.message}</Message>
            </section>

            {error.hint && (
                <section>
                    <h3 className="eyebrow mb-1 text-teal-dark/50">What to do</h3>
                    <p>{error.hint}</p>
                </section>
            )}

            {/* a code is only ever shown next to its explanation */}
            {error.codeMeaning && (
                <details className="rounded-2xl bg-teal-pale px-4 py-3 text-sm">
                    <summary className="cursor-pointer font-medium">Technical details</summary>
                    <p className="mt-2 text-teal-dark/80">
                        {error.code && <span className="font-mono">Error code {error.code}: </span>}
                        {error.codeMeaning}
                    </p>
                </details>
            )}
        </div>
    );
};