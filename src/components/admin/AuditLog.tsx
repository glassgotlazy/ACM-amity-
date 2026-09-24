"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { api } from "./cms/api";
import { Btn, EmptyState, ErrorState, LoadingRows, Notice } from "./cms/kit";

type Row = { id: number; at: string; actor: string; action: string; entity: string | null; entity_id: string | null; summary: string | null };
type Page = { ready: boolean; rows: Row[]; total: number; page: number; per: number };

const ACTIONS: [string, string][] = [
  ["", "All actions"],
  ["login", "Sign-ins"],
  ["login_failed", "Failed sign-ins"],
  ["status", "Status changes"],
  ["create", "Created"],
  ["update", "Updated"],
  ["delete", "Deleted"],
  ["upload", "Uploads"],
  ["export", "Exports"],
];

const TONE: Record<string, string> = { delete: "text-acm-bright", login_failed: "text-acm-bright", status: "text-signal-work", create: "text-signal-live" };

const when = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit" }).format(new Date(iso));

/** Every admin action, newest first. Read-only. */
export function AuditLog() {
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page | null>(null);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await api<Page>(`/api/admin/audit?page=${page}&per=50${action ? `&action=${action}` : ""}`));
    } catch (e) {
      setError(e);
    }
  }, [page, action]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <ErrorState error={error} retry={load} />;
  if (!data) return <LoadingRows rows={8} />;
  if (!data.ready) {
    return (
      <Notice tone="warn" title="Audit log not set up">
        Run <code className="font-mono text-ink">supabase/admin.sql</code> in the Supabase SQL editor to start recording admin actions.
      </Notice>
    );
  }

  const pages = Math.max(1, Math.ceil(data.total / data.per));
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="block">
          <span className="block font-mono text-micro uppercase text-ink-faint">Show</span>
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="mt-1 h-10 border border-line bg-surface px-3 text-sm text-ink focus:border-acm focus:outline-none"
          >
            {ACTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-ink-muted">{data.total} entries</p>
      </div>
      <div className="mt-4">
        {data.rows.length === 0 ? (
          <EmptyState title="No entries">Nothing has been recorded for this filter yet.</EmptyState>
        ) : (
          <div className="relative overflow-x-auto border border-line">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-line bg-surface">
                <tr>
                  {["When", "Who", "Action", "What"].map((h) => (
                    <th key={h} scope="col" className="px-3 py-3 font-mono text-micro font-normal uppercase text-ink-faint">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.id} className="border-b border-line last:border-b-0">
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-ink-faint">{when(r.at)}</td>
                    <td className="px-3 py-2.5 text-ink">{r.actor}</td>
                    <td className={cn("px-3 py-2.5 font-mono text-micro uppercase", TONE[r.action] ?? "text-ink-muted")}>{r.action.replace("_", " ")}</td>
                    <td className="px-3 py-2.5 text-ink-muted">{r.summary ?? `${r.entity ?? ""} ${r.entity_id ?? ""}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {pages > 1 ? (
        <nav aria-label="Pages" className="mt-4 flex items-center justify-between">
          <Btn size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            ← Newer
          </Btn>
          <span className="text-sm text-ink-muted">
            Page {page} of {pages}
          </span>
          <Btn size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            Older →
          </Btn>
        </nav>
      ) : null}
    </div>
  );
}
