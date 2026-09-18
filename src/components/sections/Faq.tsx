import { FAQS } from "@/lib/content/faqs";
import { SectionTag } from "@/components/shared/SectionTag";
import { FaqItem } from "@/components/sections/FaqItem";

export const Faq = () => {
    return (
        <section id="faqs" className="container-site scroll-mt-24 pb-16 md:pb-24">
            <div className="section-panel bg-white">
                <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-20">
                    <div>
                        <SectionTag>FAQs</SectionTag>
                        <h2 className="section-heading mb-6">
                            Questions,
                            <br />
                            answered.
                        </h2>
                        <p className="side-note">
                            Full answers will be published as arrangements are confirmed. Anything else, write to us.
                        </p>
                    </div>

                    <ul className="space-y-4">
                        {FAQS.map((item, index) => (
                            <FaqItem key={item.id} item={item} defaultOpen={index === 0} />
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};