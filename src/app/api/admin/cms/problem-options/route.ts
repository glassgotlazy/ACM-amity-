import { getProblems } from "@/lib/cms/read";
import { handle } from "../_handle";

export const dynamic = "force-dynamic";

/** Problem statements a project or idea can link to (slug and title only). */
export async function GET(req: Request) {
  return handle(req, "content:write", async () => ({
    rows: (await getProblems()).map((p) => ({ slug: p.slug, title: p.title })),
  }));
}
