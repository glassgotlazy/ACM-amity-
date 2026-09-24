import type { AdminRole } from "./admin-auth";
import { rest, StorageError } from "./supabase";

/** Individual admin accounts (table admin_users, from supabase/v3.sql). */

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
  session_version: number;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

/** Never select password_hash except where a password is being checked. */
const PUBLIC_COLS = "id,name,email,role,active,session_version,created_at,updated_at,last_login_at";

export const normEmail = (e: unknown) => (typeof e === "string" ? e.trim().toLowerCase() : "");

export async function usersReady(): Promise<boolean> {
  try {
    await rest("admin_users?select=id&limit=1");
    return true;
  } catch (error) {
    if (error instanceof StorageError && error.status === 404) return false;
    throw error;
  }
}

export async function listUsers(): Promise<AdminUser[]> {
  return rest<AdminUser[]>(`admin_users?select=${PUBLIC_COLS}&order=created_at.asc`);
}

export async function getUser(id: string): Promise<AdminUser | null> {
  const rows = await rest<AdminUser[]>(`admin_users?${new URLSearchParams({ id: `eq.${id}`, select: PUBLIC_COLS })}`);
  return rows[0] ?? null;
}

/** For sign-in only: includes the hash. */
export async function getUserForLogin(email: string): Promise<(AdminUser & { password_hash: string }) | null> {
  try {
    const rows = await rest<(AdminUser & { password_hash: string })[]>(
      `admin_users?${new URLSearchParams({ email: `eq.${normEmail(email)}`, select: `${PUBLIC_COLS},password_hash` })}`,
    );
    return rows[0] ?? null;
  } catch (error) {
    if (error instanceof StorageError && error.status === 404) return null;
    throw error;
  }
}

export async function getPasswordHash(id: string): Promise<string | null> {
  const rows = await rest<{ password_hash: string }[]>(`admin_users?${new URLSearchParams({ id: `eq.${id}`, select: "password_hash" })}`);
  return rows[0]?.password_hash ?? null;
}

export async function insertUser(row: { name: string; email: string; role: AdminRole; password_hash: string }) {
  const [created] = await rest<AdminUser[]>(`admin_users?select=${PUBLIC_COLS}`, {
    method: "POST",
    body: JSON.stringify(row),
    prefer: "return=representation",
  });
  return created;
}

export async function patchUser(id: string, patch: Record<string, unknown>) {
  const [row] = await rest<AdminUser[]>(`admin_users?${new URLSearchParams({ id: `eq.${id}`, select: PUBLIC_COLS })}`, {
    method: "PATCH",
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
    prefer: "return=representation",
  });
  return row ?? null;
}

export async function deleteUser(id: string) {
  const rows = await rest<AdminUser[]>(`admin_users?${new URLSearchParams({ id: `eq.${id}`, select: PUBLIC_COLS })}`, {
    method: "DELETE",
    prefer: "return=representation",
  });
  return rows[0] ?? null;
}
