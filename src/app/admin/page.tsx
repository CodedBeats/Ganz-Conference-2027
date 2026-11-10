import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getFiles } from "@/lib/content/getFiles";
import { isPastEarlyBirdClose, type Pricing } from "@/lib/registration/pricing";
import { describePricingChanges, type PricingChange } from "@/lib/registration/pricingHistory";
import { getPricing, getPricingHistory } from "@/lib/registration/queries.server";
import { FileManager } from "@/components/files/FileManager";
import { TicketsEditor } from "@/components/admin/TicketsEditor";

export const metadata: Metadata = {
    title: "Main",
};

const CARD_TITLE = "mb-5 text-2xl leading-tight font-heading sm:text-3xl";

const TicketsCard = ({ pricing, history }: { pricing: Pricing; history: PricingChange[] }) => {
    if (!pricing.isAvailable) {
        return (
            <p role="alert" className="rounded-2xl bg-white px-5 py-4 text-teal-dark">
                The prices couldn&apos;t be loaded, so they can&apos;t be edited right now. Refresh the page to try again - if
                it keeps happening, the database may still need its latest update.
            </p>
        );
    }

    const { settings, table, placesLeft } = pricing;

    return (
        <TicketsEditor
            prices={[...table.values()].map(({ id, option, audience, tier, amount }) => ({ id, option, audience, tier, amount }))}
            currentTier={settings.current_tier}
            earlyBirdClosesOn={settings.early_bird_closes_on}
            isPastEarlyBirdClose={isPastEarlyBirdClose(settings, new Date())}
            placesLeft={placesLeft}
            workshopCapacity={settings.workshop_capacity}
            history={history}
        />
    );
};

const AdminPage = async () => {
    const user = await requireUser();
    const [files, pricing, historyRows] = await Promise.all([getFiles(), getPricing(), getPricingHistory()]);

    return (
        <div className="space-y-6">
            <section id="tickets" className="card scroll-mt-28 bg-teal-light">
                <h2 className={CARD_TITLE}>Tickets</h2>
                <p className="mb-6 text-teal-dark/70">
                    These prices are what the public ticket cards show and what new registrations are charged.
                </p>
                <TicketsCard pricing={pricing} history={describePricingChanges(historyRows, user.id)} />
            </section>

            <section id="files" className="card scroll-mt-28 bg-white">
                <h2 className={CARD_TITLE}>Files</h2>
                <p className="mb-6 text-teal-dark/70">
                    Upload, rename, move and delete the images and PDFs used on the site.
                </p>
                <FileManager files={files} className="h-[40rem]" />
            </section>

            {/* temporary - a home for future admin tools */}
            <section id="other" className="card scroll-mt-28 bg-white">
                <h2 className={CARD_TITLE}>Other</h2>
                <p className="text-teal-dark/70">More admin tools will land here.</p>
            </section>
        </div>
    );
};

export default AdminPage;