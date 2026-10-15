import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ADMIN_HOME_PATH } from "@/lib/supabase/middleware";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
    title: "GANZ 2027 - Admin Login",
    robots: { index: false, follow: false },
};

// Checked here with the verified user rather than in the proxy - a revoked session still has a
// validly signed token, and redirecting on that would loop with /admin's own check.
const LoginPage = async () => {
    if (await getCurrentUser()) redirect(ADMIN_HOME_PATH);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-teal-dark px-6 py-16 text-center text-cream">
            <h1 className="text-4xl leading-tight font-heading text-gold sm:text-5xl">Admin login</h1>
            <p className="mt-4 max-w-md text-lg text-cream/80">Sign in to manage the conference site.</p>

            <LoginForm />
        </main>
    );
};

export default LoginPage;
