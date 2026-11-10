import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CmsPage } from "@/components/cms/CmsPage";
import { SectionTag } from "@/components/shared/SectionTag";
import { RegistrationForm } from "@/components/register/RegistrationForm";
import { getPageContent } from "@/lib/content/getPageContent";
import { getRegisterCta } from "@/lib/content/site";
import { REGISTER_EVENT_DETAILS } from "@/lib/registration/config";
import { parseRegisterSearchParams } from "@/lib/registration/params";
import { getRegistrationPolicy } from "@/lib/registration/policy";
import { toRegistrationOffer } from "@/lib/registration/quote";
import { getPricing } from "@/lib/registration/queries.server";
import { submitRegistration } from "./actions";

// Admin-only, unlinked and kept out of search results while GANZ test it, until registration opens (P2-34)
export const metadata: Metadata = {
    title: "Register - GANZ Conference 2027",
    robots: { index: false, follow: false },
};

const RegisterPage = async ({ searchParams }: PageProps<"/register">) => {
    // only admins can see the form for now, remove (and "/register" in the proxy) when its ready for public
    await requireAdmin();

    const [content, pricing, query] = await Promise.all([getPageContent(), getPricing(), searchParams]);
    const policy = await getRegistrationPolicy(content.policies);

    return (
        <CmsPage>
            <Navbar registerCta={getRegisterCta(content.registrations)} />
            <main className="section-block container-site flex-1">
                <header className="mb-10 max-w-3xl md:mb-14">
                    <SectionTag>Registration</SectionTag>
                    <h1 className="section-heading mb-6">Register for GANZ Conference 2027</h1>
                    <ul className="space-y-1 text-base text-teal-dark/75 sm:text-lg">
                        <li>{REGISTER_EVENT_DETAILS.conference}</li>
                        <li>{REGISTER_EVENT_DETAILS.workshop}</li>
                        <li>{REGISTER_EVENT_DETAILS.venue}</li>
                    </ul>
                </header>

                <RegistrationForm
                    action={submitRegistration}
                    offer={toRegistrationOffer(pricing)}
                    policy={{ privacy: policy.privacy, items: policy.items, version: policy.version }}
                    preselection={parseRegisterSearchParams(query)}
                />
            </main>
            <Footer section={content.footer} />
        </CmsPage>
    );
};

export default RegisterPage;
