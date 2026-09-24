import { initialiseCms } from "@/lib/cms/write";
import { handle } from "../_handle";

export async function POST() {
  return handle(() => initialiseCms());
}
