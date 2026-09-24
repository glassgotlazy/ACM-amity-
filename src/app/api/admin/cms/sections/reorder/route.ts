import { reorderSections } from "@/lib/cms/write";
import { handle, json } from "../../_handle";

export async function POST(req: Request) {
  return handle(req, "content:write", async (s) => reorderSections(((await json(req)) as { keys?: unknown })?.keys, s.actor));
}
