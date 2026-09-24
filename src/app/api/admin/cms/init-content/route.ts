import { seedContent } from "@/lib/cms/write";
import { handle } from "../_handle";

/** Loads problems, ideas, research, working teams and activity into the CMS. */
export async function POST(req: Request) {
  return handle(req, "settings:write", (s) => seedContent(s.actor));
}
