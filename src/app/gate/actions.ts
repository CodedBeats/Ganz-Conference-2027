"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GATE_COOKIE_MAX_AGE, GATE_COOKIE_NAME, getExpectedGateToken, isCorrectPassword } from "@/lib/gate";

export type GateActionState = { error: string | null };

export async function loginAction(_prevState: GateActionState, formData: FormData): Promise<GateActionState> {
    const password = String(formData.get("password") ?? "");
    const from = String(formData.get("from") ?? "");

    if (!isCorrectPassword(password)) {
        return { error: "Incorrect password. Please try again." };
    }

    const token = getExpectedGateToken();
    if (token) {
        (await cookies()).set(GATE_COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: GATE_COOKIE_MAX_AGE,
        });
    }

    redirect(from && from.startsWith("/") && from !== "/gate" ? from : "/");
}

export async function logoutAction(): Promise<void> {
    (await cookies()).delete(GATE_COOKIE_NAME);
    redirect("/gate");
}
