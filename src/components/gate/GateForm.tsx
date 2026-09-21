"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { loginAction } from "@/app/gate/actions";

export const GateForm = ({ from }: { from?: string }) => {
    const [state, formAction, isPending] = useActionState(loginAction, { error: null });
    const [showPassword, setShowPassword] = useState(false);

    return (
        <form action={formAction} className="mx-auto mt-10 flex w-full max-w-sm flex-col items-center gap-4">
            <input type="hidden" name="from" value={from ?? ""} />

            <div className="relative w-full">
                <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    autoFocus
                    placeholder="Password"
                    className="w-full rounded-full border border-cream/30 bg-cream/10 px-6 py-3.5 text-center text-base text-cream placeholder:text-cream/50 focus:border-gold focus:outline-none"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute top-1/2 right-5 -translate-y-1/2 text-cream/60 transition-colors hover:text-cream"
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>

            {state.error && (
                <p role="alert" className="text-sm font-medium text-gold">
                    {state.error}
                </p>
            )}

            <button type="submit" disabled={isPending} className="btn-pill btn-gold-to-cream">
                {isPending ? "Checking…" : "Enter site"}
            </button>
        </form>
    );
};
