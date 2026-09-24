import { handle, json } from "../cms/_handle";
import { getPasswordHash, getUser, patchUser } from "@/lib/admin-users";
import { audit } from "@/lib/audit";
import { CmsError } from "@/lib/cms/write";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/passwords";
import { issueToken, ADMIN_COOKIE, SESSION_HOURS } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Change your own password. Body: { current, next }. Ends your other sessions. */
export async function PUT(req: Request) {
  return handle(req, "admin:read", async (session) => {
    if (!session.userId) throw new CmsError(400, "no_account");
    const b = (await json(req)) as { current?: unknown; next?: unknown };
    const hash = await getPasswordHash(session.userId);
    if (!hash || typeof b.current !== "string" || !(await verifyPassword(b.current, hash))) {
      throw new CmsError(422, "invalid", { current: "That is not your current password." });
    }
    const problem = passwordProblem(b.next);
    if (problem) throw new CmsError(422, "invalid", { next: problem });
    const user = await getUser(session.userId);
    if (!user) throw new CmsError(404, "not_found");
    const row = await patchUser(session.userId, { password_hash: await hashPassword(String(b.next)), session_version: user.session_version + 1 });
    await audit({ actor: session.actor, action: "update", entity: "admin_user", entity_id: session.userId, summary: `${session.actor} changed their password` });
    // Keep this browser signed in with a fresh session; every other one ends.
    const res = NextResponse.json({ ok: true });
    const secret = process.env.ADMIN_PASSWORD!;
    res.cookies.set(ADMIN_COOKIE, await issueToken(secret, { actor: row!.name, role: row!.role, userId: row!.id, version: row!.session_version }), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_HOURS * 3600,
    });
    return res;
  });
}
