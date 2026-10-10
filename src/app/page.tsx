import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Welcome } from "@/components/sections/Welcome";
import { Program } from "@/components/sections/Program";
import { Keynotes } from "@/components/sections/Keynotes";
import { Registrations } from "@/components/sections/Registrations";
import { Location } from "@/components/sections/Location";
import { Accommodation } from "@/components/sections/Accommodation";
import { Sponsors } from "@/components/sections/Sponsors";
import { Committee } from "@/components/sections/Committee";
import { Faq } from "@/components/sections/Faq";
import { Contact } from "@/components/sections/Contact";
import { GateLogoutButton } from "@/components/gate/GateLogoutButton";
import { CmsEditorProvider } from "@/components/cms/CmsEditorProvider";
import { AdminBar } from "@/components/cms/AdminBar";
import { getPageContent } from "@/lib/content/getPageContent";
import { isCmsEditor } from "@/lib/cms/editor";

const Home = async () => {
    // each section renders nothing when its content is missing (e.g. unpublished in the CMS)
    const [content, isEditor] = await Promise.all([getPageContent(), isCmsEditor()]);

    const page = (
        <>
            <Navbar />
            <main className="flex-1">
                <Hero section={content.hero} />
                <Welcome section={content.welcome} />
                <Program section={content.program} />
                <Keynotes section={content.keynotes} />
                <Registrations section={content.registrations} />
                <Location section={content.location} />
                <Accommodation section={content.accommodation} />
                <Sponsors section={content.sponsors} />
                <Committee section={content.committee} />
                <Faq section={content.faqs} />
                <Contact section={content.contact} />
                <GateLogoutButton />
            </main>
            <Footer />
        </>
    );

    // admins get the inline editor; visitors never receive its provider or toolbar
    if (!isEditor) return page;

    return (
        <CmsEditorProvider>
            {page}
            <AdminBar />
        </CmsEditorProvider>
    );
};

export default Home;