import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";

interface AdminHeaderProps {
    email: string | undefined;
    role: string;
}

export const AdminHeader = ({ email, role }: AdminHeaderProps) => {
    return (
        <header className="sticky top-0 z-10 bg-teal-dark text-cream">
            {/* one line from md up keeps the height fixed - AdminSidebar's sticky offset and the
                sections' scroll-mt both assume it */}
            <div className="container-site flex flex-wrap items-center justify-between gap-x-6 gap-y-4 py-5 md:flex-nowrap">
                <div className="shrink-0">
                    <span className="eyebrow mb-1 text-gold">Admin</span>
                    <p className="text-2xl leading-tight font-heading">GANZ 2027 Dashboard</p>
                </div>

                <div className="flex min-w-0 flex-wrap items-center gap-3 md:flex-nowrap">
                    <p className="flex min-w-0 flex-wrap items-center gap-3 text-cream/80 md:flex-nowrap">
                        <span className="truncate font-medium text-cream">{email}</span>
                        <span className="eyebrow shrink-0 rounded-full bg-cream/10 px-3 py-1 text-gold">{role}</span>
                    </p>
                    {/* only the email gives way when space runs out */}
                    <Link href="/" className="btn-pill btn-gold shrink-0 whitespace-nowrap">
                        View site →
                    </Link>
                    <SignOutButton className="whitespace-nowrap" />
                </div>
            </div>
        </header>
    );
};