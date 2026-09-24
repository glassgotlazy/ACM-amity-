import { readSettings, saveSettings } from "@/lib/cms/write";
import { handle, json } from "../_handle";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => ({ row: await readSettings() }));
}

export async function PUT(req: Request) {
  return handle(async () => ({ row: await saveSettings(await json(req)) }));
}
