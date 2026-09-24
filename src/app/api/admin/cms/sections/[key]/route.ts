import { saveSection } from "@/lib/cms/write";
import { handle, json } from "../../_handle";

type Params = { params: Promise<{ key: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { key } = await params;
  return handle(async () => ({ row: await saveSection(key, await json(req)) }));
}
