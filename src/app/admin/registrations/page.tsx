import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
    title: "Registrations",
};

const RegistrationsPage = async () => {
    await requireUser();

    return (
        <section id="coming-soon" className="card scroll-mt-28 bg-white">
            <span className="eyebrow mb-3 text-teal">Phase 2</span>
            <h2 className="mb-5 text-2xl leading-tight font-heading sm:text-3xl">Coming soon</h2>
            <p className="max-w-2xl text-teal-dark/70">
                Registrations, attendee details and ticket management will live here once ticketing is built in
                Phase 2.
            </p>
        </section>
    );
};

export default RegistrationsPage;