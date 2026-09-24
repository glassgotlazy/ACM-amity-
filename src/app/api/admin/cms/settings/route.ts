import { readSettings, saveSettings } from "@/lib/cms/write";
import { handle, json } from "../_handle";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return handle(req, "settings:write", async () => ({ row: await readSettings() }));
}

export async function PUT(req: Request) {
  return handle(req, "settings:write", async (s) => ({ row: await saveSettings(await json(req), s.actor) }));
}
