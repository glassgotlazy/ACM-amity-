import { NextResponse } from "next/server";
import type { Session } from "@/lib/admin-auth";
import { guard } from "@/lib/admin-guard";
import type { Permission } from "@/lib/admin-permissions";
import { CmsError } from "@/lib/cms/write";

/**
 * Every CMS/admin route runs through this: origin check, signed session,
 * permission — then the handler. CMS errors become their JSON answer; any
 * other failure is logged on the server and reported without detail.
 */
export async function handle(request: Request, permission: Permission, fn: (session: Session) => Promise<unknown>) {
  const auth = await guard(request, permission);
  if (auth.denied) return auth.denied;
  try {
    const body = await fn(auth.session);
    return body instanceof Response ? body : NextResponse.json(body ?? { ok: true });
  } catch (error) {
    if (error instanceof CmsError) {
      return NextResponse.json({ error: error.code, errors: error.errors, ...error.extra }, { status: error.status });
    }
    console.error("[admin]", error);
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
