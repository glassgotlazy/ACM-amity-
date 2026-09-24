import { initialiseCms } from "@/lib/cms/write";
import { handle } from "../_handle";

export async function POST(req: Request) {
  return handle(req, "settings:write", (s) => initialiseCms(s.actor));
}
