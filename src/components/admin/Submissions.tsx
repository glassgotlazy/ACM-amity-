"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CATEGORY,
  FIELD_GROUPS,
  KIND_LABEL,
  STATE_LABEL,
  SUBMISSION_KINDS,
  SUBMISSION_STATES,
  submissionTitle,
  type StoredSubmission,
  type SubmissionKind,
  type SubmissionState,
} from "@/lib/submission-types";
import { cn } from "@/lib/utils";
import { api, ApiError, explain } from "./cms/api";
import { Btn, ConfirmDialog, Drawer, EmptyState, ErrorState, LoadingRows, useToast } from "./cms/kit";

type Page = { rows: StoredSubmission[]; total: number; page: number; per: number };

const STATE_TONE: Record<SubmissionState, string> = {
  new: "text-acm-bright",
  reviewing: "text-signal-work",
  accepted: "text-signal-live",
  published: "text-signal-live",
  declined: "text-ink-ghost",
};

const FILTER_KEYS = ["kind", "state", "category", "q", "from", "to", "sort", "page"] as const;

const control =
  "h-10 border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-ghost focus:border-acm focus:outline-none";

const fmt = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

/** The version to send back with an edit: null for a never-edited row, undefined when the column does not exist yet. */
const versionOf = (row: StoredSubmission) => ("updated_at" in row ? (row.updated_at ?? null) : undefined);

