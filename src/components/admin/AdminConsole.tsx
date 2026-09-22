"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import { buildStats } from "@/data/admin";
import { Queue } from "./Queue";
import { projects, allOpenRoles } from "@/data/projects";
import { problems } from "@/data/problems";
import { teams } from "@/data/teams";
import { researchProjects } from "@/data/research";
import { activity } from "@/data/activity";
import { StatusPill } from "@/components/ui/Badges";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";
import { SignOut } from "./SignOut";

const TABS = ["Overview", "Applications", "Submissions", "Proposals", "Members", "Projects", "Problems", "Teams", "Research", "Activity"] as const;
type Tab = (typeof TABS)[number];

export function AdminConsole() {
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <div className="shell py-12">
      {/* Console chrome: a tab rail rather than a sidebar, so the data gets the width. */}
      <nav
        aria-label="Admin sections"
        className="sticky top-[4.5rem] z-40 -mx-gutter flex gap-1 overflow-x-auto border-b border-line bg-void/90 px-gutter py-3 backdrop-blur-xl"
      >
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-current={tab === t ? "page" : undefined}
            className={cn(
              "relative shrink-0 px-4 py-2 font-mono text-label uppercase transition-colors duration-200",
              tab === t ? "text-ink" : "text-ink-faint hover:text-ink-muted",
            )}
          >
            {tab === t && !reduce ? (
              <motion.span
                layoutId="admin-tab"
                className="absolute inset-0 border border-line-strong bg-surface-raised"
                transition={{ type: "spring", stiffness: 500, damping: 42 }}
              />
            ) : null}
            {tab === t && reduce ? <span className="absolute inset-0 border border-line-strong bg-surface-raised" /> : null}
            <span className="relative z-10">{t}</span>
          </button>
        ))}
        <span className="ml-auto flex items-center">
          <SignOut />
        </span>
      </nav>

      <motion.div
        key={tab}
        initial={reduce ? undefined : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease }}
        className="mt-12"
        aria-labelledby="admin-section"
      >
        <h2 id="admin-section" className="sr-only">
          {tab}
        </h2>

        {tab === "Overview" ? <Overview /> : null}
        {tab === "Applications" ? <Queue kind="project-application" /> : null}
        {tab === "Submissions" ? (
          <>
            <p className="mb-8 max-w-2xl font-mono text-micro uppercase leading-relaxed text-ink-ghost">
              Submissions are never published automatically. Nothing here is visible on the public site until it is
              written up as a problem statement.
            </p>
            <Queue kind="problem-submission" />
          </>
        ) : null}
        {tab === "Proposals" ? <Queue kind="project-proposal" /> : null}
        {tab === "Members" ? <Queue kind="join" /> : null}
        {tab === "Projects" ? <ProjectsTable /> : null}
        {tab === "Problems" ? <ProblemsTable /> : null}
        {tab === "Teams" ? <TeamsTable /> : null}
        {tab === "Research" ? <ResearchTable /> : null}
        {tab === "Activity" ? <ActivityTable /> : null}
      </motion.div>
    </div>
  );
}

function useQueueCounts() {
  const [counts, setCounts] = useState<{ apps: number | null; subs: number | null; ready: boolean }>({ apps: null, subs: null, ready: false });
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [a, s] = await Promise.all([
          fetch("/api/admin/submissions?kind=project-application&state=new", { cache: "no-store" }),
          fetch("/api/admin/submissions?kind=problem-submission&state=new", { cache: "no-store" }),
        ]);
        if (!alive) return;
        if (a.ok && s.ok) {
          const [ar, sr] = await Promise.all([a.json(), s.json()]);
          setCounts({ apps: ar.rows.length, subs: sr.rows.length, ready: true });
        } else setCounts({ apps: null, subs: null, ready: true });
      } catch {
        if (alive) setCounts({ apps: null, subs: null, ready: true });
      }
    })();
    return () => { alive = false; };
  }, []);
  return counts;
}

