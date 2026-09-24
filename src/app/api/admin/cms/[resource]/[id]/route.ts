import { deleteRow, updateRow } from "@/lib/cms/write";
import { handle, json } from "../../_handle";

type Params = { params: Promise<{ resource: string; id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { resource, id } = await params;
  return handle(async () => ({ row: await updateRow(resource, id, await json(req)) }));
}

export async function DELETE(req: Request, { params }: Params) {
  const { resource, id } = await params;
  const reassignTo = new URL(req.url).searchParams.get("reassign_to");
  return handle(() => deleteRow(resource, id, { reassignTo }));
}
