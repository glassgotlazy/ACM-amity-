import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyToken } from "@/lib/admin-auth";

/**
 * Gates /admin. Fails closed: with no ADMIN_PASSWORD configured, the admin
 * view is unreachable rather than open.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const secret = process.env.ADMIN_PASSWORD;
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const ok = secret ? await verifyToken(secret, token) : false;

  if (ok) return NextResponse.next();

  const login = request.nextUrl.clone();
  login.pathname = "/admin/login";
  login.search = secret ? "" : "?unconfigured=1";
  return NextResponse.redirect(login);
}

export const config = { matcher: ["/admin/:path*"] };
