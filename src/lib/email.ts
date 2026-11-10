/** Resend's send endpoint. We call it with `fetch` directly rather than pulling in the SDK. */
export const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Which set of Resend credentials to use.
 *
 * @remarks
 * `main` covers local dev and Vercel previews (staging); `prod` is only the Vercel Production deployment.
 */
export type EmailTier = "main" | "prod";

/** Everything needed to send mail from the current environment. */
export interface EmailConfig {
    tier: EmailTier;
    apiKey: string;
    /** Display name + address, e.g. `GANZ Conference 2027 <registration@ganzconference2027.com.au>`. */
    from: string;
    /** Where replies go by default. */
    replyTo: string;
    /** Inbox for internal notifications, when set. */
    adminAlertEmail: string | null;
}

/** One outgoing email. `from` always comes from {@link EmailConfig}, so only verified-domain senders are possible. */
export interface EmailMessage {
    to: string | string[];
    subject: string;
    text: string;
    html?: string;
    /** Overrides the environment's default reply-to. */
    replyTo?: string;
}

export interface SendEmailResult {
    /** Resend's message id - search for it in the Resend dashboard's Emails log. */
    id: string;
}

type EnvSource = Record<string, string | undefined>;

/** Resend (or the network) refused the email. */
export class EmailSendError extends Error {
    /** HTTP status from Resend, or `0` when the request never got a response. */
    readonly status: number;
    /** Resend's error name (e.g. `validation_error`, `restricted_api_key`), when it gave one. */
    readonly code: string | null;

    constructor(message: string, status: number, code: string | null) {
        super(message);
        this.name = "EmailSendError";
        this.status = status;
        this.code = code;
    }
}

/**
 * Works out which Resend credentials this deployment should use.
 *
 * @remarks
 * Keyed off `VERCEL_ENV`, which Vercel sets to `production` only on the Production Branch (`prod`).
 * Locally it's unset, so local dev and previews share the MAIN key and never touch the PROD one.
 */
export function getEmailTier(env: EnvSource = process.env): EmailTier {
    return env.VERCEL_ENV === "production" ? "prod" : "main";
}

/**
 * Reads the email settings for the current environment.
 *
 * @remarks
 * Throws one error that lists every missing variable instead of failing on the first, so a
 * misconfigured Vercel environment can be fixed in one go.
 *
 * @param env - Defaults to `process.env`; tests pass their own.
 * @throws Error if any required variable for the tier is missing or blank.
 */
export function getEmailConfig(env: EnvSource = process.env): EmailConfig {
    const tier = getEmailTier(env);
    const suffix = tier === "prod" ? "PROD" : "MAIN";
    const names = {
        apiKey: `RESEND_API_KEY_${suffix}`,
        from: "EMAIL_FROM",
        replyTo: `EMAIL_REPLY_TO_${suffix}`,
    };

    const read = (name: string) => env[name]?.trim() || null;
    const missing = Object.values(names).filter((name) => !read(name));
    if (missing.length > 0) {
        throw new Error(`Email isn't configured for "${tier}": missing ${missing.join(", ")}.`);
    }

    return {
        tier,
        apiKey: read(names.apiKey)!,
        from: read(names.from)!,
        replyTo: read(names.replyTo)!,
        adminAlertEmail: read("ADMIN_ALERT_EMAIL"),
    };
}

/** The error body Resend returns, e.g. `{ statusCode: 403, name: "validation_error", message: "..." }`. */
interface ResendErrorBody {
    name?: string;
    message?: string;
}

/**
 * Sends one email through Resend. Server-side only - it needs the secret API key.
 *
 * @param message - What to send and to whom.
 * @param config - Defaults to {@link getEmailConfig} for the current environment.
 * @returns Resend's message id.
 * @throws {@link EmailSendError} if Resend rejects the email or can't be reached.
 */
export async function sendEmail(
    message: EmailMessage,
    config: EmailConfig = getEmailConfig(),
): Promise<SendEmailResult> {
    let response: Response;
    try {
        response = await fetch(RESEND_API_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${config.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: config.from,
                to: Array.isArray(message.to) ? message.to : [message.to],
                reply_to: message.replyTo ?? config.replyTo,
                subject: message.subject,
                text: message.text,
                ...(message.html ? { html: message.html } : {}),
            }),
        });
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new EmailSendError(`Couldn't reach Resend: ${reason}`, 0, null);
    }

    // Resend always answers with JSON, but a proxy or outage page might not.
    const body: unknown = await response.json().catch(() => null);

    if (response.ok && typeof body === "object" && body !== null && "id" in body && typeof body.id === "string") {
        return { id: body.id };
    }

    const errorBody = (typeof body === "object" && body !== null ? body : {}) as ResendErrorBody;
    throw new EmailSendError(
        errorBody.message ?? `Resend responded with HTTP ${response.status}.`,
        response.status,
        errorBody.name ?? null,
    );
}