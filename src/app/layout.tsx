import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Brand typeface. Files stay in public/design/fonts; next/font self-hosts them from there.
const campton = localFont({
    variable: "--font-campton",
    display: "swap",
    src: [
        { path: "../../public/design/fonts/Campton-ExtraLight.ttf", weight: "200", style: "normal" },
        { path: "../../public/design/fonts/Campton-Book.ttf", weight: "400", style: "normal" },
        { path: "../../public/design/fonts/Campton-Medium.ttf", weight: "500", style: "normal" },
        { path: "../../public/design/fonts/Campton-Bold.ttf", weight: "700", style: "normal" },
        { path: "../../public/design/fonts/Campton-Black.ttf", weight: "900", style: "normal" },
    ],
});

export const metadata: Metadata = {
    title: "GANZ Conference 2027 - In Our Bodies, Of The Field",
    description:
        "13th National Gestalt Australia & New Zealand Conference. 25-27 June 2027, Griffith University, Gold Coast QLD. Celebrating 30 years of GANZ.",
    icons: {
        icon: "/design/logo/Favicon.png",
    },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html lang="en" className={`${campton.variable} h-full scroll-smooth antialiased`}>
            <body className="flex min-h-full flex-col bg-cream text-teal-dark">{children}</body>
        </html>
    );
}