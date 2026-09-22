import { NextResponse } from "next/server";
import { ADMIN_COOKIE, SESSION_HOURS, issueToken, safeEqual } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/** Sign in. */
export async function POST(request: Request) {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // Small fixed delay blunts online guessing without in-memory rate state,
  // which does not survive across serverless instances anyway.
  await new Promise((r) => setTimeout(r, 400));

  if (!safeEqual(password, secret)) {
    return NextResponse.json({ ok: false, error: "wrong_password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, await issueToken(secret), {
    ...cookieBase,
    maxAge: SESSION_HOURS * 3600,
  });
  return res;
}

/** Sign out. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { ...cookieBase, maxAge: 0 });
  return res;
}
