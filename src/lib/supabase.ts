/**
 * Submission storage on Supabase, spoken to over PostgREST with plain fetch.
 *
 * No SDK: the surface needed is three calls, the service-role key must never
 * leave the server anyway, and every dependency the site does not have is
 * one it cannot break on. Both variables are server-only — a NEXT_PUBLIC_
 * prefix on the key would publish write access to the queue.
 */

export const SUBMISSION_STATES = ["new", "reviewing", "accepted", "declined", "published"] as const;
export type SubmissionState = (typeof SUBMISSION_STATES)[number];

export type SubmissionKind = "join" | "project-application" | "problem-submission" | "project-proposal";

export type StoredSubmission = {
  id: string;
  created_at: string;
  kind: SubmissionKind;
  payload: Record<string, unknown>;
  anonymous: boolean;
  state: SubmissionState;
  note: string | null;
};

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

export async function listSubmissions(filter: { kind?: SubmissionKind; state?: SubmissionState } = {}) {
  const q = new URLSearchParams({ select: "*", order: "created_at.desc", limit: "200" });
  if (filter.kind) q.set("kind", `eq.${filter.kind}`);
  if (filter.state) q.set("state", `eq.${filter.state}`);
  return rest<StoredSubmission[]>(`submissions?${q.toString()}`);
}

export async function updateSubmission(
  id: string,
  patch: { state?: SubmissionState; note?: string | null },
): Promise<StoredSubmission | null> {
  const q = new URLSearchParams({ id: `eq.${id}`, select: "*" });
  const rows = await rest<StoredSubmission[]>(`submissions?${q.toString()}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
    prefer: "return=representation",
  });
  return rows[0] ?? null;
}
