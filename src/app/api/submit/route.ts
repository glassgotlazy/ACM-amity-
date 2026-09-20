import { NextResponse } from "next/server";

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
  let body: { kind?: string; payload?: Payload; trap?: string };

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

  const endpoint = process.env.FORM_ENDPOINT;
  if (!endpoint) {
    return NextResponse.json({ delivered: false, mode: "not-configured" });
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: `ACM BuildHub — ${LABEL[kind]}`,
        kind,
        receivedAt: new Date().toISOString(),
        ...sanitise(body.payload),
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(`[submit] destination returned ${response.status} for ${kind}`);
      return NextResponse.json({ delivered: false, error: "destination_failed" }, { status: 502 });
    }

    return NextResponse.json({ delivered: true, mode: "forwarded" });
  } catch (error) {
    // Never echo the destination or the error detail back to the browser.
    console.error("[submit] delivery failed:", error);
    return NextResponse.json({ delivered: false, error: "delivery_failed" }, { status: 502 });
  }
}
