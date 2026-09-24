import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Leaves preview and returns to the same page as the public sees it. */
export async function GET(request: Request) {
  (await draftMode()).disable();
  const raw = new URL(request.url).searchParams.get("path");
  const path = raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\") ? raw.slice(0, 300) : "/";
  return NextResponse.redirect(new URL(path, request.url), 307);
}
