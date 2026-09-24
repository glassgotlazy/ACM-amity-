import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, SESSION_HOURS, cleanActor, issueToken, readSession, safeEqual } from "@/lib/admin-auth";
import { sameOrigin } from "@/lib/admin-guard";
import { audit, ipHash, recentFailures } from "@/lib/audit";
import { isStorageConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/** Failed attempts from one address within 15 minutes before sign-in pauses. */
const MAX_FAILURES = 8;

/** Sign in. Body: { password, name? } — the name only labels audit entries. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ ok: false, error: "cross_site_request" }, { status: 403 });

  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  let password = "";
  let name = "";
  try {
    const body = (await request.json()) as { password?: unknown; name?: unknown };
    password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
    name = cleanActor(body.name);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // Rate limiting has to live in shared storage: an in-memory counter means
  // nothing on serverless, where attempts spread across instances. Failed
  // attempts are counted from the audit log; without it, only the fixed delay
  // below applies.
  const storage = isStorageConfigured();
  const hash = await ipHash(request);
  if (storage) {
    const failures = await recentFailures(hash);
    if (failures !== null && failures >= MAX_FAILURES) {
      return NextResponse.json({ ok: false, error: "too_many_attempts" }, { status: 429 });
    }
  }

  // A small fixed delay blunts guessing whether or not the log is available.
  await new Promise((r) => setTimeout(r, 400));

  if (!safeEqual(password, secret)) {
    if (storage) await audit({ actor: name, action: "login_failed", entity: "session", ip_hash: hash });
    return NextResponse.json({ ok: false, error: "wrong_password" }, { status: 401 });
  }

  if (storage) await audit({ actor: name, action: "login", entity: "session", summary: `${name} signed in` });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, await issueToken(secret, name), {
    ...cookieBase,
    maxAge: SESSION_HOURS * 3600,
  });
  return res;
}

/** Who is signed in, so the console can show it. */
export async function GET() {
  const secret = process.env.ADMIN_PASSWORD;
  const session = secret ? await readSession(secret, (await cookies()).get(ADMIN_COOKIE)?.value) : null;
  if (!session) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  return NextResponse.json({ actor: session.actor, role: session.role, expiresAt: session.expiresAt });
}

/** Sign out. */
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ ok: false, error: "cross_site_request" }, { status: 403 });
  const secret = process.env.ADMIN_PASSWORD;
  const session = secret ? await readSession(secret, (await cookies()).get(ADMIN_COOKIE)?.value) : null;
  if (session && isStorageConfigured()) {
    await audit({ actor: session.actor, action: "logout", entity: "session", summary: `${session.actor} signed out` });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { ...cookieBase, maxAge: 0 });
  return res;
}
