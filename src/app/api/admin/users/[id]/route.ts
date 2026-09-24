import { handle, json } from "../../cms/_handle";
import { ADMIN_ROLES, type AdminRole } from "@/lib/admin-auth";
import { deleteUser, getUser, patchUser } from "@/lib/admin-users";
import { audit } from "@/lib/audit";
import { CmsError } from "@/lib/cms/write";
import { hashPassword, passwordProblem } from "@/lib/passwords";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Params = { params: Promise<{ id: string }> };

/**
 * Body (any of): { name, role, active, password, sign_out: true }.
 * Changing the role, deactivating, resetting the password or signing out
 * everywhere all bump session_version, which ends every session at once.
 */
export async function PUT(req: Request, { params }: Params) {
  return handle(req, "admins:manage", async (session) => {
    const { id } = await params;
    if (!UUID.test(id)) throw new CmsError(400, "bad_id");
    const user = await getUser(id);
    if (!user) throw new CmsError(404, "not_found");
    const b = (await json(req)) as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    const changes: string[] = [];
    let endSessions = false;

    if (b.name !== undefined) {
      const name = typeof b.name === "string" ? b.name.trim().slice(0, 60) : "";
      if (!name) throw new CmsError(422, "invalid", { name: "Required." });
      patch.name = name;
    }
    if (b.role !== undefined && b.role !== user.role) {
      if (!(ADMIN_ROLES as readonly string[]).includes(String(b.role))) throw new CmsError(422, "invalid", { role: "Pick a role." });
      patch.role = b.role as AdminRole;
      changes.push(`role → ${b.role}`);
      endSessions = true;
    }
    if (b.active !== undefined && b.active !== user.active) {
      if (typeof b.active !== "boolean") throw new CmsError(400, "bad_active");
      if (session.userId === id && !b.active) throw new CmsError(422, "invalid", { active: "You cannot deactivate yourself." });
      patch.active = b.active;
      changes.push(b.active ? "reactivated" : "deactivated");
      endSessions = true;
    }
    if (b.password !== undefined) {
      const problem = passwordProblem(b.password);
      if (problem) throw new CmsError(422, "invalid", { password: problem });
      patch.password_hash = await hashPassword(String(b.password));
      changes.push("password reset");
      endSessions = true;
    }
    if (b.sign_out === true) {
      changes.push("signed out everywhere");
      endSessions = true;
    }
    if (endSessions) patch.session_version = user.session_version + 1;
    if (Object.keys(patch).length === 0) throw new CmsError(400, "empty_patch");

    const row = await patchUser(id, patch);
    await audit({
      actor: session.actor,
      action: "update",
      entity: "admin_user",
      entity_id: id,
      summary: `Admin ${row?.name ?? user.name}: ${changes.join(", ") || "renamed"}`,
    });
    return { row };
  });
}

export async function DELETE(req: Request, { params }: Params) {
  return handle(req, "admins:manage", async (session) => {
    const { id } = await params;
    if (!UUID.test(id)) throw new CmsError(400, "bad_id");
    if (session.userId === id) throw new CmsError(422, "invalid", { id: "You cannot remove your own account." });
    const removed = await deleteUser(id);
    if (!removed) throw new CmsError(404, "not_found");
    await audit({ actor: session.actor, action: "delete", entity: "admin_user", entity_id: id, summary: `Removed admin ${removed.name}` });
  });
}
