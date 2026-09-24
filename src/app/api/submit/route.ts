import { NextResponse, after } from "next/server";
import { alertRecipients, sendEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/site";
import { submissionTitle } from "@/lib/submission-types";
import { isStorageConfigured, storeSubmission } from "@/lib/supabase";
import { verifyTurnstile } from "@/lib/turnstile";

/**
 * The single ingress point for every form on the site.
 *
 * The destination lives in FORM_ENDPOINT, a server-only variable, so the
 * endpoint (and any key embedded in it) never reaches the browser. If it is
 * unset the route still answers 200 but reports `delivered: false`, and the
 * confirmation screens say plainly that nothing was stored. The UI is driven
 * by what actually happened, so it cannot claim a submission was received
 * when it was not.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS = ["join", "project-application", "problem-submission", "project-proposal"] as const;
type Kind = (typeof KINDS)[number];

const LABEL: Record<Kind, string> = {
  join: "Membership application",
  "project-application": "Project role application",
  "problem-submission": "Problem submission",
  "project-proposal": "Project proposal",
};

/** Reject anything implausibly large before it reaches the destination. */
const MAX_BYTES = 24_000;
const MAX_FIELD = 4_000;

type Payload = Record<string, string | string[] | boolean>;

function sanitise(payload: Payload) {
  const out: Payload = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "string") out[key] = value.slice(0, MAX_FIELD);
    else if (Array.isArray(value)) out[key] = value.slice(0, 40).map((v) => String(v).slice(0, 200));
    else if (typeof value === "boolean") out[key] = value;
  }
  return out;
}

export async function POST(request: Request) {
  let body: { kind?: string; payload?: Payload; trap?: string; turnstile?: string };

  try {
    const raw = await request.text();
    if (raw.length > MAX_BYTES) {
      return NextResponse.json({ delivered: false, error: "too_large" }, { status: 413 });
    }
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ delivered: false, error: "invalid_json" }, { status: 400 });
  }

  const kind = body.kind as Kind | undefined;
  if (!kind || !KINDS.includes(kind)) {
    return NextResponse.json({ delivered: false, error: "unknown_kind" }, { status: 400 });
  }
  if (!body.payload || typeof body.payload !== "object") {
    return NextResponse.json({ delivered: false, error: "missing_payload" }, { status: 400 });
  }

  // Honeypot: a field no human sees and no human fills. Bots that fill it get
  // a normal-looking success so they do not learn they were filtered.
  if (typeof body.trap === "string" && body.trap.trim() !== "") {
    return NextResponse.json({ delivered: true, mode: "accepted" });
  }

  // Spam check (only when TURNSTILE_SECRET_KEY is set). Checked after the
  // honeypot so bots that fill it still get their fake success.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
  if (!(await verifyTurnstile(body.turnstile, ip))) {
    return NextResponse.json({ delivered: false, error: "verification_failed" }, { status: 400 });
  }

  const clean = sanitise(body.payload);
  const endpoint = process.env.FORM_ENDPOINT;
  const storage = isStorageConfigured();

  if (!endpoint && !storage) {
    return NextResponse.json({ delivered: false, mode: "not-configured" });
  }

  // Two sinks, each optional. Storage is the queue the admin view reads;
  // FORM_ENDPOINT is a copy to an inbox. A submission counts as delivered if
  // at least one configured sink accepted it — a stored application is safe
  // even if the inbox copy bounced.
  let stored = false;
  if (storage) {
    try {
      await storeSubmission(kind, clean, clean.anonymous === true);
      stored = true;
    } catch (error) {
      console.error("[submit] storage failed:", error);
    }
  }

  let forwarded = false;
  if (endpoint) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: `ACM BuildHub — ${LABEL[kind]}`,
          kind,
          receivedAt: new Date().toISOString(),
          ...clean,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (response.ok) forwarded = true;
      else console.error(`[submit] destination returned ${response.status} for ${kind}`);
    } catch (error) {
      // Never echo the destination or the error detail back to the browser.
      console.error("[submit] delivery failed:", error);
    }
  }

  // Tell the core team, after the response has gone out so the student
  // never waits on it. Only when RESEND_API_KEY and ALERT_EMAIL_TO are set.
  const to = alertRecipients();
  if ((stored || forwarded) && !to.length && process.env.RESEND_API_KEY) {
    console.warn("[email] new-submission alert skipped: ALERT_EMAIL_TO has no valid address");
  }
  if ((stored || forwarded) && to.length) {
    after(() =>
      sendEmail({
        to,
        subject: `New ${LABEL[kind].toLowerCase()}: ${submissionTitle({ kind, payload: clean, anonymous: clean.anonymous === true }).slice(0, 80)}`,
        text: `A new ${LABEL[kind].toLowerCase()} arrived on ${SITE_URL}.\n\nOpen the queue: ${SITE_URL}/admin/submissions?kind=${kind}&state=new\n`,
        replyTo: typeof clean.email === "string" && clean.anonymous !== true ? clean.email : undefined,
      }).then((ok) => {
        if (ok) console.log(`[email] new-submission alert sent to ${to.length} address${to.length === 1 ? "" : "es"}`);
      }),
    );
  }

  if (stored || forwarded) {
    return NextResponse.json({ delivered: true, mode: stored ? "stored" : "forwarded" });
  }
  return NextResponse.json({ delivered: false, error: "delivery_failed" }, { status: 502 });
}