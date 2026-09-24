import { readSections } from "@/lib/cms/write";
import { handle } from "../_handle";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => ({ rows: await readSections() }));
}
