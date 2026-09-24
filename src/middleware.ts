import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, readSession } from "@/lib/admin-auth";

/**
 * Gates /admin pages. Fails closed: with no ADMIN_PASSWORD configured, the
 * admin view is unreachable rather than open. This is only the page gate —
 * every /api/admin route checks the session again itself (lib/admin-guard).
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const secret = process.env.ADMIN_PASSWORD;
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const session = secret ? await readSession(secret, token) : null;

  if (session) {
    const res = NextResponse.next();
    // Admin pages hold private data: never cache them anywhere, never index.
    res.headers.set("Cache-Control", "private, no-store");
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  const login = request.nextUrl.clone();
  login.pathname = "/admin/login";
  login.search = !secret ? "?unconfigured=1" : token ? "?expired=1" : "";
  return NextResponse.redirect(login);
}

export const config = { matcher: ["/admin/:path*"] };
