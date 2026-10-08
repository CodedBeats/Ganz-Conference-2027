"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_HOME_PATH } from "@/lib/supabase/middleware";
import { handleError } from "@/lib/errors";

export type LoginActionState = { error: string | null };

export async function loginAction(_prevState: LoginActionState, formData: FormData): Promise<LoginActionState> {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return { error: handleError(error, "login").message };

    console.log(`[auth] signed in as ${data.user.email}`);

    // outside any try/catch - redirect() works by throwing
    redirect(ADMIN_HOME_PATH);
}

export async function signOutAction(): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    // still redirect on failure - the proxy sends them back to /admin if the session survived
    if (error) handleError(error, "sign-out");
    else console.log("[auth] signed out");

    redirect("/login");
}
