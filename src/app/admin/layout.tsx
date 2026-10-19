import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
    title: { template: "GANZ 2027 - Admin - %s", default: "GANZ 2027 - Admin" },
    robots: { index: false, follow: false },
};

// layouts don't re-run on client navigation, so each page still calls requireUser itself
const AdminLayout = async ({ children }: LayoutProps<"/admin">) => {
    const user = await requireUser();
    const role = typeof user.app_metadata.role === "string" ? user.app_metadata.role : "none";

    return (
        <div className="flex flex-1 flex-col">
            <AdminHeader email={user.email} role={role} />

            <div className="container-site flex-1 gap-10 py-8 md:grid md:grid-cols-[13rem_1fr] md:py-12">
                <AdminSidebar />
                <main className="mt-6 min-w-0 md:mt-0">{children}</main>
            </div>
        </div>
    );
};

export default AdminLayout;