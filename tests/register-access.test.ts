// @vitest-environment node
/**
 * `/register` is admin-only while GANZ test it: the page guard (`requireAdmin`) and the submit
 * action's own check.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";

const mocks = vi.hoisted(() => ({
    getUser: vi.fn(),
    redirect: vi.fn((path: string) => {
        throw new Error(`redirect:${path}`);
    }),
    notFound: vi.fn(() => {
        throw new Error("notFound");
    }),
    checkRateLimit: vi.fn(),
    getPageContent: vi.fn(),
    getPricing: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect, notFound: mocks.notFound }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock("@/lib/registration/rateLimit.server", () => ({ checkRateLimit: mocks.checkRateLimit }));
vi.mock("@/lib/content/getPageContent", () => ({ getPageContent: mocks.getPageContent }));
vi.mock("@/lib/registration/queries.server", () => ({ getPricing: mocks.getPricing }));

import { requireAdmin } from "../src/lib/auth";
import { submitRegistration } from "../src/app/register/actions";

const signedInAs = (role: string | undefined) =>
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1", email: "someone@example.com", app_metadata: { role } } as Partial<User> } });
const signedOut = () => mocks.getUser.mockResolvedValue({ data: { user: null } });

beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
});

describe("requireAdmin", () => {
    it("sends signed-out visitors to /login", async () => {
        signedOut();
        await expect(requireAdmin()).rejects.toThrow("redirect:/login");
    });

    it("gives a signed-in non-admin a 404", async () => {
        signedInAs(undefined);
        await expect(requireAdmin()).rejects.toThrow("notFound");
    });

    it("lets the admin through", async () => {
        signedInAs("admin");
        await expect(requireAdmin()).resolves.toMatchObject({ id: "user-1" });
    });
});

describe("submitRegistration access", () => {
    it.each([
        ["a signed-out caller", signedOut],
        ["a signed-in non-admin", () => signedInAs("editor")],
    ])("refuses %s before doing any work", async (_label, signIn) => {
        signIn();
        const result = await submitRegistration({ status: "idle" }, new FormData());

        expect(result).toEqual({ status: "invalid", fieldErrors: { form: [expect.stringContaining("isn't open yet")] } });
        expect(mocks.checkRateLimit).not.toHaveBeenCalled();
        expect(mocks.getPricing).not.toHaveBeenCalled();
    });

    it("lets the admin through to validation", async () => {
        signedInAs("admin");
        mocks.checkRateLimit.mockResolvedValue(true);

        const result = await submitRegistration({ status: "idle" }, new FormData());
        expect(mocks.checkRateLimit).toHaveBeenCalledWith("register");
        expect(result.status).toBe("invalid");
        expect(result.status === "invalid" && result.fieldErrors.form).toBeUndefined();
    });
});