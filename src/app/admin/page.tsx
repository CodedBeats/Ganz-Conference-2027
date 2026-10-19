import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getFiles } from "@/lib/content/getFiles";
import { FileManager } from "@/components/files/FileManager";

export const metadata: Metadata = {
    title: "Main",
};

/** Display-only until Phase 2 ticketing - the public site reads its prices from the CMS instead. */
const TICKET_GROUPS = [
    {
        name: "GANZ Members",
        tickets: [
            { name: "3-day Conference", earlyBird: "$485", full: "$585" },
            { name: "2-day Pre-Conference Workshop", earlyBird: "$650", full: "$750" },
            { name: "Bundle", earlyBird: "$1045", full: "$1145" },
        ],
    },
    {
        name: "Non-Members",
        tickets: [
            { name: "3-day Conference", earlyBird: "$635", full: "$735" },
            { name: "2-day Pre-Conference Workshop", earlyBird: "$800", full: "$900" },
            { name: "Bundle", earlyBird: "$1195", full: "$1295" },
        ],
    },
];

const CARD_TITLE = "mb-5 text-2xl leading-tight font-heading sm:text-3xl";

const AdminPage = async () => {
    await requireUser();
    const files = await getFiles();

    return (
        <div className="space-y-6">
            <section id="tickets" className="card scroll-mt-28 bg-teal-light">
                <h2 className={CARD_TITLE}>Tickets</h2>
                <div className="space-y-6">
                    {TICKET_GROUPS.map((group) => (
                        <div key={group.name}>
                            <h3 className="eyebrow mb-3 text-teal-dark/60">{group.name}</h3>
                            <ul className="grid gap-4 md:grid-cols-3">
                                {group.tickets.map((ticket) => (
                                    <li key={ticket.name}>
                                        <p className="mb-2 font-medium">{ticket.name}</p>
                                        <div className="space-y-2">
                                            <div className="price-row bg-white">
                                                <span>Early Bird</span>
                                                <span className="font-medium">{ticket.earlyBird}</span>
                                            </div>
                                            <div className="price-row bg-white">
                                                <span>Full Registration</span>
                                                <span className="font-medium">{ticket.full}</span>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <p className="mt-6 text-sm text-teal-dark/70">
                    These prices are display-only for now. Editing them here is coming in Phase 2 with registrations.
                </p>
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