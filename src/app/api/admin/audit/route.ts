import { handle } from "../cms/_handle";
import { auditReady, listAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIONS = new Set(["login", "login_failed", "logout", "create", "update", "delete", "reorder", "status", "initialise", "upload", "export"]);

/** GET ?page&per&action — newest first. */
export async function GET(request: Request) {
  return handle(request, "audit:read", async () => {
    if (!(await auditReady())) return { ready: false, rows: [], total: 0, page: 1, per: 50 };
    const sp = new URL(request.url).searchParams;
    const page = Math.max(1, Math.min(10_000, Number.parseInt(sp.get("page") ?? "1", 10) || 1));
    const per = Math.max(10, Math.min(100, Number.parseInt(sp.get("per") ?? "50", 10) || 50));
    const action = sp.get("action") ?? "";
    const { rows, total } = await listAudit({ page, per, action: ACTIONS.has(action) ? action : undefined });
    return { ready: true, rows, total, page, per };
  });
}