function Overview() {
  const reduce = useReducedMotion();
  const q = useQueueCounts();
  const stats = buildStats({
    newApplications: q.apps,
    queuedSubmissions: q.subs,
    projects: projects.length,
    needLeads: projects.filter((p) => p.team.every((t) => t.name === "Open")).length,
    openRoles: allOpenRoles().length,
    contributors: teams.reduce((n, t) => n + t.size, 0),
  });

  return (
    <div className="space-y-14">
      <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="bg-void p-7"
            initial={reduce ? undefined : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
          >
            <div className="meta">{stat.label}</div>
            <div className="mt-5 text-5xl tnum tracking-[-0.04em]">{stat.value}</div>
            <div className="mt-4 font-mono text-micro uppercase text-acm-bright">{stat.delta}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-px bg-line lg:grid-cols-2">
        <Panel title="Needs attention">
          <ul className="space-y-4">
            {[
              q.apps === null ? "Application queue: storage not configured." : `${q.apps} application${q.apps === 1 ? "" : "s"} not yet opened.`,
              q.subs === null ? "Submission queue: storage not configured." : `${q.subs} problem submission${q.subs === 1 ? "" : "s"} awaiting review.`,
              `${projects.filter((p) => p.team.every((t) => t.name === "Open")).length} project(s) have no lead assigned.`,
              `${allOpenRoles().length} roles are listed as open across all projects.`,
            ].map((line) => (
              <li key={line} className="flex gap-4 text-sm leading-relaxed text-ink-muted">
                <span aria-hidden className="mt-2 h-px w-4 shrink-0 bg-acm" />
                {line}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Content safety checks">
          <ul className="space-y-4">
            {[
              { ok: true, text: "Every problem statement carries a provenance label." },
              { ok: true, text: "No problem is presented as an official university brief." },
              { ok: true, text: "Every project declares what does not exist yet." },
              { ok: true, text: "Research pages state that no result is published or peer-reviewed." },
              { ok: true, text: "Applications and submissions are real stored records; only team sizes remain a demo figure." },
            ].map((check) => (
              <li key={check.text} className="flex gap-4 text-sm leading-relaxed text-ink-muted">
                <span aria-hidden className="mt-0.5 shrink-0 font-mono text-micro text-signal-live">
                  ✓
                </span>
                {check.text}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-void p-8 lg:p-10">
      <h3 className="meta border-b border-line pb-4">{title}</h3>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-line-strong">
            {head.map((h) => (
              <th key={h} scope="col" className="meta py-4 pr-6 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Row({ children, index }: { children: React.ReactNode; index: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.tr
      className="border-b border-line transition-colors duration-200 hover:bg-surface/50"
      initial={reduce ? undefined : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.2) }}
    >
      {children}
    </motion.tr>
  );
}

const cell = "py-4 pr-6 text-sm text-ink-muted align-top";



function ProjectsTable() {
  return (
    <Table head={["Project", "Category", "Status", "Open roles", "Progress", ""]}>
      {projects.map((p, i) => (
        <Row key={p.slug} index={i}>
          <td className={cn(cell, "text-ink")}>{p.name}</td>
          <td className={cell}>{p.category}</td>
          <td className={cell}>
            <StatusPill status={p.status} />
          </td>
          <td className={cn(cell, "tnum")}>{p.openRoles.length}</td>
          <td className={cn(cell, "tnum")}>{p.progress}%</td>
          <td className={cell}>
            <Link href={`/projects/${p.slug}`} className="font-mono text-micro uppercase text-acm-bright hover:text-ink">
              View →
            </Link>
          </td>
        </Row>
      ))}
    </Table>
  );
}

function ProblemsTable() {
  return (
    <Table head={["#", "Problem", "Category", "Level", "Roles", ""]}>
      {problems.map((p, i) => (
        <Row key={p.slug} index={i}>
          <td className={cn(cell, "font-mono text-micro tnum uppercase text-ink-ghost")}>
            {String(p.index).padStart(2, "0")}
          </td>
          <td className={cn(cell, "text-ink")}>{p.title}</td>
          <td className={cell}>{p.category}</td>
          <td className={cn(cell, "font-mono text-micro uppercase")}>{p.level}</td>
          <td className={cn(cell, "tnum")}>{p.openRoles.length}</td>
          <td className={cell}>
            <Link href={`/problems/${p.slug}`} className="font-mono text-micro uppercase text-acm-bright hover:text-ink">
              View →
            </Link>
          </td>
        </Row>
      ))}
    </Table>
  );
}

function TeamsTable() {
  return (
    <Table head={["Team", "Focus areas", "Projects", "Open positions", "Contributors"]}>
      {teams.map((t, i) => (
        <Row key={t.slug} index={i}>
          <td className={cn(cell, "text-ink")}>{t.name}</td>
          <td className={cell}>{t.works.join(", ")}</td>
          <td className={cn(cell, "tnum")}>{t.projects.length}</td>
          <td className={cn(cell, "tnum")}>{t.openPositions.length}</td>
          <td className={cn(cell, "tnum")}>
            {t.size} <span className="text-ink-ghost">(demo)</span>
          </td>
        </Row>
      ))}
    </Table>
  );
}

function ResearchTable() {
  return (
    <Table head={["Project", "Field", "Status", "Stage", "Papers"]}>
      {researchProjects.map((r, i) => (
        <Row key={r.slug} index={i}>
          <td className={cn(cell, "text-ink")}>{r.title}</td>
          <td className={cell}>{r.field}</td>
          <td className={cell}>
            <StatusPill status={r.status} />
          </td>
          <td className={cn(cell, "font-mono text-micro uppercase")}>
            {r.stages.find((s) => s.state === "active")?.name ?? "—"}
          </td>
          <td className={cn(cell, "tnum")}>0</td>
        </Row>
      ))}
    </Table>
  );
}

function ActivityTable() {
  return (
    <Table head={["Type", "Entry", "Actor", "When"]}>
      {activity.map((a, i) => (
        <Row key={a.id} index={i}>
          <td className={cn(cell, "font-mono text-micro uppercase text-ink-faint")}>{a.kind}</td>
          <td className={cn(cell, "text-ink")}>{a.text}</td>
          <td className={cell}>{a.actor}</td>
          <td className={cn(cell, "font-mono text-micro uppercase text-ink-ghost")}>{a.when}</td>
        </Row>
      ))}
    </Table>
  );
}
