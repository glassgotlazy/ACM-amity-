import { handle } from "../cms/_handle";
import { auditReady, listAudit } from "@/lib/audit";
import { cmsStatus } from "@/lib/cms/write";
import { upcoming } from "@/lib/cms/read";
import type { EventItem } from "@/lib/cms/types";
import { rest, restPage } from "@/lib/supabase";
import { submissionCounts } from "@/lib/submissions-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Count rows without fetching them: one `count=exact` request with limit 1. */
async function count(table: string, params: Record<string, string> = {}) {
  return (await restPage(`${table}?${new URLSearchParams({ select: "id", limit: "1", ...params })}`)).total;
}

/**
 * Dashboard numbers, straight from the database on every request. Each is
 * independent: if one part of the schema is missing its figure is null and
 * the rest still load.
 */
export async function GET(request: Request) {
  return handle(request, "submissions:read", async () => {
    const safe = <T,>(p: Promise<T>) => p.catch(() => null);
    const cms = await safe(cmsStatus());
    const ready = cms === "ready";
    const [submissions, projects, drafts, events, team, announcements, recent] = await Promise.all([
      safe(submissionCounts()),
      ready ? safe(count("projects", { published: "eq.true" })) : null,
      ready ? safe(count("projects", { published: "eq.false" })) : null,
      ready
        ? safe(
            rest<EventItem[]>("events?select=starts_at,ends_at,status&published=eq.true&status=in.(upcoming,ongoing)&limit=500").then(
              (rows) => upcoming(rows).length,
            ),
          )
        : null,
      ready ? safe(count("team_members", { published: "eq.true" })) : null,
      ready ? safe(count("announcements", { published: "eq.true" })) : null,
      safe(auditReady().then((ok) => (ok ? listAudit({ page: 1, per: 8 }).then((r) => r.rows) : null))),
    ]);
    return { cms, submissions, projects, drafts, events, team, announcements, recent };
  });
}
