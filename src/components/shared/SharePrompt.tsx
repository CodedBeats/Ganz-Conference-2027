import { Share2 } from "lucide-react";
import { ShareDialog } from "@/components/shared/ShareDialog";

// a slim band between sections, so sharing is offered mid-page and not only in the footer.
// the copy stays generic since the sections either side can be unpublished in the CMS.
export const SharePrompt = () => (
    <div className="section-block-b container-site">
        <div className="flex flex-col items-center gap-5 rounded-3xl bg-teal-light px-6 py-7 text-center text-teal-dark sm:flex-row sm:justify-between sm:px-10 sm:text-left">
            <div>
                <p className="text-xl font-medium sm:text-2xl">Know someone who&apos;d love to be there?</p>
                <p className="mt-1 text-base text-teal-dark/70">Share the conference with friends and colleagues.</p>
            </div>
            <ShareDialog className="btn-pill btn-dark shrink-0 hover:bg-teal">
                <Share2 className="size-4" />
                Share the conference
            </ShareDialog>
        </div>
    </div>
);