"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { KIND_LABEL, STATE_LABEL, SUBMISSION_KINDS, SUBMISSION_STATES, type SubmissionKind, type SubmissionState } from "@/lib/submission-types";
import { api, explain } from "./api";
import { Btn, ErrorState, LoadingRows, Notice, useCms, useToast } from "./kit";

type Stats = {
  cms: "missing" | "empty" | "ready" | null;
  submissions: { total: number; byState: Record<SubmissionState, number>; newByKind: Record<SubmissionKind, number> } | null;
  projects: number | null;
  drafts: number | null;
  events: number | null;
  team: number | null;
  announcements: number | null;
  recent: { id: number; at: string; actor: string; summary: string | null; action: string }[] | null;
};

const when = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

function Tile({ label, value, href, hint }: { label: string; value: number | null | undefined; href: string; hint?: string }) {
  return (
    <li className="bg-void">
      <Link href={href} className="block h-full p-5 transition-colors hover:bg-surface">
        <div className="font-mono text-micro uppercase text-ink-faint">{label}</div>
        <div className="mt-3 text-3xl font-semibold tracking-[-0.04em] tnum">{value ?? "—"}</div>
        {hint ? <div className="mt-1 text-xs text-ink-faint">{hint}</div> : null}
      </Link>
    </li>
  );
}

/** Setup steps, then live numbers from the database. Nothing here is a demo figure. */
export function Dashboard() {
  const { status, content, audit, refresh } = useCms();
  const toast = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState<"init" | "content" | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setStats(await api<Stats>("/api/admin/stats"));
    } catch (e) {
      setError(e);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, status]);

  async function run(kind: "init" | "content") {
    setLoading(kind);
    try {
      const body = await api<{ loaded?: string[] }>(kind === "init" ? "/api/admin/cms/init" : "/api/admin/cms/init-content", { method: "POST" });
      toast("ok", kind === "init" ? "Website content loaded. Everything is now editable here." : `Loaded ${body.loaded?.join(", ") || "content"} into the CMS.`);
      refresh();
      load();
    } catch (e) {
      toast("error", explain(e));
    } finally {
      setLoading(null);
    }
  }

  const contentMissing = content ? Object.values(content).some((v) => v === "missing") : false;
  const contentEmpty = content ? Object.values(content).some((v) => v === "empty") : false;
  const sub = stats?.submissions;

  return (
    <div className="space-y-10">
      {status === "missing" ? (
        <Notice tone="warn" title="Step 1 · Create the CMS tables">
          <ol className="list-decimal space-y-1 pl-5">
            <li>Open your Supabase project → SQL Editor → New query.</li>
            <li>
              Paste the contents of <code className="font-mono text-ink">supabase/cms.sql</code> from the repository and run it.
            </li>
            <li>Reload this page.</li>
          </ol>
          <p className="mt-2">The public site keeps showing its current content the whole time.</p>
        </Notice>
      ) : null}

      {status === "empty" ? (
        <Notice tone="warn" title="Step 2 · Load the current website content">
          <p>Copies settings, navigation, homepage text, team and projects into the database so you can edit them here. Visitors see no change.</p>
          <Btn tone="primary" className="mt-4" onClick={() => run("init")} disabled={loading !== null}>
            {loading === "init" ? "Loading content…" : "Load current website content"}
          </Btn>
        </Notice>
      ) : null}

      {status === "ready" && (contentMissing || !audit) ? (
        <Notice tone="warn" title="Step 3 · Run supabase/admin.sql">
          <p>
            Adds the audit log, safe concurrent editing for submissions, and the tables for problem statements, ideas,
            research, working teams and activity. It changes no existing data. Run it in the Supabase SQL editor, then
            reload this page.
          </p>
        </Notice>
      ) : null}

      {status === "ready" && !contentMissing && contentEmpty ? (
        <Notice tone="warn" title="Step 4 · Load the remaining content">
          <p>Copies the problem statements, ideas, research, working teams and activity log into the database so they become editable. Visitors see no change.</p>
          <Btn tone="primary" className="mt-4" onClick={() => run("content")} disabled={loading !== null}>
            {loading === "content" ? "Loading…" : "Load remaining content"}
          </Btn>
        </Notice>
      ) : null}

      {status === "error" ? (
        <Notice tone="error" title="Could not reach the database">
          Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the deployment settings.
        </Notice>
      ) : null}

      {error ? (
        <ErrorState error={error} retry={load} />
      ) : !stats ? (
        <LoadingRows rows={3} />
      ) : (
        <>
          <section aria-labelledby="dash-subs">
            <div className="flex items-baseline justify-between">
              <h2 id="dash-subs" className="font-mono text-label uppercase text-ink">
                Submissions
              </h2>
              <Btn size="sm" tone="ghost" onClick={load}>
                Refresh
              </Btn>
            </div>
            <ul className="mt-3 grid gap-px border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
              <Tile label="Total" value={sub?.total} href="/admin/submissions" />
              {SUBMISSION_STATES.map((st) => (
                <Tile key={st} label={STATE_LABEL[st]} value={sub?.byState[st]} href={`/admin/submissions?state=${st}`} />
              ))}
            </ul>
            {sub ? (
              <p className="mt-3 text-sm text-ink-muted">
                New:{" "}
                {SUBMISSION_KINDS.map((k, i) => (
                  <span key={k}>
                    {i ? " · " : ""}
                    <Link href={`/admin/submissions?kind=${k}&state=new`} className="hover:text-ink">
                      {sub.newByKind[k]} {KIND_LABEL[k].toLowerCase()}
                    </Link>
                  </span>
                ))}
              </p>
            ) : null}
          </section>

          <section aria-labelledby="dash-site">
            <h2 id="dash-site" className="font-mono text-label uppercase text-ink">
              Website
            </h2>
            <ul className="mt-3 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
              <Tile label="Published projects" value={stats.projects} href="/admin/projects" />
              <Tile label="Project drafts" value={stats.drafts} href="/admin/projects" />
              <Tile label="Upcoming events" value={stats.events} href="/admin/events" />
              <Tile label="Team members" value={stats.team} href="/admin/team" />
              <Tile label="Live announcements" value={stats.announcements} href="/admin/announcements" />
            </ul>
          </section>

          <section aria-labelledby="dash-log">
            <div className="flex items-baseline justify-between">
              <h2 id="dash-log" className="font-mono text-label uppercase text-ink">
                Recent admin activity
              </h2>
              <Link href="/admin/audit" className="font-mono text-micro uppercase text-acm-bright hover:text-ink">
                Full log →
              </Link>
            </div>
            {stats.recent === null ? (
              <p className="mt-3 text-sm text-ink-faint">The audit log starts once supabase/admin.sql has been run.</p>
            ) : stats.recent.length === 0 ? (
              <p className="mt-3 text-sm text-ink-faint">Nothing yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line border border-line">
                {stats.recent.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-2.5 text-sm">
                    <span className="w-28 shrink-0 text-xs text-ink-faint">{when(r.at)}</span>
                    <span className="text-ink">{r.actor}</span>
                    <span className="min-w-0 flex-1 text-ink-muted">{r.summary ?? r.action}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
