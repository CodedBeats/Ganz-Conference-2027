// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { EmailSendError, RESEND_API_URL, getEmailConfig, getEmailTier, sendEmail, type EmailConfig } from "../src/lib/email";

const FROM = "GANZ Conference 2027 <registration@ganzconference2027.com.au>";

const baseEnv = {
    RESEND_API_KEY_MAIN: "re_main_key",
    RESEND_API_KEY_PROD: "re_prod_key",
    EMAIL_FROM: FROM,
    EMAIL_REPLY_TO_MAIN: "main-replies@example.com",
    EMAIL_REPLY_TO_PROD: "prod-replies@example.com",
    ADMIN_ALERT_EMAIL: "alerts@example.com",
};

const config: EmailConfig = {
    tier: "main",
    apiKey: "re_main_key",
    from: FROM,
    replyTo: "main-replies@example.com",
    adminAlertEmail: null,
};

const mockFetch = (status: number, body: unknown) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
};

/** The parsed JSON body of the first `fetch` call. */
const sentBody = (fetchMock: ReturnType<typeof vi.fn>) => JSON.parse(fetchMock.mock.calls[0][1].body);

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("getEmailTier", () => {
    it("only uses prod on Vercel's Production deployment", () => {
        expect(getEmailTier({ VERCEL_ENV: "production" })).toBe("prod");
        expect(getEmailTier({ VERCEL_ENV: "preview" })).toBe("main");
        expect(getEmailTier({ VERCEL_ENV: "development" })).toBe("main");
        expect(getEmailTier({})).toBe("main");
    });
});

describe("getEmailConfig", () => {
    it("uses the MAIN key and reply-to locally and on previews", () => {
        for (const VERCEL_ENV of [undefined, "preview"]) {
            expect(getEmailConfig({ ...baseEnv, VERCEL_ENV })).toEqual({
                tier: "main",
                apiKey: "re_main_key",
                from: FROM,
                replyTo: "main-replies@example.com",
                adminAlertEmail: "alerts@example.com",
            });
        }
    });

    it("uses the PROD key and reply-to in production", () => {
        expect(getEmailConfig({ ...baseEnv, VERCEL_ENV: "production" })).toMatchObject({
            tier: "prod",
            apiKey: "re_prod_key",
            replyTo: "prod-replies@example.com",
        });
    });

    it("never falls back to the other tier's key", () => {
        expect(() => getEmailConfig({ ...baseEnv, RESEND_API_KEY_PROD: undefined, VERCEL_ENV: "production" })).toThrow(
            "RESEND_API_KEY_PROD",
        );
        expect(() => getEmailConfig({ ...baseEnv, RESEND_API_KEY_MAIN: undefined })).toThrow("RESEND_API_KEY_MAIN");
    });

    it("lists every missing variable at once and treats blanks as missing", () => {
        expect(() => getEmailConfig({ RESEND_API_KEY_MAIN: "   " })).toThrow(
            'Email isn\'t configured for "main": missing RESEND_API_KEY_MAIN, EMAIL_FROM, EMAIL_REPLY_TO_MAIN.',
        );
    });

    it("trims values and treats the admin alert address as optional", () => {
        expect(getEmailConfig({ ...baseEnv, ADMIN_ALERT_EMAIL: undefined, EMAIL_FROM: `  ${FROM}  ` })).toMatchObject({
            from: FROM,
            adminAlertEmail: null,
        });
    });
});

describe("sendEmail", () => {
    it("posts to Resend with the key, verified sender and default reply-to", async () => {
        const fetchMock = mockFetch(200, { id: "email_123" });

        await expect(sendEmail({ to: "someone@example.com", subject: "Hi", text: "Hello" }, config)).resolves.toEqual({
            id: "email_123",
        });

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe(RESEND_API_URL);
        expect(init.method).toBe("POST");
        expect(init.headers).toEqual({ Authorization: "Bearer re_main_key", "Content-Type": "application/json" });
        expect(sentBody(fetchMock)).toEqual({
            from: FROM,
            to: ["someone@example.com"],
            reply_to: "main-replies@example.com",
            subject: "Hi",
            text: "Hello",
        });
    });

    it("passes through multiple recipients, a reply-to override and html", async () => {
        const fetchMock = mockFetch(200, { id: "email_456" });

        await sendEmail(
            { to: ["a@example.com", "b@example.com"], subject: "Hi", text: "Hello", html: "<p>Hello</p>", replyTo: "other@example.com" },
            config,
        );

        expect(sentBody(fetchMock)).toMatchObject({
            to: ["a@example.com", "b@example.com"],
            reply_to: "other@example.com",
            html: "<p>Hello</p>",
        });
    });

    it("surfaces Resend's error name and message", async () => {
        mockFetch(403, { statusCode: 403, name: "validation_error", message: "The domain is not verified." });

        const error = await sendEmail({ to: "a@example.com", subject: "Hi", text: "Hello" }, config).catch((e) => e);

        expect(error).toBeInstanceOf(EmailSendError);
        expect(error).toMatchObject({ status: 403, code: "validation_error", message: "The domain is not verified." });
    });

    it("handles non-JSON error responses", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>Bad gateway</html>", { status: 502 })));

        await expect(sendEmail({ to: "a@example.com", subject: "Hi", text: "Hello" }, config)).rejects.toMatchObject({
            status: 502,
            code: null,
            message: "Resend responded with HTTP 502.",
        });
    });

    it("treats a 200 without an id as a failure", async () => {
        mockFetch(200, {});

        await expect(sendEmail({ to: "a@example.com", subject: "Hi", text: "Hello" }, config)).rejects.toBeInstanceOf(
            EmailSendError,
        );
    });

    it("wraps network failures", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

        await expect(sendEmail({ to: "a@example.com", subject: "Hi", text: "Hello" }, config)).rejects.toMatchObject({
            status: 0,
            message: "Couldn't reach Resend: fetch failed",
        });
    });
});