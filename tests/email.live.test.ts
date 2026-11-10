// @vitest-environment node
/**
 * Live checks against the real Resend API, using the keys in `.env.local`.
 *
 * Skipped in normal runs. Run with `npm run test:email` (sets Vitest's mode to `live`).
 * Mail goes to Resend's `delivered@resend.dev` sandbox inbox, so nothing lands in a real
 * inbox, but each send still counts towards the Resend quota.
 */
import { describe, expect, it } from "vitest";
import { loadEnv } from "vite";
import { EmailSendError, getEmailConfig, sendEmail } from "../src/lib/email";

const isLive = import.meta.env.MODE === "live";
const env = isLive ? loadEnv("live", process.cwd(), "") : {};

/** Resend's test address that always accepts delivery. */
const SANDBOX_TO = "delivered@resend.dev";

describe.runIf(isLive)("Resend (live)", () => {
    it.each([
        ["main", undefined],
        ["prod", "production"],
    ])("sends from the verified domain with the %s key", async (tier, VERCEL_ENV) => {
        const config = getEmailConfig({ ...env, VERCEL_ENV });
        expect(config.tier).toBe(tier);
        expect(config.from).toMatch(/@ganzconference2027\.com\.au>?$/);

        const result = await sendEmail(
            {
                to: SANDBOX_TO,
                subject: `GANZ 2027 live test (${tier})`,
                text: `Automated Vitest check with the ${tier} key at ${new Date().toISOString()}.`,
            },
            config,
        );

        expect(result.id).toEqual(expect.any(String));
    });

    it("rejects a sender outside the verified domain", async () => {
        const config = { ...getEmailConfig(env), from: "Not Us <test@example.com>" };

        const error = await sendEmail({ to: SANDBOX_TO, subject: "Should not send", text: "-" }, config).catch((e) => e);

        expect(error).toBeInstanceOf(EmailSendError);
        expect(error.status).toBe(403);
    });

    it("rejects an invalid API key", async () => {
        const config = { ...getEmailConfig(env), apiKey: "re_not_a_real_key" };

        const error = await sendEmail({ to: SANDBOX_TO, subject: "Should not send", text: "-" }, config).catch((e) => e);

        expect(error).toBeInstanceOf(EmailSendError);
        expect([400, 401, 403]).toContain(error.status);
    });
});