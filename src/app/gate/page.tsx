import type { Metadata } from "next";
import Image from "next/image";
import { GateForm } from "@/components/gate/GateForm";

export const metadata: Metadata = {
    title: "GANZ 2027 - Coming Soon",
    robots: { index: false, follow: false },
};

const GatePage = async ({ searchParams }: PageProps<"/gate">) => {
    const { from } = await searchParams;

    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-teal-dark px-6 py-16 text-center text-cream">
            <div className="ring-decor top-1/2 left-1/2 size-160 -translate-x-1/2 -translate-y-1/2 border-teal/25" />
            <div className="ring-decor top-1/2 left-1/2 size-240 -translate-x-1/2 -translate-y-1/2 border-teal/15" />

            <div className="relative flex flex-col items-center">
                <div className="medallion-wrap mb-10">
                    <div className="logo-medallion">
                        <div className="gate-ring" />
                        <Image
                            src="/design/logo/GANZLogo_FullColour.png"
                            alt="GANZ - Gestalt Australia & New Zealand"
                            width={300}
                            height={261}
                            priority
                            className="relative h-auto w-full"
                        />
                    </div>
                </div>

                <h1 className="text-4xl leading-tight font-heading text-gold sm:text-6xl">In Our Bodies, Of The Field</h1>
                <p className="mt-4 max-w-md text-lg text-cream/80">
                    GANZ Conference 2027 is still under construction - check back soon.
                </p>

                <GateForm from={typeof from === "string" ? from : undefined} />
            </div>
        </main>
    );
};

export default GatePage;
