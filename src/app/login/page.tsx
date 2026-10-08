import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
    title: "GANZ 2027 - Admin Login",
    robots: { index: false, follow: false },
};

// already-authed visitors are redirected to /admin by updateSession in src/lib/supabase/middleware.ts
const LoginPage = () => {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-teal-dark px-6 py-16 text-center text-cream">
            <h1 className="text-4xl leading-tight font-heading text-gold sm:text-5xl">Admin login</h1>
            <p className="mt-4 max-w-md text-lg text-cream/80">Sign in to manage the conference site.</p>

            <LoginForm />
        </main>
    );
};

export default LoginPage;
