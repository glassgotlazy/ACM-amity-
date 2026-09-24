import type { AdminRole } from "./admin-auth";

/**
 * What an admin session may do. Every admin API route names the permission it
 * needs and the guard checks it server-side.
 *
 * Today there is a single shared password and a single role that holds every
 * permission. Splitting it later (a content editor, an events editor…) means
 * adding a role here and a way to sign in as it — no route has to change.
 */
export const PERMISSIONS = [
  "submissions:read",
  "submissions:write",
  "content:write",
  "settings:write",
  "media:write",
  "audit:read",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  owner: PERMISSIONS,
};

export function can(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
