import { NextResponse } from "next/server";
import { safeEqual } from "@/lib/admin-auth";
import { importGithubActivity } from "@/lib/github-activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily import, run by Vercel Cron (vercel.json). Vercel sends
 * "Authorization: Bearer $CRON_SECRET"; anything else is refused.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(given, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  try {
    return NextResponse.json(await importGithubActivity("GitHub import"));
  } catch (error) {
    console.error("[cron] github import failed:", error);
    return NextResponse.json({ ok: false, reason: "storage_failed" }, { status: 502 });
  }
}