function str(v: unknown): string {
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function Manager() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();

  // Filters live in the URL, so a refresh or a shared link shows the same view.
  const filters = useMemo(() => Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) ?? ""])) as Record<(typeof FILTER_KEYS)[number], string>, [params]);
  const kind = (SUBMISSION_KINDS as readonly string[]).includes(filters.kind) ? (filters.kind as SubmissionKind) : null;

  // Two quick changes (From, then To) must not start from the same stale
  // URL, or the second would drop the first: keep the pending query here
  // until the router catches up.
  const pending = useRef<string | null>(null);
  useEffect(() => {
    pending.current = null;
  }, [params]);

  const setFilters = useCallback(
    (patch: Partial<Record<(typeof FILTER_KEYS)[number], string>>) => {
      const next = new URLSearchParams(pending.current ?? params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      // Any filter change goes back to the first page.
      if (!("page" in patch)) next.delete("page");
      if ("kind" in patch) next.delete("category");
      pending.current = next.toString();
      router.replace(`/admin/submissions${next.toString() ? `?${next}` : ""}`, { scroll: false });
    },
    [params, router],
  );

  // Debounced search: the request goes out 300 ms after typing stops.
  const [search, setSearch] = useState(filters.q);
  useEffect(() => setSearch(filters.q), [filters.q]);
  useEffect(() => {
    if (search === filters.q) return;
    const t = setTimeout(() => setFilters({ q: search.trim() }), 300);
    return () => clearTimeout(t);
  }, [search, filters.q, setFilters]);

  const [data, setData] = useState<Page | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const request = useRef(0);

  const query = useMemo(() => {
    const q = new URLSearchParams();
    for (const k of FILTER_KEYS) if (filters[k]) q.set(k, filters[k]);
    q.set("per", "25");
    return q.toString();
  }, [filters]);

  const load = useCallback(async () => {
    const id = ++request.current;
    setLoading(true);
    setError(null);
    try {
      const body = await api<Page>(`/api/admin/submissions?${query}`);
      if (id === request.current) setData(body);
    } catch (e) {
      if (id === request.current) setError(e);
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  /** Status change from the table. The row only changes once the database confirms it. */
  async function changeState(row: StoredSubmission, state: SubmissionState) {
    setBusy(row.id);
    try {
      const { row: saved } = await api<{ row: StoredSubmission }>(`/api/admin/submissions/${row.id}`, {
        method: "PATCH",
        json: { state, expected_updated_at: versionOf(row) },
      });
      setData((d) => (d ? { ...d, rows: d.rows.map((r) => (r.id === row.id ? saved : r)) } : d));
      toast("ok", `Status set to ${STATE_LABEL[state]}.`);
    } catch (e) {
      if (e instanceof ApiError && e.code === "stale") {
        const current = e.extra.current as StoredSubmission;
        setData((d) => (d ? { ...d, rows: d.rows.map((r) => (r.id === row.id ? current : r)) } : d));
        toast("error", `Someone else changed this to ${STATE_LABEL[current.state]} first. Nothing was overwritten.`);
      } else {
        toast("error", `Unable to update the status. ${explain(e)}`);
      }
    } finally {
      setBusy(null);
    }
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / data.per)) : 1;
  const page = data?.page ?? 1;

  return (
    <div>
      {/* Type tabs */}
      <div role="tablist" aria-label="Submission type" className="flex flex-wrap gap-1 border-b border-line">
        {[{ k: "", label: "All" }, ...SUBMISSION_KINDS.map((k) => ({ k, label: KIND_LABEL[k] }))].map((t) => (
          <button
            key={t.k || "all"}
            type="button"
            role="tab"
            aria-selected={filters.kind === t.k}
            onClick={() => setFilters({ kind: t.k })}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 font-mono text-label uppercase transition-colors",
              filters.kind === t.k ? "border-acm text-ink" : "border-transparent text-ink-faint hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-[1.4fr_repeat(5,auto)] lg:items-end">
        <label className="col-span-2 block lg:col-span-1">
          <span className="block font-mono text-micro uppercase text-ink-faint">Search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search submissions"
            placeholder="Name, email, project…"
            className={cn(control, "mt-1 w-full")}
          />
        </label>
        <label className="block">
          <span className="block font-mono text-micro uppercase text-ink-faint">Status</span>
          <select aria-label="Status" value={filters.state} onChange={(e) => setFilters({ state: e.target.value })} className={cn(control, "mt-1 w-full")}>
            <option value="">Any status</option>
            {SUBMISSION_STATES.map((st) => (
              <option key={st} value={st}>
                {STATE_LABEL[st]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block font-mono text-micro uppercase text-ink-faint">{kind ? CATEGORY[kind].label : "Category"}</span>
          <select
            aria-label={kind ? CATEGORY[kind].label : "Category"}
            value={filters.category}
            onChange={(e) => setFilters({ category: e.target.value })}
            disabled={!kind}
            title={kind ? undefined : "Pick a type first"}
            className={cn(control, "mt-1 w-full disabled:opacity-50")}
          >
            <option value="">{kind ? "Any" : "Pick a type first"}</option>
            {kind
              ? CATEGORY[kind].options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))
              : null}
          </select>
        </label>
        <label className="block">
          <span className="block font-mono text-micro uppercase text-ink-faint">From</span>
          <input type="date" aria-label="From" value={filters.from} onChange={(e) => setFilters({ from: e.target.value })} className={cn(control, "mt-1 w-full")} />
        </label>
        <label className="block">
          <span className="block font-mono text-micro uppercase text-ink-faint">To</span>
          <input type="date" aria-label="To" value={filters.to} onChange={(e) => setFilters({ to: e.target.value })} className={cn(control, "mt-1 w-full")} />
        </label>
        <label className="block">
          <span className="block font-mono text-micro uppercase text-ink-faint">Sort</span>
          <select aria-label="Sort" value={filters.sort || "newest"} onChange={(e) => setFilters({ sort: e.target.value === "newest" ? "" : e.target.value })} className={cn(control, "mt-1 w-full")}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted" aria-live="polite">
          {data ? `${data.total} submission${data.total === 1 ? "" : "s"}${loading ? " · updating…" : ""}` : "Loading…"}
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.values(filters).some(Boolean) ? (
            <Btn
              size="sm"
              tone="ghost"
              onClick={() => {
                pending.current = "";
                setSearch("");
                router.replace("/admin/submissions", { scroll: false });
              }}
            >
              Clear filters
            </Btn>
          ) : null}
          <a
            href={`/api/admin/submissions/export?${query}`}
            className="inline-flex h-8 items-center border border-line-strong px-3 font-mono text-micro uppercase text-ink transition-colors hover:border-ink-faint"
          >
            Export CSV
          </a>
          <Btn size="sm" onClick={load} disabled={loading}>
            Refresh
          </Btn>
        </div>
      </div>

      <div className="mt-4">
        {error ? (
          <ErrorState error={error} retry={load} />
        ) : !data ? (
          <LoadingRows rows={6} />
        ) : data.rows.length === 0 ? (
          <EmptyState title="No submissions found">
            {Object.values(filters).some(Boolean) ? "Nothing matches these filters." : "New applications, problems and proposals appear here as soon as they are sent."}
          </EmptyState>
        ) : (
          <div className={cn("relative overflow-x-auto border border-line transition-opacity", loading && "opacity-60")}>
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead className="border-b border-line bg-surface">
                <tr>
                  {["Received", "Type", "Submission", "Contact", "Status", ""].map((h) => (
                    <th key={h || "actions"} scope="col" className="px-3 py-3 font-mono text-micro font-normal uppercase text-ink-faint">
                      {h || <span className="sr-only">Actions</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => {
                  const p = row.payload;
                  const contact = row.anonymous ? "Anonymous" : str(p.email) || str(p.name) || "—";
                  return (
                    <tr key={row.id} className="border-b border-line last:border-b-0 hover:bg-surface/60">
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-ink-faint">{fmt(row.created_at)}</td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-micro uppercase text-ink-muted">{KIND_LABEL[row.kind]}</td>
                      <td className="max-w-[22rem] px-3 py-3">
                        <button type="button" onClick={() => setOpenId(row.id)} className="line-clamp-2 text-left font-medium text-ink hover:text-acm-bright">
                          {submissionTitle(row)}
                        </button>
                        {row.note ? <span className="mt-0.5 block truncate text-xs text-ink-faint">Note: {row.note}</span> : null}
                      </td>
                      <td className="max-w-[14rem] truncate px-3 py-3 text-ink-muted">{contact}</td>
                      <td className="px-3 py-2">
                        <select
                          aria-label={`Status of ${submissionTitle(row)}`}
                          value={row.state}
                          disabled={busy === row.id}
                          onChange={(e) => changeState(row, e.target.value as SubmissionState)}
                          className={cn("h-9 border border-line bg-void px-2 font-mono text-micro uppercase focus:border-acm focus:outline-none disabled:opacity-50", STATE_TONE[row.state])}
                        >
                          {SUBMISSION_STATES.map((st) => (
                            <option key={st} value={st}>
                              {STATE_LABEL[st]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Btn size="sm" tone="ghost" onClick={() => setOpenId(row.id)} aria-label={`Open ${submissionTitle(row)}`}>
                          Open
                        </Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && data.total > data.per ? (
        <nav aria-label="Pages" className="mt-4 flex items-center justify-between gap-3">
          <Btn size="sm" disabled={page <= 1 || loading} onClick={() => setFilters({ page: String(page - 1) })}>
            ← Previous
          </Btn>
          <span className="text-sm text-ink-muted">
            Page {page} of {pages}
          </span>
          <Btn size="sm" disabled={page >= pages || loading} onClick={() => setFilters({ page: String(page + 1) })}>
            Next →
          </Btn>
        </nav>
      ) : null}

      <Detail
        id={openId}
        onClose={() => setOpenId(null)}
        onChanged={(row) => setData((d) => (d ? { ...d, rows: d.rows.map((r) => (r.id === row.id ? row : r)) } : d))}
        onDeleted={() => {
          setOpenId(null);
          load();
        }}
      />
    </div>
  );
}

/** Full record, always fetched fresh when opened. */
function Detail({
  id,
  onClose,
  onChanged,
  onDeleted,
}: {
  id: string | null;
  onClose: () => void;
  onChanged: (row: StoredSubmission) => void;
  onDeleted: () => void;
}) {
  const toast = useToast();
  const [row, setRow] = useState<StoredSubmission | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [state, setState] = useState<SubmissionState>("new");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [stale, setStale] = useState<StoredSubmission | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [draft, setDraft] = useState<{ slug: string } | null>(null);

  const fetchRow = useCallback(async () => {
    if (!id) return;
    setRow(null);
    setError(null);
    setStale(null);
    setDraft(null);
    try {
      const { row } = await api<{ row: StoredSubmission }>(`/api/admin/submissions/${id}`);
      setRow(row);
      setState(row.state);
      setNote(row.note ?? "");
    } catch (e) {
      setError(e);
    }
  }, [id]);

  useEffect(() => {
    fetchRow();
  }, [fetchRow]);

  const dirty = row ? state !== row.state || note !== (row.note ?? "") : false;

  async function save(overwrite = false) {
    if (!row) return;
    setSaving(true);
    try {
      const { row: saved } = await api<{ row: StoredSubmission }>(`/api/admin/submissions/${row.id}`, {
        method: "PATCH",
        json: { state, note: note.trim() ? note : null, ...(overwrite ? {} : { expected_updated_at: versionOf(row) }) },
      });
      setRow(saved);
      setStale(null);
      onChanged(saved);
      toast("ok", "Changes saved.");
    } catch (e) {
      if (e instanceof ApiError && e.code === "stale") setStale(e.extra.current as StoredSubmission);
      toast("error", `Unable to save. ${explain(e)}`);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!row) return;
    setDeleting(true);
    try {
      await api(`/api/admin/submissions/${row.id}`, { method: "DELETE" });
      toast("ok", "Submission deleted.");
      setConfirmDelete(false);
      onDeleted();
    } catch (e) {
      toast("error", explain(e));
    } finally {
      setDeleting(false);
    }
  }

  async function toProject() {
    if (!row) return;
    setDrafting(true);
    try {
      const { project } = await api<{ project: { slug: string } }>(`/api/admin/submissions/${row.id}/project`, { method: "POST" });
      setDraft(project);
      toast("ok", "Draft project created. It stays hidden until you publish it.");
    } catch (e) {
      toast("error", explain(e));
    } finally {
      setDrafting(false);
    }
  }

  const groups = row ? FIELD_GROUPS[row.kind] : [];
  const listed = new Set(groups.flatMap((g) => g.fields.map(([k]) => k)));
  const other = row ? Object.keys(row.payload).filter((k) => !listed.has(k) && k !== "anonymous") : [];

  return (
    <>
      <Drawer
        open={id !== null}
        title={row ? submissionTitle(row).slice(0, 80) : "Submission"}
        onClose={onClose}
        footer={
          row ? (
            <>
              <Btn tone="danger" className="mr-auto" onClick={() => setConfirmDelete(true)}>
                Delete
              </Btn>
              <Btn onClick={onClose}>Close</Btn>
              <Btn tone="primary" onClick={() => save()} disabled={!dirty || saving}>
                {saving ? "Saving…" : "Save changes"}
              </Btn>
            </>
          ) : (
            <Btn onClick={onClose}>Close</Btn>
          )
        }
      >
        {error ? (
          <ErrorState error={error} retry={fetchRow} />
        ) : !row ? (
          <LoadingRows rows={5} />
        ) : (
          <div className="space-y-8">
            {stale ? (
              <div role="alert" className="border border-acm/60 bg-acm-wash px-4 py-3 text-sm text-ink-muted">
                <p className="font-medium text-ink">Someone else updated this submission after you opened it.</p>
                <p className="mt-1">
                  It is now <strong>{STATE_LABEL[stale.state]}</strong>
                  {stale.note ? ` with the note “${stale.note}”` : ""}. Nothing was overwritten.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Btn
                    size="sm"
                    onClick={() => {
                      setRow(stale);
                      setState(stale.state);
                      setNote(stale.note ?? "");
                      setStale(null);
                      onChanged(stale);
                    }}
                  >
                    Load their version
                  </Btn>
                  <Btn size="sm" tone="danger" onClick={() => save(true)} disabled={saving}>
                    Keep mine and overwrite
                  </Btn>
                </div>
              </div>
            ) : null}

            <section aria-labelledby="sub-admin" className="border border-line bg-surface p-4">
              <h3 id="sub-admin" className="font-mono text-label uppercase text-ink">
                Review
              </h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="block font-mono text-micro uppercase text-ink-faint">Status</span>
                  <select aria-label="Status" value={state} onChange={(e) => setState(e.target.value as SubmissionState)} className={cn(control, "mt-1 w-full", STATE_TONE[state])}>
                    {SUBMISSION_STATES.map((st) => (
                      <option key={st} value={st}>
                        {STATE_LABEL[st]}
                      </option>
                    ))}
                  </select>
                </label>
                <dl className="text-xs text-ink-faint">
                  <dt className="font-mono uppercase">Received</dt>
                  <dd className="mt-1 text-sm text-ink-muted">{fmt(row.created_at)}</dd>
                  {row.updated_at ? (
                    <>
                      <dt className="mt-2 font-mono uppercase">Last changed</dt>
                      <dd className="mt-1 text-sm text-ink-muted">{fmt(row.updated_at)}</dd>
                    </>
                  ) : null}
                </dl>
              </div>
              <label className="mt-4 block">
                <span className="block font-mono text-micro uppercase text-ink-faint">Private note</span>
                <textarea
                  aria-label="Private note"
                  rows={3}
                  maxLength={2000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Only admins see this."
                  className="mt-1 w-full resize-y border border-line bg-void px-3 py-2 text-sm text-ink focus:border-acm focus:outline-none"
                />
              </label>
              {row.kind === "project-proposal" ? (
                <div className="mt-4 border-t border-line pt-4">
                  {draft ? (
                    <p className="text-sm text-ink-muted">
                      Draft created.{" "}
                      <Link href="/admin/projects" className="text-acm-bright underline underline-offset-4">
                        Open Projects
                      </Link>{" "}
                      to finish and publish it.
                    </p>
                  ) : (
                    <>
                      <Btn size="sm" onClick={toProject} disabled={drafting}>
                        {drafting ? "Creating…" : "Create draft project from this proposal"}
                      </Btn>
                      <p className="mt-2 text-xs text-ink-faint">Pre-fills a hidden project from the proposal. Nothing is published until you do it under Projects.</p>
                    </>
                  )}
                </div>
              ) : null}
            </section>

            <section aria-labelledby="sub-info">
              <h3 id="sub-info" className="font-mono text-label uppercase text-ink">
                Submission
              </h3>
              <dl className="mt-3 grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-ink-faint">Type</dt>
                <dd className="text-ink">{KIND_LABEL[row.kind]}</dd>
                <dt className="text-ink-faint">Anonymous</dt>
                <dd className="text-ink">{row.anonymous ? "Yes — identity fields were cleared before sending" : "No"}</dd>
                <dt className="text-ink-faint">Reference</dt>
                <dd className="break-all font-mono text-xs text-ink-muted">{row.id}</dd>
              </dl>
            </section>

            {groups.map((g) => {
              const present = g.fields.filter(([k]) => str(row.payload[k]).trim());
              if (!present.length) return null;
              return (
                <section key={g.title} aria-label={g.title}>
                  <h3 className="font-mono text-label uppercase text-ink">{g.title}</h3>
                  <dl className="mt-3 space-y-3 text-sm">
                    {present.map(([k, label]) => (
                      <div key={k}>
                        <dt className="text-xs text-ink-faint">{label}</dt>
                        <dd className="mt-0.5 whitespace-pre-wrap break-words text-ink">
                          <Value field={k} value={row.payload[k]} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              );
            })}

            {other.length ? (
              <section aria-label="Other details">
                <h3 className="font-mono text-label uppercase text-ink">Other details</h3>
                <dl className="mt-3 space-y-3 text-sm">
                  {other.map((k) => (
                    <div key={k}>
                      <dt className="text-xs text-ink-faint">{k}</dt>
                      <dd className="mt-0.5 whitespace-pre-wrap break-words text-ink">
                        <Value field={k} value={row.payload[k]} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this submission?"
        busy={deleting}
        onConfirm={remove}
        onClose={() => setConfirmDelete(false)}
      >
        It is removed from the database for good. This cannot be undone. Use “Declined” instead if you only want it out of
        the way.
      </ConfirmDialog>
    </>
  );
}

/** Links become links (only http(s) and mailto — never javascript: or data:). */
function Value({ field, value }: { field: string; value: unknown }) {
  const text = str(value);
  if (field === "email" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    return (
      <a href={`mailto:${text}`} className="text-acm-bright underline underline-offset-4">
        {text}
      </a>
    );
  }
  if (/^https?:\/\/\S+$/i.test(text)) {
    return (
      <a href={text} target="_blank" rel="noreferrer noopener nofollow" className="break-all text-acm-bright underline underline-offset-4">
        {text}
      </a>
    );
  }
  return <>{text}</>;
}

/** The submissions queue: every form sent through the site, straight from Supabase. */
export function Submissions() {
  return (
    <Suspense fallback={<LoadingRows rows={6} />}>
      <Manager />
    </Suspense>
  );
}
