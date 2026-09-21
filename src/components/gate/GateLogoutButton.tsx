import { logoutAction } from "@/app/gate/actions";

export const GateLogoutButton = () => {
    return (
        <form action={logoutAction} className="container-site flex justify-center pb-10">
            <button
                type="submit"
                className="text-xs font-medium tracking-wide text-teal-dark/40 underline decoration-dotted underline-offset-4 transition-colors hover:text-teal-dark/70"
            >
                Remove access (dev only)
            </button>
        </form>
    );
};
