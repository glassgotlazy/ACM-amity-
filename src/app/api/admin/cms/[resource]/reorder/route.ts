import { resourcePermission } from "@/lib/admin-permissions";
import { reorderRows } from "@/lib/cms/write";
import { handle, json } from "../../_handle";

type Params = { params: Promise<{ resource: string }> };

export async function POST(req: Request, { params }: Params) {
  const { resource } = await params;
  return handle(req, resourcePermission(resource), async (s) => reorderRows(resource, ((await json(req)) as { ids?: unknown })?.ids, s.actor));
}
