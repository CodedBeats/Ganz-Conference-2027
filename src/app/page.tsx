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

const Home = () => {
    return (
        <>
            <Navbar />
            <main className="flex-1">
                <Hero />
                <Welcome />
                <Program />
                <Keynotes />
                <Registrations />
                <Location />
                <Accommodation />
                <Sponsors />
                <Committee />
                <Faq />
                <Contact />
            </main>
            <Footer />
        </>
    );
};

export default Home;