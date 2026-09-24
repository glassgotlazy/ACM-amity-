/**
 * Submission storage on Supabase, spoken to over PostgREST with plain fetch.
 *
 * No SDK: the surface needed is three calls, the service-role key must never
 * leave the server anyway, and every dependency the site does not have is
 * one it cannot break on. Both variables are server-only — a NEXT_PUBLIC_
 * prefix on the key would publish write access to the queue.
 */

import type { StoredSubmission, SubmissionKind } from "./submission-types";

export {
  SUBMISSION_STATES,
  type StoredSubmission,
  type SubmissionKind,
  type SubmissionState,
} from "./submission-types";

export function storageConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

export function isStorageConfigured(): boolean {
  return storageConfig() !== null;
}

/** Thrown for any non-2xx answer; `status` lets callers tell "missing" from "broken". */
export class StorageError extends Error {
  constructor(public status: number) {
    super(`storage_${status}`);
  }
}

export async function rest<T>(path: string, init: RequestInit & { prefer?: string } = {}): Promise<T> {
  const cfg = storageConfig();
  if (!cfg) throw new Error("storage_not_configured");
  const { prefer, ...rest } = init;
  const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
    ...rest,
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
      ...(rest.headers ?? {}),
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    // Body may carry table names; log server-side only.
    console.error(`[storage] ${init.method ?? "GET"} ${path} -> ${res.status} ${await res.text().catch(() => "")}`);
    throw new StorageError(res.status);
  }
  // Writes without `return=representation` answer 201/204 with an empty body.
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/**
 * A page of rows plus the total matching count, from one request. PostgREST
 * reports the total in Content-Range ("0-24/137") when asked for count=exact.
 */
export async function restPage<T>(path: string): Promise<{ rows: T[]; total: number }> {
  const cfg = storageConfig();
  if (!cfg) throw new Error("storage_not_configured");
  const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
    headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}`, Prefer: "count=exact" },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!res.ok) {
    console.error(`[storage] GET ${path} -> ${res.status} ${await res.text().catch(() => "")}`);
    throw new StorageError(res.status);
  }
  const total = Number(res.headers.get("content-range")?.split("/")[1] ?? NaN);
  const rows = (await res.json()) as T[];
  return { rows, total: Number.isFinite(total) ? total : rows.length };
}

export async function storeSubmission(
  kind: SubmissionKind,
  payload: Record<string, unknown>,
  anonymous: boolean,
): Promise<StoredSubmission> {
  const rows = await rest<StoredSubmission[]>("submissions", {
    method: "POST",
    body: JSON.stringify({ kind, payload, anonymous }),
    prefer: "return=representation",
  });
  return rows[0];
}
