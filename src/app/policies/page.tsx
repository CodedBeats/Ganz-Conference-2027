import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Policies } from "@/components/sections/Policies";
import { CmsPage } from "@/components/cms/CmsPage";
import { getPageContent } from "@/lib/content/getPageContent";
import { getRegisterCta } from "@/lib/content/site";

export const metadata: Metadata = {
    title: "Terms & Policies - GANZ Conference 2027",
};

const PoliciesPage = async () => {
    // the navbar and footer need the home page's content too, so this loads the same sections
    const content = await getPageContent();

    return (
        <CmsPage>
            <Navbar registerCta={getRegisterCta(content.registrations)} />
            <main className="flex-1">
                <Policies section={content.policies} />
            </main>
            <Footer section={content.footer} />
        </CmsPage>
    );
};

export default PoliciesPage;