import { handle, json } from "../cms/_handle";
import { ADMIN_ROLES, type AdminRole } from "@/lib/admin-auth";
import { insertUser, listUsers, normEmail, usersReady } from "@/lib/admin-users";
import { audit } from "@/lib/audit";
import { CmsError } from "@/lib/cms/write";
import { hashPassword, passwordProblem } from "@/lib/passwords";
import { StorageError } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(req: Request) {
  return handle(req, "admins:manage", async () => {
    if (!(await usersReady())) return { ready: false, rows: [] };
    return { ready: true, rows: await listUsers() };
  });
}

/** Body: { name, email, role, password } — the password is a first password to hand over. */
export async function POST(req: Request) {
  return handle(req, "admins:manage", async (session) => {
    const b = (await json(req)) as Record<string, unknown>;
    const errors: Record<string, string> = {};
    const name = typeof b.name === "string" ? b.name.trim().slice(0, 60) : "";
    const email = normEmail(b.email);
    const role = String(b.role) as AdminRole;
    if (!name) errors.name = "Required.";
    if (!EMAIL.test(email) || email.length > 200) errors.email = "Enter a valid email.";
    if (!(ADMIN_ROLES as readonly string[]).includes(role)) errors.role = "Pick a role.";
    const pw = passwordProblem(b.password);
    if (pw) errors.password = pw;
    if (Object.keys(errors).length) throw new CmsError(422, "invalid", errors);
    try {
      const user = await insertUser({ name, email, role, password_hash: await hashPassword(String(b.password)) });
      await audit({ actor: session.actor, action: "create", entity: "admin_user", entity_id: user.id, summary: `Added admin ${name} (${role})` });
      return { row: user };
    } catch (error) {
      if (error instanceof StorageError && error.status === 409) throw new CmsError(409, "conflict", { email: "An admin with this email already exists." });
      if (error instanceof StorageError && error.status === 404) throw new CmsError(409, "v3_missing");
      throw error;
    }
  });
}
