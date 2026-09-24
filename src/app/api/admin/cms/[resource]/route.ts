import { createRow, listRows } from "@/lib/cms/write";
import { handle, json } from "../_handle";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ resource: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { resource } = await params;
  return handle(async () => ({ rows: await listRows(resource) }));
}

export async function POST(req: Request, { params }: Params) {
  const { resource } = await params;
  return handle(async () => ({ row: await createRow(resource, await json(req)) }));
}
