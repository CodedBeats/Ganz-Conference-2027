import { SectionTag } from "@/components/shared/SectionTag";
import Image from "next/image";

export const Accommodation = () => {
    return (
        <section
            id="accommodation"
            className="section-block-b container-site scroll-mt-24"
        >
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,32rem)_1fr] lg:gap-20">
                <div>
                    <SectionTag>Accommodation</SectionTag>
                    <h2 className="section-heading mb-5">Where to stay</h2>
                    <p className="body-copy mb-2 sm:mb-8">
                        We are securing a selection of accommodation options
                        close to the Griffith University Gold Coast campus,
                        across a range of price points. Details will be
                        published here.
                    </p>
                    <span className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-xs font-medium tracking-[0.15em] uppercase btn-muted">
                        Details to be confirmed
                    </span>
                </div>

                <div className="hover-grow relative aspect-5/4 w-full">
                    <Image
                        src="/design/imgs/accommodation.jpg"
                        alt="Gold Coast Accommodation - Copyright free"
                        fill
                        className="rounded-3xl object-cover shadow-lg shadow-teal-dark/10"
                    />
                </div>
            </div>
        </section>
    );
};
