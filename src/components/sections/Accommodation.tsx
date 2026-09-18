import { SectionTag } from "@/components/shared/SectionTag";
import { PlaceholderBox } from "@/components/shared/PlaceholderBox";

export const Accommodation = () => {
    return (
        <section id="accommodation" className="container-site scroll-mt-24 pb-16 md:pb-24">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,32rem)_1fr] lg:gap-20">
                <div>
                    <SectionTag>Accommodation</SectionTag>
                    <h2 className="section-heading mb-5">Where to stay</h2>
                    <p className="body-copy mb-8">
                        We are securing a selection of accommodation options close to the Griffith University Gold
                        Coast campus, across a range of price points. Details will be published here.
                    </p>
                    <span className="btn-pill btn-muted hover:translate-y-0">Details to be confirmed</span>
                </div>

                <div>
                    <PlaceholderBox className="hover-grow aspect-5/4 w-full rounded-3xl shadow-lg shadow-teal-dark/10" />
                    <span className="caption-mono">Image - Gold Coast / campus surrounds</span>
                </div>
            </div>
        </section>
    );
};