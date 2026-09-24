import { allRoutes } from "@/lib/cms/routes";
import { cmsStatus, knownSlugs } from "@/lib/cms/write";
import { handle } from "../_handle";

export const dynamic = "force-dynamic";

/** Setup state, plus every valid internal link for the admin's link picker. */
export async function GET() {
  return handle(async () => {
    const status = await cmsStatus();
    return { status, routes: status === "ready" ? allRoutes(await knownSlugs()) : [] };
  });
}
