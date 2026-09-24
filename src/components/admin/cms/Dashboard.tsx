"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, explain } from "./api";
import { Btn, LoadingRows, Notice, useCms, useToast } from "./kit";

type Counts = Record<string, number | null>;

async function count(path: string, filter?: (r: Record<string, unknown>) => boolean): Promise<number | null> {
  try {
    const body = await api<{ rows: Record<string, unknown>[] }>(path);
    return filter ? body.rows.filter(filter).length : body.rows.length;
  } catch {
    return null;
  }
}

const TILES: { key: string; label: string; href: string }[] = [
  { key: "applications", label: "New applications", href: "/admin/submissions" },
  { key: "problems", label: "New problem submissions", href: "/admin/submissions?tab=problem-submission" },
  { key: "projects", label: "Published projects", href: "/admin/projects" },
  { key: "events", label: "Upcoming events", href: "/admin/events" },
  { key: "team", label: "Team members", href: "/admin/team" },
  { key: "announcements", label: "Live announcements", href: "/admin/announcements" },
];

export function Dashboard() {
  const { status, refresh } = useCms();
  const toast = useToast();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const queue = await Promise.all([
        count("/api/admin/submissions?kind=project-application&state=new"),
        count("/api/admin/submissions?kind=problem-submission&state=new"),
      ]);
      const content =
        status === "ready"
          ? await Promise.all([
              count("/api/admin/cms/projects", (r) => r.published === true),
              count(
                "/api/admin/cms/events",
                (r) =>
                  r.published === true &&
                  (r.status === "upcoming" || r.status === "ongoing") &&
                  new Date(String(r.ends_at ?? r.starts_at)).getTime() >= Date.now(),
              ),
              count("/api/admin/cms/team", (r) => r.published === true),
              count("/api/admin/cms/announcements", (r) => r.published === true),
            ])
          : [null, null, null, null];
      if (alive)
        setCounts({
          applications: queue[0],
          problems: queue[1],
          projects: content[0],
          events: content[1],
          team: content[2],
          announcements: content[3],
        });
    })();
    return () => {
      alive = false;
    };
  }, [status]);

  async function initialise() {
    setLoading(true);
    try {
      await api("/api/admin/cms/init", { method: "POST" });
      toast("ok", "Website content loaded. Everything is now editable here.");
      refresh();
    } catch (e) {
      toast("error", explain(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      {status === "missing" ? (
        <Notice tone="warn" title="Step 1 · Create the CMS tables">
          <ol className="list-decimal space-y-1 pl-5">
            <li>Open your Supabase project → SQL Editor → New query.</li>
            <li>
              Paste the contents of <code className="font-mono text-ink">supabase/cms.sql</code> from the repository and
              run it.
            </li>
            <li>Reload this page.</li>
          </ol>
          <p className="mt-2">The public site keeps showing its current content the whole time.</p>
        </Notice>
      ) : null}

      {status === "empty" ? (
        <Notice tone="warn" title="Step 2 · Load the current website content">
          <p>
            Copies everything the site shows today — settings, navigation, homepage text, team, projects — into the
            database, so you can edit it here. Visitors see no change.
          </p>
          <Btn tone="primary" className="mt-4" onClick={initialise} disabled={loading}>
            {loading ? "Loading content…" : "Load current website content"}
          </Btn>
        </Notice>
      ) : null}

      {status === "error" ? (
        <Notice tone="error" title="Could not reach the database">
          Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the deployment settings.
        </Notice>
      ) : null}

      {counts === null ? (
        <LoadingRows rows={2} />
      ) : (
        <ul className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {TILES.map((t) => (
            <li key={t.key} className="bg-void">
              <Link href={t.href} className="block p-6 transition-colors hover:bg-surface">
                <div className="font-mono text-label uppercase text-ink-faint">{t.label}</div>
                <div className="mt-4 text-4xl font-semibold tracking-[-0.04em] tnum">{counts[t.key] ?? "—"}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby="quick">
        <h2 id="quick" className="font-mono text-label uppercase text-ink">
          Common tasks
        </h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Change the site name or logo", "/admin/settings"],
            ["Edit the homepage heading", "/admin/homepage"],
            ["Add an event", "/admin/events"],
            ["Publish a project", "/admin/projects"],
            ["Add a team member", "/admin/team"],
            ["Change the menu links", "/admin/navigation"],
          ].map(([label, href]) => (
            <li key={href + label}>
              <Link href={href} className="flex items-center justify-between border border-line px-4 py-3 text-sm text-ink-muted transition-colors hover:border-line-strong hover:text-ink">
                {label}
                <span aria-hidden>→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
