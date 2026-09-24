import { auditReady } from "@/lib/audit";
import { emailConfigured } from "@/lib/email";
import { usersReady } from "@/lib/admin-users";
import { allRoutes } from "@/lib/cms/routes";
import { cmsStatus, contentStatus, knownSlugs } from "@/lib/cms/write";
import { handle } from "../_handle";

export const dynamic = "force-dynamic";

/** Setup state of each part of the CMS, plus every valid internal link for the link picker. */
export async function GET(req: Request) {
  return handle(req, "admin:read", async (session) => {
    const [status, content, audit, v3] = await Promise.all([
      cmsStatus(),
      contentStatus(),
      auditReady().catch(() => false),
      usersReady().catch(() => false),
    ]);
    return {
      status,
      content,
      audit,
      v3,
      email: emailConfigured(),
      actor: session.actor,
      role: session.role,
      account: session.userId !== null,
      routes: status === "ready" ? allRoutes(await knownSlugs()) : [],
    };
  });
}
