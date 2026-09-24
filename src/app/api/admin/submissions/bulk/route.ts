import { handle, json } from "../../cms/_handle";
import { audit } from "@/lib/audit";
import { CmsError } from "@/lib/cms/write";
import { STATE_LABEL, SUBMISSION_STATES, type SubmissionState } from "@/lib/submission-types";
import { bulkDelete, bulkSetState } from "@/lib/submissions-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX = 100;

/**
 * Body: { ids: uuid[], action: "state", state } or { ids, action: "delete" }.
 * Bulk status changes never email applicants — that stays a one-by-one choice.
 */
export async function POST(request: Request) {
  return handle(request, "submissions:write", async (session) => {
    const body = (await json(request)) as { ids?: unknown; action?: unknown; state?: unknown };
    const ids = Array.isArray(body?.ids) ? [...new Set(body.ids)] : [];
    if (!ids.length || ids.length > MAX || ids.some((id) => typeof id !== "string" || !UUID.test(id))) {
      throw new CmsError(400, "bad_ids");
    }
    const list = ids as string[];

    if (body.action === "delete") {
      const removed = await bulkDelete(list);
      await audit({ actor: session.actor, action: "delete", entity: "submission", summary: `Deleted ${removed.length} submission${removed.length === 1 ? "" : "s"} at once` });
      return { count: removed.length };
    }
    if (body.action === "state") {
      if (!(SUBMISSION_STATES as readonly string[]).includes(String(body.state))) throw new CmsError(400, "bad_state");
      const state = body.state as SubmissionState;
      const rows = await bulkSetState(list, state);
      await audit({ actor: session.actor, action: "status", entity: "submission", summary: `Marked ${rows.length} submission${rows.length === 1 ? "" : "s"} as ${STATE_LABEL[state]}` });
      return { count: rows.length, rows };
    }
    throw new CmsError(400, "bad_action");
  });
}
