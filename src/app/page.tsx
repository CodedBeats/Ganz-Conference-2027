import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Welcome } from "@/components/sections/Welcome";
import { Program } from "@/components/sections/Program";
import { Keynotes } from "@/components/sections/Keynotes";
import { Workshop } from "@/components/sections/Workshop";
import { Registrations } from "@/components/sections/Registrations";
import { Submissions } from "@/components/sections/Submissions";
import { Location } from "@/components/sections/Location";
import { Accommodation } from "@/components/sections/Accommodation";
import { Sponsors } from "@/components/sections/Sponsors";
import { Committee } from "@/components/sections/Committee";
import { Faq } from "@/components/sections/Faq";
import { Contact } from "@/components/sections/Contact";
import { GateLogoutButton } from "@/components/gate/GateLogoutButton";
import { SharePrompt } from "@/components/shared/SharePrompt";
import { CmsPage } from "@/components/cms/CmsPage";
import { getPageContent } from "@/lib/content/getPageContent";
import { getRegisterCta } from "@/lib/content/site";

const Home = async () => {
    // each section renders nothing when its content is missing (e.g. unpublished in the CMS)
    const content = await getPageContent();
    const registerCta = getRegisterCta(content.registrations);

    return (
        <CmsPage>
            <Navbar registerCta={registerCta} />
            <main className="flex-1">
                <Hero section={content.hero} hasSubmissions={Boolean(content.submissions)} registerCta={registerCta} />
                <Welcome section={content.welcome} />
                <Program section={content.program} />
                <Keynotes section={content.keynotes} />
                <SharePrompt />
                <Workshop section={content.workshop} />
                <Registrations section={content.registrations} registerCta={registerCta} />
                <Submissions section={content.submissions} />
                <Location section={content.location} />
                <Accommodation section={content.accommodation} />
                <Sponsors section={content.sponsors} />
                <Committee section={content.committee} />
                <Faq section={content.faqs} />
                <Contact section={content.contact} />
                <GateLogoutButton />
            </main>
            <Footer section={content.footer} />
        </CmsPage>
    );
};

export default Home;