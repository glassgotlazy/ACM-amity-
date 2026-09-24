import { rest, restPage, StorageError } from "./supabase";

/**
 * Administrative audit log (table `admin_audit`, created by
 * supabase/admin.sql).
 *
 * Writing is best-effort: an audit failure is logged on the server but never
 * blocks or reverses the admin action it describes. Entries hold who, what,
 * which record and when — never passwords, tokens, cookies or form contents.
 * The client IP is stored only as a salted hash, for sign-in rate limiting.
 */

export type AuditAction =
  | "login"
  | "login_failed"
  | "logout"
  | "create"
  | "update"
  | "delete"
  | "reorder"
  | "publish"
  | "unpublish"
  | "status"
  | "initialise"
  | "upload"
  | "export";

export type AuditEntry = {
  actor: string;
  action: AuditAction;
  entity?: string;
  entity_id?: string | null;
  summary?: string;
  ip_hash?: string | null;
};

export type AuditRow = AuditEntry & { id: number; at: string };

let missingUntil = 0;

/** Whether admin.sql has been run. Cached briefly so a missing table costs one probe a minute. */
export async function auditReady(): Promise<boolean> {
  if (Date.now() < missingUntil) return false;
  try {
    await rest("admin_audit?select=id&limit=1");
    return true;
  } catch (error) {
    if (error instanceof StorageError && error.status === 404) {
      missingUntil = Date.now() + 15_000;
      return false;
    }
    throw error;
  }
}

export async function audit(entry: AuditEntry): Promise<void> {
  // Always attempted (never skipped on a cached "missing"), so no entry is
  // lost in the minutes after admin.sql is run.
  try {
    await rest("admin_audit", {
      method: "POST",
      body: JSON.stringify({
        actor: entry.actor.slice(0, 40),
        action: entry.action,
        entity: entry.entity?.slice(0, 40) ?? null,
        entity_id: entry.entity_id?.slice(0, 80) ?? null,
        summary: entry.summary?.slice(0, 300) ?? null,
        ip_hash: entry.ip_hash ?? null,
      }),
    });
  } catch (error) {
    if (!(error instanceof StorageError && error.status === 404)) console.error("[audit] write failed:", error);
  }
}

/** Salted hash of the caller's IP: enough to count attempts, useless if leaked. */
export async function ipHash(request: Request): Promise<string> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const salt = process.env.ADMIN_PASSWORD ?? "";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${ip}`));
  return Array.from(new Uint8Array(digest).slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Failed sign-ins from this address recently; null when the log is unavailable. */
export async function recentFailures(hash: string, minutes = 15): Promise<number | null> {
  if (!(await auditReady().catch(() => false))) return null;
  const since = new Date(Date.now() - minutes * 60_000).toISOString();
  const q = new URLSearchParams({ select: "id", action: "eq.login_failed", ip_hash: `eq.${hash}`, at: `gte.${since}`, limit: "1" });
  try {
    return (await restPage(`admin_audit?${q}`)).total;
  } catch {
    return null;
  }
}

export async function listAudit({ page, per, action }: { page: number; per: number; action?: string }) {
  const q = new URLSearchParams({
    select: "id,at,actor,action,entity,entity_id,summary",
    order: "at.desc",
    limit: String(per),
    offset: String((page - 1) * per),
  });
  if (action) q.set("action", `eq.${action}`);
  return restPage<AuditRow>(`admin_audit?${q}`);
}
