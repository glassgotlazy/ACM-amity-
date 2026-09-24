import { audit } from "@/lib/audit";
import { CmsError } from "@/lib/cms/write";
import { DEFAULT_TEMPLATES, TEMPLATE_KEYS, emailConfigured, loadTemplates, type TemplateKey } from "@/lib/email";
import { rest, StorageError } from "@/lib/supabase";
import { handle, json } from "../_handle";

export const dynamic = "force-dynamic";

/** The applicant email templates, plus whether sending is configured. */
export async function GET(req: Request) {
  return handle(req, "settings:write", async () => ({
    templates: await loadTemplates(),
    defaults: DEFAULT_TEMPLATES,
    configured: emailConfigured(),
    alerts: Boolean(process.env.ALERT_EMAIL_TO),
  }));
}

/** Body: { key, subject, body }. Placeholders: {name} {kind} {title} {site}. */
export async function PUT(req: Request) {
  return handle(req, "settings:write", async (session) => {
    const b = (await json(req)) as { key?: unknown; subject?: unknown; body?: unknown };
    if (!(TEMPLATE_KEYS as readonly string[]).includes(String(b?.key))) throw new CmsError(400, "bad_key");
    const errors: Record<string, string> = {};
    const subject = typeof b.subject === "string" ? b.subject.trim() : "";
    const body = typeof b.body === "string" ? b.body.replace(/\r\n/g, "\n").trim() : "";
    if (!subject) errors.subject = "Required.";
    if (subject.length > 200) errors.subject = "Keep this under 200 characters.";
    if (!body) errors.body = "Required.";
    if (body.length > 4000) errors.body = "Keep this under 4000 characters.";
    if (Object.keys(errors).length) throw new CmsError(422, "invalid", errors);
    try {
      await rest("email_templates?on_conflict=key", {
        method: "POST",
        body: JSON.stringify({ key: b.key, subject, body, updated_at: new Date().toISOString() }),
        prefer: "resolution=merge-duplicates",
      });
    } catch (error) {
      if (error instanceof StorageError && error.status === 404) throw new CmsError(409, "v3_missing");
      throw error;
    }
    await audit({ actor: session.actor, action: "update", entity: "email_template", entity_id: String(b.key), summary: `Updated the “${b.key as TemplateKey}” email` });
    return { ok: true };
  });
}
