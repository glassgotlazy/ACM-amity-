import { rest, StorageError } from "./supabase";

/**
 * Email through Resend's HTTP API (no SDK). Optional: with RESEND_API_KEY
 * unset nothing is sent and nothing breaks. All variables are server-only.
 *
 *   RESEND_API_KEY   the API key from resend.com
 *   EMAIL_FROM       e.g. "ACM BuildHub <hello@your-domain>" (a domain
 *                    verified in Resend; resend.dev only reaches your own inbox)
 *   ALERT_EMAIL_TO   comma-separated admin addresses for new-submission alerts
 */

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

const FROM = () => process.env.EMAIL_FROM || "ACM BuildHub <onboarding@resend.dev>";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SendResult = { ok: true } | { ok: false; error: string };

/** Sends one email and says why when it does not go out. Never throws. */
export async function sendEmailDetailed(msg: { to: string[]; subject: string; text: string; replyTo?: string }): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY is not set." };
  const to = msg.to.map((t) => t.trim()).filter((t) => EMAIL.test(t));
  if (to.length === 0) return { ok: false, error: "No valid recipient address." };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM(),
        to,
        subject: msg.subject.slice(0, 200),
        text: msg.text,
        ...(msg.replyTo && EMAIL.test(msg.replyTo) ? { reply_to: msg.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) return { ok: true };
    const raw = await res.text().catch(() => "");
    let message = raw;
    try {
      message = (JSON.parse(raw) as { message?: string }).message ?? raw;
    } catch {}
    const error = `Resend answered ${res.status}: ${message.slice(0, 300)}`;
    console.error(`[email] ${error}`);
    return { ok: false, error };
  } catch (error) {
    console.error("[email] send failed:", error);
    return { ok: false, error: "Could not reach Resend." };
  }
}

export async function sendEmail(msg: { to: string[]; subject: string; text: string; replyTo?: string }): Promise<boolean> {
  return (await sendEmailDetailed(msg)).ok;
}

/**
 * Admin addresses from ALERT_EMAIL_TO. Accepts "a@x.com, b@y.com" and also
 * "Name <a@x.com>" or quoted values, since those are easy to paste by mistake.
 */
export function alertRecipients(): string[] {
  return (process.env.ALERT_EMAIL_TO ?? "")
    .split(/[,;\n]/)
    .map((s) => {
      const t = s.trim().replace(/^["']|["']$/g, "");
      const angle = t.match(/<([^>]+)>/);
      return (angle ? angle[1] : t).trim();
    })
    .filter((s) => EMAIL.test(s));
}

/* -------------------------------------------------------------------------- */
/* Applicant emails. Templates are editable in the admin (Site Settings →     */
/* Emails, table email_templates); these are the defaults.                    */
/* -------------------------------------------------------------------------- */

export const TEMPLATE_KEYS = ["accepted", "declined", "reviewing"] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];
export type Template = { key: TemplateKey; subject: string; body: string };

export const DEFAULT_TEMPLATES: Record<TemplateKey, Template> = {
  accepted: {
    key: "accepted",
    subject: "Your {kind} to {site} was accepted",
    body: "Hi {name},\n\nGood news — your {kind} (“{title}”) has been accepted. Someone from the core team will be in touch about next steps.\n\n— {site}",
  },
  declined: {
    key: "declined",
    subject: "About your {kind} to {site}",
    body: "Hi {name},\n\nThank you for your {kind} (“{title}”). We are not taking it forward this time. That is about fit and timing, not about you — you are welcome to apply again or join another project.\n\n— {site}",
  },
  reviewing: {
    key: "reviewing",
    subject: "We are reviewing your {kind}",
    body: "Hi {name},\n\nThanks for your {kind} (“{title}”). The core team is reviewing it now and will get back to you.\n\n— {site}",
  },
};

export async function loadTemplates(): Promise<Record<TemplateKey, Template>> {
  try {
    const rows = await rest<Template[]>("email_templates?select=key,subject,body");
    const out = { ...DEFAULT_TEMPLATES };
    for (const r of rows) if ((TEMPLATE_KEYS as readonly string[]).includes(r.key)) out[r.key] = r;
    return out;
  } catch (error) {
    if (error instanceof StorageError && error.status === 404) return DEFAULT_TEMPLATES;
    throw error;
  }
}

export function fill(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? vars[k] : m));
}
