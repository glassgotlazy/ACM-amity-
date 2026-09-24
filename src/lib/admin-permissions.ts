import type { AdminRole } from "./admin-auth";

/**
 * What each admin role may do. Every admin API route names the permission it
 * needs and the server checks it — hiding a menu item is only a convenience.
 *
 *   owner     everything, including managing admin accounts and backups
 *   editor    all content, settings, media and the submissions inbox
 *   events    events, announcements and images only
 *   reviewer  the submissions inbox only
 */
export const PERMISSIONS = [
  "admin:read",
  "submissions:read",
  "submissions:write",
  "content:write",
  "events:write",
  "settings:write",
  "media:write",
  "audit:read",
  "admins:manage",
  "backup:read",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  owner: PERMISSIONS,
  editor: ["admin:read", "submissions:read", "submissions:write", "content:write", "events:write", "settings:write", "media:write", "audit:read"],
  events: ["admin:read", "events:write", "media:write"],
  reviewer: ["admin:read", "submissions:read", "submissions:write"],
};

export const ROLE_LABEL: Record<AdminRole, string> = {
  owner: "Owner",
  editor: "Editor",
  events: "Events editor",
  reviewer: "Reviewer",
};

export function can(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** The permission a CMS collection needs. */
export function resourcePermission(resource: string): Permission {
  if (resource === "events" || resource === "announcements") return "events:write";
  if (resource === "nav" || resource === "social") return "settings:write";
  return "content:write";
}
