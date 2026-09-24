import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, readSession, type Session } from "@/lib/admin-auth";
import { can, type Permission } from "@/lib/admin-permissions";
import { isStorageConfigured } from "@/lib/supabase";

/**
 * Server-side authorisation for every /api/admin route.
 *
 * Middleware only guards /admin pages; an API route that trusted it would be
 * readable by anyone who guesses the URL. So each route calls this, which:
 *  1. verifies the signed session cookie (nothing from the client is trusted:
 *     not hidden buttons, local storage, URL parameters or a role in the body);
 *  2. checks the session's role holds the permission the route needs;
 *  3. for writes, refuses requests whose Origin is another site, on top of
 *     the SameSite=Lax cookie, so a forged cross-site form cannot act.
 */
export async function authorize(
  permission: Permission,
  opts: { needsStorage?: boolean } = {},
): Promise<{ session: Session; denied?: never } | { session?: never; denied: NextResponse }> {
  const secret = process.env.ADMIN_PASSWORD;
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const session = secret ? await readSession(secret, token) : null;
  if (!session) return { denied: NextResponse.json({ error: "unauthorised" }, { status: 401 }) };
  if (!can(session.role, permission)) return { denied: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  if (opts.needsStorage !== false && !isStorageConfigured()) {
    return { denied: NextResponse.json({ error: "storage_not_configured" }, { status: 503 }) };
  }
  return { session };
}

/** Cross-site write protection. Same-origin browser requests always pass. */
export function sameOrigin(request: Request): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser client: it still needs the signed cookie
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const hosts = [request.headers.get("x-forwarded-host"), request.headers.get("host"), new URL(request.url).host];
  return hosts.some((h) => h && h.split(",")[0].trim() === originHost);
}

/**
 * The one entry point routes use: origin check, then session and
 * permission. Returns the session, or the response to send instead.
 */
export async function guard(request: Request, permission: Permission, opts?: { needsStorage?: boolean }) {
  if (!sameOrigin(request)) {
    return { denied: NextResponse.json({ error: "cross_site_request" }, { status: 403 }) } as const;
  }
  return authorize(permission, opts);
}

/** Kept for the original submissions routes' import path. */
export async function requireAdmin(): Promise<NextResponse | null> {
  const r = await authorize("submissions:read");
  return r.denied ?? null;
}
