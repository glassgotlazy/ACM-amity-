import { NextResponse } from "next/server";
import { handle, json } from "../../cms/_handle";
import { audit } from "@/lib/audit";
import { CmsError } from "@/lib/cms/write";
import { STATE_LABEL, SUBMISSION_STATES, submissionTitle, type SubmissionState } from "@/lib/submission-types";
import { StaleSubmission, deleteSubmission, getSubmission, updateSubmission } from "@/lib/submissions-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Params = { params: Promise<{ id: string }> };

async function idOf(params: Params["params"]) {
  const { id } = await params;
  if (!UUID.test(id)) throw new CmsError(400, "bad_id");
  return id;
}

/** The current row, always read fresh — the detail view opens with this. */
export async function GET(request: Request, { params }: Params) {
  return handle(request, "submissions:read", async () => {
    const row = await getSubmission(await idOf(params));
    if (!row) throw new CmsError(404, "not_found");
    return { row };
  });
}

/**
 * Body: { state?, note?, expected_updated_at? }. With expected_updated_at
 * (string, or null for a never-edited row) a concurrent edit is refused with
 * 409 and the current row, instead of being overwritten.
 */
export async function PATCH(request: Request, { params }: Params) {
  return handle(request, "submissions:write", async (session) => {
    const id = await idOf(params);
    const body = (await json(request)) as { state?: unknown; note?: unknown; expected_updated_at?: unknown };
    if (!body || typeof body !== "object") throw new CmsError(400, "invalid_body");

    const patch: { state?: SubmissionState; note?: string | null } = {};
    if (body.state !== undefined) {
      if (!(SUBMISSION_STATES as readonly string[]).includes(String(body.state))) throw new CmsError(400, "bad_state");
      patch.state = body.state as SubmissionState;
    }
    if (body.note !== undefined) {
      if (body.note !== null && typeof body.note !== "string") throw new CmsError(400, "bad_note");
      patch.note = body.note === null ? null : String(body.note).slice(0, 2000);
    }
    if (Object.keys(patch).length === 0) throw new CmsError(400, "empty_patch");

    const e = body.expected_updated_at;
    if (e !== undefined && e !== null && (typeof e !== "string" || e.length > 64)) throw new CmsError(400, "bad_version");
    const expected = e === undefined ? undefined : (e as string | null);

    try {
      const result = await updateSubmission(id, patch, expected);
      if (!result) throw new CmsError(404, "not_found");
      const { row, before } = result;
      if (patch.state && patch.state !== before.state) {
        await audit({
          actor: session.actor,
          action: "status",
          entity: "submission",
          entity_id: id,
          summary: `“${submissionTitle(row).slice(0, 80)}”: ${STATE_LABEL[before.state]} → ${STATE_LABEL[patch.state]}`,
        });
      } else if (patch.note !== undefined && patch.note !== before.note) {
        await audit({ actor: session.actor, action: "update", entity: "submission", entity_id: id, summary: `Edited the note on “${submissionTitle(row).slice(0, 80)}”` });
      }
      return { row };
    } catch (error) {
      if (error instanceof StaleSubmission) {
        return NextResponse.json({ error: "stale", current: error.current }, { status: 409 });
      }
      throw error;
    }
  });
}

export async function DELETE(request: Request, { params }: Params) {
  return handle(request, "submissions:write", async (session) => {
    const id = await idOf(params);
    const removed = await deleteSubmission(id);
    if (!removed) throw new CmsError(404, "not_found");
    await audit({ actor: session.actor, action: "delete", entity: "submission", entity_id: id, summary: `Deleted submission “${submissionTitle(removed).slice(0, 80)}”` });
  });
}
