import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyToken } from "@/lib/admin-auth";
import { isStorageConfigured } from "@/lib/supabase";

/**
 * Middleware only guards /admin pages. API routes under /api/admin must check
 * the same cookie themselves, or the queue is readable by anyone who guesses
 * the URL.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const secret = process.env.ADMIN_PASSWORD;
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!secret || !(await verifyToken(secret, token))) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  if (!isStorageConfigured()) {
    return NextResponse.json({ error: "storage_not_configured" }, { status: 503 });
  }
  return null;
}
