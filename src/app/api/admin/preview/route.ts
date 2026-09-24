import { draftMode } from "next/headers";
import { NextResponse } from "next/server";
import { guard } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

/** A same-site page path: "/x", never "//host" or a full URL. */
function safePath(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\") || raw.length > 300) return "/";
  return raw;
}

/**
 * Opens the public site in preview: drafts show as they would look once
 * published. GET /api/admin/preview?path=/projects/foo. Needs an admin
 * session — and the public pages check that session again on every render.
 */
export async function GET(request: Request) {
  const auth = await guard(request, "admin:read");
  if (auth.denied) return auth.denied;
  (await draftMode()).enable();
  const path = safePath(new URL(request.url).searchParams.get("path"));
  return NextResponse.redirect(new URL(path, request.url), 307);
}
