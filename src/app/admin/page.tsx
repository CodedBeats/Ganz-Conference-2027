import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getFiles } from "@/lib/content/getFiles";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { FileManager } from "@/components/files/FileManager";

export const metadata: Metadata = {
    title: "GANZ 2027 - Admin",
    robots: { index: false, follow: false },
};

/** Placeholder until Phase 2 ticketing - mirrors the registration tiers in the seed. */
const TICKET_TIERS = [
    { name: "GANZ Members", tickets: ["Early Bird", "Full Registration"] },
    { name: "Non-Members", tickets: ["Early Bird", "Full Registration"] },
    { name: "Scholarships", tickets: ["Scholarship Rate"] },
];

const CARD_TITLE = "mb-5 text-2xl leading-tight font-heading sm:text-3xl";

const formatDateTime = (iso: string | undefined) =>
    iso
        ? new Date(iso).toLocaleString("en-AU", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Australia/Brisbane",
          })
        : "-";

const AdminPage = async () => {
    const user = await requireUser();
    const files = await getFiles();
    const role = typeof user.app_metadata.role === "string" ? user.app_metadata.role : "none";

    return (
        <main className="container-site flex-1 py-10 md:py-16">
            <header className="section-panel mb-6 bg-teal-dark text-cream">
                <span className="eyebrow mb-3 text-gold">Admin</span>
                <h1 className="mb-3 text-4xl leading-tight font-heading sm:text-5xl">Dashboard</h1>
                <p className="mb-8 text-lg text-cream/80">
                    Signed in as <span className="font-medium text-cream">{user.email}</span>
                </p>

                <div className="flex flex-wrap gap-3">
                    <Link href="/" className="btn-pill btn-gold">
                        View site →
                    </Link>
                    <SignOutButton />
                </div>
            </header>

            <div className="grid gap-6 md:grid-cols-2">
                <section className="card bg-white">
                    <h2 className={CARD_TITLE}>Account</h2>
                    <dl className="space-y-4">
                        <div>
                            <dt className="eyebrow mb-1 text-teal-dark/50">Email</dt>
                            <dd className="text-lg">{user.email}</dd>
                        </div>
                        <div>
                            <dt className="eyebrow mb-1 text-teal-dark/50">Role</dt>
                            <dd className="text-lg capitalize">{role}</dd>
                        </div>
                        <div>
                            <dt className="eyebrow mb-1 text-teal-dark/50">Last sign in</dt>
                            <dd className="text-lg">{formatDateTime(user.last_sign_in_at)}</dd>
                        </div>
                    </dl>
                </section>

                <section className="card bg-teal-light">
                    <h2 className={CARD_TITLE}>Ticketing</h2>
                    <div className="space-y-5">
                        {TICKET_TIERS.map((tier) => (
                            <div key={tier.name}>
                                <h3 className="eyebrow mb-2 text-teal-dark/60">{tier.name}</h3>
                                <ul className="space-y-2">
                                    {tier.tickets.map((ticket) => (
                                        <li key={ticket} className="price-row bg-white">
                                            <span>{ticket}</span>
                                            <span className="font-medium">$###</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <p className="mt-5 text-sm text-teal-dark/70">
                        Ticket editing is coming in Phase 2 with registrations.
                    </p>
                </section>

                <section className="card bg-white md:col-span-2">
                    <h2 className={CARD_TITLE}>Files</h2>
                    <p className="mb-6 text-teal-dark/70">
                        Upload, rename, move and delete the images and PDFs used on the site.
                    </p>
                    <FileManager files={files} className="h-[40rem]" />
                </section>
            </div>
        </main>
    );
};

export default AdminPage;
