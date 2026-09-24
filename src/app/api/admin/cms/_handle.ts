import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { CmsError } from "@/lib/cms/write";

/** Session check, then the handler; CMS errors become their JSON answer. */
export async function handle(fn: () => Promise<unknown>) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await fn();
    return NextResponse.json(body ?? { ok: true });
  } catch (error) {
    if (error instanceof CmsError) {
      return NextResponse.json({ error: error.code, errors: error.errors, ...error.extra }, { status: error.status });
    }
    console.error("[cms]", error);
    return NextResponse.json({ error: "storage_failed" }, { status: 502 });
  }
}

export async function json(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new CmsError(400, "invalid_body");
  }
}
