import { rest, restPage, StorageError } from "./supabase";
import {
  CATEGORY,
  SEARCH_FIELDS,
  SUBMISSION_KINDS,
  SUBMISSION_STATES,
  type StoredSubmission,
  type SubmissionKind,
  type SubmissionState,
} from "./submission-types";

/**
 * Admin-side queries over the existing `submissions` table (the one the
 * public form gateway writes to). Filtering, search, sorting and paging all
 * happen in Postgres, so the admin never downloads the whole table.
 */

export type SubmissionQuery = {
  kind?: SubmissionKind;
  state?: SubmissionState;
  category?: string;
  q?: string;
  from?: string;
  to?: string;
  sort: "newest" | "oldest" | "name";
  page: number;
  per: number;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Parses and clamps URL parameters; anything unexpected is dropped, never passed through. */
export function parseQuery(params: URLSearchParams): SubmissionQuery {
  const kind = params.get("kind");
  const state = params.get("state");
  const sort = params.get("sort");
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const category = (params.get("category") ?? "").slice(0, 60);
  return {
    kind: (SUBMISSION_KINDS as readonly string[]).includes(kind ?? "") ? (kind as SubmissionKind) : undefined,
    state: (SUBMISSION_STATES as readonly string[]).includes(state ?? "") ? (state as SubmissionState) : undefined,
    category: category || undefined,
    q: cleanSearch(params.get("q") ?? ""),
    from: DATE.test(from) ? from : undefined,
    to: DATE.test(to) ? to : undefined,
    sort: sort === "oldest" || sort === "name" ? sort : "newest",
    page: Math.max(1, Math.min(10_000, Number.parseInt(params.get("page") ?? "1", 10) || 1)),
    per: Math.max(5, Math.min(100, Number.parseInt(params.get("per") ?? "25", 10) || 25)),
  };
}

/**
 * Search text is embedded in a PostgREST `or=(…)` filter, where commas,
 * parentheses, quotes and `*` are syntax. Keep letters, digits and a little
 * punctuation that appears in names and emails; drop the rest.
 */
function cleanSearch(raw: string): string | undefined {
  const s = raw.normalize("NFKC").replace(/[^\p{L}\p{N}@._+\- ]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  return s || undefined;
}

function buildParams(query: SubmissionQuery, select = "*") {
  const p = new URLSearchParams({ select });
  if (query.kind) p.set("kind", `eq.${query.kind}`);
  if (query.state) p.set("state", `eq.${query.state}`);

  if (query.kind && query.category) {
    const cat = CATEGORY[query.kind];
    if ((cat.options as readonly string[]).includes(query.category)) {
      if (cat.array) p.set(`payload->${cat.field}`, `cs.${JSON.stringify([query.category])}`);
      else p.set(`payload->>${cat.field}`, `eq.${query.category}`);
    }
  }

  if (query.q) {
    p.set("or", `(${SEARCH_FIELDS.map((f) => `payload->>${f}.ilike."*${query.q}*"`).join(",")})`);
  }

  const range: string[] = [];
  // Quoted: ":" and "." are syntax inside PostgREST's and=(…).
  if (query.from) range.push(`created_at.gte."${query.from}T00:00:00Z"`);
  if (query.to) {
    const next = new Date(`${query.to}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    range.push(`created_at.lt."${next.toISOString()}"`);
  }
  if (range.length) p.set("and", `(${range.join(",")})`);

  p.set("order", query.sort === "oldest" ? "created_at.asc" : query.sort === "name" ? "payload->>name.asc,created_at.desc" : "created_at.desc");
  return p;
}

export async function listSubmissions(query: SubmissionQuery) {
  const p = buildParams(query);
  p.set("limit", String(query.per));
  p.set("offset", String((query.page - 1) * query.per));
  return restPage<StoredSubmission>(`submissions?${p}`);
}

/** Everything matching the filters, for CSV export. Capped so one click cannot pull an unbounded table. */
export async function exportSubmissions(query: SubmissionQuery, cap = 5000) {
  const p = buildParams(query);
  p.set("limit", String(cap));
  return rest<StoredSubmission[]>(`submissions?${p}`);
}

export async function getSubmission(id: string): Promise<StoredSubmission | null> {
  const rows = await rest<StoredSubmission[]>(`submissions?${new URLSearchParams({ id: `eq.${id}`, select: "*" })}`);
  return rows[0] ?? null;
}

let versioned: { value: boolean; until: number } | null = null;

/**
 * Whether admin.sql added `updated_at`; without it edits still work, just
 * without stale detection. A "no" is re-checked every minute so running
 * admin.sql takes effect without a redeploy.
 */
async function hasVersionColumn(): Promise<boolean> {
  if (versioned && (versioned.value || Date.now() < versioned.until)) return versioned.value;
  try {
    await rest("submissions?select=updated_at&limit=1");
    versioned = { value: true, until: Infinity };
  } catch (error) {
    if (error instanceof StorageError && error.status === 400) versioned = { value: false, until: Date.now() + 60_000 };
    else throw error;
  }
  return versioned.value;
}

export class StaleSubmission extends Error {
  constructor(public current: StoredSubmission) {
    super("stale");
  }
}

/**
 * Changes state and/or note. When the caller says which version it saw
 * (`expected`: the row's updated_at, or null for never-edited), the write
 * only lands if the row still has that version; otherwise StaleSubmission
 * carries the current row back so the admin sees what changed.
 */
export async function updateSubmission(
  id: string,
  patch: { state?: SubmissionState; note?: string | null },
  expected: string | null | undefined,
): Promise<{ row: StoredSubmission; before: StoredSubmission } | null> {
  const before = await getSubmission(id);
  if (!before) return null;

  const withVersion = await hasVersionColumn();
  const filter = new URLSearchParams({ id: `eq.${id}`, select: "*" });
  if (withVersion && expected !== undefined) filter.set("updated_at", expected === null ? "is.null" : `eq.${expected}`);

  const rows = await rest<StoredSubmission[]>(`submissions?${filter}`, {
    method: "PATCH",
    body: JSON.stringify(withVersion ? { ...patch, updated_at: new Date().toISOString() } : patch),
    prefer: "return=representation",
  });
  if (!rows[0]) {
    const current = await getSubmission(id);
    if (!current) return null;
    throw new StaleSubmission(current);
  }
  return { row: rows[0], before };
}

export async function deleteSubmission(id: string): Promise<StoredSubmission | null> {
  const rows = await rest<StoredSubmission[]>(`submissions?${new URLSearchParams({ id: `eq.${id}` })}`, {
    method: "DELETE",
    prefer: "return=representation",
  });
  return rows[0] ?? null;
}

/** Row counts by state and by kind of new items — one tiny request each, run in parallel. */
export async function submissionCounts() {
  const count = async (params: Record<string, string>) =>
    (await restPage(`submissions?${new URLSearchParams({ select: "id", limit: "1", ...params })}`)).total;
  const [total, ...byState] = await Promise.all([
    count({}),
    ...SUBMISSION_STATES.map((s) => count({ state: `eq.${s}` })),
  ]);
  const newByKind = await Promise.all(SUBMISSION_KINDS.map((k) => count({ kind: `eq.${k}`, state: "eq.new" })));
  return {
    total,
    byState: Object.fromEntries(SUBMISSION_STATES.map((s, i) => [s, byState[i]])) as Record<SubmissionState, number>,
    newByKind: Object.fromEntries(SUBMISSION_KINDS.map((k, i) => [k, newByKind[i]])) as Record<SubmissionKind, number>,
  };
}

/** Moves many rows to one state in a single request. Returns the rows changed. */
export async function bulkSetState(ids: string[], state: SubmissionState): Promise<StoredSubmission[]> {
  const withVersion = await hasVersionColumn();
  return rest<StoredSubmission[]>(`submissions?${new URLSearchParams({ id: `in.(${ids.join(",")})`, select: "*" })}`, {
    method: "PATCH",
    body: JSON.stringify(withVersion ? { state, updated_at: new Date().toISOString() } : { state }),
    prefer: "return=representation",
  });
}

export async function bulkDelete(ids: string[]): Promise<StoredSubmission[]> {
  return rest<StoredSubmission[]>(`submissions?${new URLSearchParams({ id: `in.(${ids.join(",")})` })}`, {
    method: "DELETE",
    prefer: "return=representation",
  });
}
