"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SUBMISSION_STATES, type StoredSubmission, type SubmissionKind, type SubmissionState } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

const STATE_TONE: Record<SubmissionState, string> = {
  new: "text-acm-bright",
  reviewing: "text-signal-work",
  accepted: "text-signal-live",
  published: "text-signal-live",
  declined: "text-ink-ghost",
};

const KIND_COLUMNS: Record<SubmissionKind, { head: string[]; cells: (p: Record<string, unknown>) => string[] }> = {
  join: {
    head: ["Name", "Course", "Interests", "Wants to build"],
    cells: (p) => [str(p.name), `${str(p.course)} · Y${str(p.year)}`, arr(p.interests), str(p.build)],
  },
  "project-application": {
    head: ["Name", "Project", "Role", "Why"],
    cells: (p) => [str(p.name), str(p.project), str(p.role), str(p.why)],
  },
  "problem-submission": {
    head: ["Problem", "Where", "Who", "Area"],
    cells: (p) => [str(p.what), str(p.where), str(p.who), str(p.area)],
  },
  "project-proposal": {
    head: ["Project", "From problem", "Roles", "Concept"],
    cells: (p) => [str(p.name), str(p.problem), arr(p.roles), str(p.concept)],
  },
};

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : "—");
const arr = (v: unknown) => (Array.isArray(v) && v.length ? v.join(", ") : "—");

type Status = "loading" | "ready" | "unconfigured" | "unauthorised" | "error";

/**
 * Live queue for one submission kind. Optimistic state changes with rollback;
 * one in-flight request per row so a double click cannot race itself.
 */
export function Queue({ kind, onCount }: { kind: SubmissionKind; onCount?: (n: number) => void }) {
  const [rows, setRows] = useState<StoredSubmission[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [stateFilter, setStateFilter] = useState<SubmissionState | "all">("all");
  const [open, setOpen] = useState<string | null>(null);
  const inFlight = useRef(new Set<string>());

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch(`/api/admin/submissions?kind=${kind}`, { cache: "no-store" });
      if (res.status === 401) return setStatus("unauthorised");
      if (res.status === 503) return setStatus("unconfigured");
      if (!res.ok) return setStatus("error");
      const data = (await res.json()) as { rows: StoredSubmission[] };
      setRows(data.rows);
      onCount?.(data.rows.filter((r) => r.state === "new").length);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [kind, onCount]);

  useEffect(() => {
    void load();
  }, [load]);

  const shown = useMemo(
    () => (stateFilter === "all" ? rows : rows.filter((r) => r.state === stateFilter)),
    [rows, stateFilter],
  );

  async function setState(id: string, state: SubmissionState) {
    if (inFlight.current.has(id)) return;
    inFlight.current.add(id);
    const before = rows;
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, state } : r)));
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { row } = (await res.json()) as { row: StoredSubmission };
      setRows((rs) => rs.map((r) => (r.id === id ? row : r)));
    } catch {
      setRows(before);
    } finally {
      inFlight.current.delete(id);
    }
  }

  const cols = KIND_COLUMNS[kind];

  if (status === "loading") {
    return (
      <div className="space-y-px" aria-busy="true" aria-label="Loading submissions">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="border-b border-line py-5">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="mt-3 h-3 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (status === "unconfigured") {
    return (
      <Notice tone="warn" title="Storage is not configured">
        Submissions are not being stored, so there is no queue to show. Set SUPABASE_URL and
        SUPABASE_SERVICE_ROLE_KEY, run supabase/schema.sql once, and redeploy.
      </Notice>
    );
  }
  if (status === "unauthorised") {
    return (
      <Notice tone="warn" title="Session expired">
        Sign in again to load the queue.
      </Notice>
    );
  }
  if (status === "error") {
    return (
      <Notice tone="warn" title="Could not load the queue">
        The storage request failed. <button type="button" onClick={load} className="underline underline-offset-4 hover:text-ink">Retry</button>.
      </Notice>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 border-b border-line pb-3">
        {(["all", ...SUBMISSION_STATES] as const).map((s) => {
          const n = s === "all" ? rows.length : rows.filter((r) => r.state === s).length;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStateFilter(s)}
              aria-pressed={stateFilter === s}
              className={cn(
                "px-3 py-2 font-mono text-label uppercase transition-colors",
                stateFilter === s ? "border border-line-strong bg-surface-raised text-ink" : "text-ink-faint hover:text-ink-muted",
              )}
            >
              {s} <span className={cn("ml-1.5 tnum", stateFilter === s ? "text-acm-bright" : "text-ink-ghost")}>{n}</span>
            </button>
          );
        })}
        <button type="button" onClick={load} className="ml-auto font-mono text-micro uppercase text-ink-ghost hover:text-ink">
          Refresh
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="py-16 text-center font-mono text-label uppercase text-ink-faint">
          {rows.length === 0 ? "Nothing here yet." : "Nothing in that state."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-line-strong">
                {["Received", ...cols.head, "State"].map((h) => (
                  <th key={h} scope="col" className="meta py-4 pr-6 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const cells = cols.cells(r.payload);
                const isOpen = open === r.id;
                return (
                  <tr key={r.id} className="group border-b border-line align-top">
                    <td className="py-4 pr-6 font-mono text-micro uppercase text-ink-ghost whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      {r.anonymous ? <span className="mt-1 block text-signal-idea">Anonymous</span> : null}
                    </td>
                    {cells.map((c, i) => (
                      <td key={i} className={cn("py-4 pr-6 text-sm", i === 0 ? "text-ink" : "text-ink-muted")}>
                        <button type="button" onClick={() => setOpen(isOpen ? null : r.id)} className="text-left">
                          <span className={cn("block", !isOpen && "line-clamp-2")}>{c}</span>
                        </button>
                        {isOpen && i === cells.length - 1 ? (
                          <pre className="mt-3 max-w-xl whitespace-pre-wrap border border-line bg-surface p-3 font-mono text-[0.6875rem] leading-relaxed text-ink-muted">
                            {JSON.stringify(r.payload, null, 2)}
                          </pre>
                        ) : null}
                      </td>
                    ))}
                    <td className="py-4">
                      <select
                        aria-label="Change state"
                        value={r.state}
                        onChange={(e) => setState(r.id, e.target.value as SubmissionState)}
                        className={cn("border border-line bg-transparent px-2 py-1.5 font-mono text-micro uppercase focus:border-acm focus:outline-none", STATE_TONE[r.state])}
                      >
                        {SUBMISSION_STATES.map((s) => (
                          <option key={s} value={s} className="bg-surface text-ink">{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Notice({ title, children, tone }: { title: string; children: React.ReactNode; tone: "warn" }) {
  return (
    <div role="status" className="border border-line px-6 py-8">
      <div className={cn("meta", tone === "warn" && "text-acm-bright")}>{title}</div>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-ink-muted">{children}</p>
    </div>
  );
}
