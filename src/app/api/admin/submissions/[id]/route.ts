import { NextResponse } from "next/server";
import { requireAdmin } from "../_auth";
import { updateSubmission, SUBMISSION_STATES, type SubmissionState } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "bad_id" }, { status: 400 });

  let body: { state?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const patch: { state?: SubmissionState; note?: string | null } = {};
  if (body.state !== undefined) {
    if (!(SUBMISSION_STATES as readonly string[]).includes(String(body.state))) {
      return NextResponse.json({ error: "bad_state" }, { status: 400 });
    }
    patch.state = body.state as SubmissionState;
  }
  if (body.note !== undefined) {
    if (body.note !== null && typeof body.note !== "string") {
      return NextResponse.json({ error: "bad_note" }, { status: 400 });
    }
    patch.note = body.note === null ? null : String(body.note).slice(0, 2000);
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "empty_patch" }, { status: 400 });

  try {
    const row = await updateSubmission(id, patch);
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ row });
  } catch (error) {
    console.error("[admin] update failed:", error);
    return NextResponse.json({ error: "storage_failed" }, { status: 502 });
  }
}
