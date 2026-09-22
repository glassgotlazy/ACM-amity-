import { NextResponse } from "next/server";
import { requireAdmin } from "./_auth";
import { listSubmissions, SUBMISSION_STATES, type SubmissionKind, type SubmissionState } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS = new Set(["join", "project-application", "problem-submission", "project-proposal"]);

export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const state = url.searchParams.get("state");
  const filter: { kind?: SubmissionKind; state?: SubmissionState } = {};
  if (kind && KINDS.has(kind)) filter.kind = kind as SubmissionKind;
  if (state && (SUBMISSION_STATES as readonly string[]).includes(state)) filter.state = state as SubmissionState;

  try {
    return NextResponse.json({ rows: await listSubmissions(filter) });
  } catch (error) {
    console.error("[admin] list failed:", error);
    return NextResponse.json({ error: "storage_failed" }, { status: 502 });
  }
}
