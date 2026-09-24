import { readPages, readSections } from "@/lib/cms/write";
import { handle } from "../_handle";

export const dynamic = "force-dynamic";

/** Homepage sections; `?pages=1` returns the other pages' headers instead. */
export async function GET(req: Request) {
  const pages = new URL(req.url).searchParams.get("pages") === "1";
  return handle(req, "settings:write", async () => ({ rows: pages ? await readPages() : await readSections() }));
}
