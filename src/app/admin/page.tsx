import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { SignOutButton } from "@/components/auth/SignOutButton";

export const metadata: Metadata = {
    title: "GANZ 2027 - Admin",
    robots: { index: false, follow: false },
};

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
                    <span className="eyebrow mb-5 text-teal">Account</span>
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
                    <span className="eyebrow mb-5 text-teal">Content</span>
                    <h2 className="mb-3 text-2xl font-medium">Coming soon</h2>
                    <p className="body-copy text-teal-dark/70">
                        Editing for sections, presenters, committee, FAQs and pricing will live here.
                    </p>
                </section>
            </div>
        </main>
    );
};

export default AdminPage;
