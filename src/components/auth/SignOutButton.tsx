import { signOutAction } from "@/app/login/actions";
import { cn } from "@/lib/utils";

export const SignOutButton = ({ className }: { className?: string }) => {
    return (
        <form action={signOutAction}>
            <button type="submit" className={cn("btn-pill btn-cream", className)}>
                Sign out
            </button>
        </form>
    );
};
