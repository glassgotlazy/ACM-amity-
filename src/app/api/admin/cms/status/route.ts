import { auditReady } from "@/lib/audit";
import { allRoutes } from "@/lib/cms/routes";
import { cmsStatus, contentStatus, knownSlugs } from "@/lib/cms/write";
import { handle } from "../_handle";

export const dynamic = "force-dynamic";

/** Setup state of each part of the CMS, plus every valid internal link for the link picker. */
export async function GET(req: Request) {
  return handle(req, "content:write", async (session) => {
    const [status, content, audit] = await Promise.all([cmsStatus(), contentStatus(), auditReady().catch(() => false)]);
    return {
      status,
      content,
      audit,
      actor: session.actor,
      routes: status === "ready" ? allRoutes(await knownSlugs()) : [],
    };
  });
}
