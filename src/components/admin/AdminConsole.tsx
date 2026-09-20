"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { adminStats, applications, submissions, STATE_TONE } from "@/data/admin";
import { projects, allOpenRoles } from "@/data/projects";
import { problems } from "@/data/problems";
import { teams } from "@/data/teams";
import { researchProjects } from "@/data/research";
import { activity } from "@/data/activity";
import { StatusPill } from "@/components/ui/Badges";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

const TABS = ["Overview", "Applications", "Submissions", "Projects", "Problems", "Teams", "Research", "Activity"] as const;
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
      </nav>

      <motion.div
        key={tab}
        initial={reduce ? undefined : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease }}
        className="mt-12"
      >
        {tab === "Overview" ? <Overview /> : null}
        {tab === "Applications" ? <Applications /> : null}
        {tab === "Submissions" ? <Submissions /> : null}
        {tab === "Projects" ? <ProjectsTable /> : null}
        {tab === "Problems" ? <ProblemsTable /> : null}
        {tab === "Teams" ? <TeamsTable /> : null}
        {tab === "Research" ? <ResearchTable /> : null}
        {tab === "Activity" ? <ActivityTable /> : null}
      </motion.div>
    </div>
  );
}

function Overview() {
  const reduce = useReducedMotion();
  return (
    <div className="space-y-14">
      <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-5">
        {adminStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="bg-void p-7"
            initial={reduce ? undefined : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
          >
            <div className="meta">{stat.label}</div>
            <div className="mt-5 text-5xl tnum tracking-[-0.04em]">{stat.value}</div>
            <div className="mt-4 font-mono text-micro uppercase text-acm">{stat.delta}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-px bg-line lg:grid-cols-2">
        <Panel title="Needs attention">
          <ul className="space-y-4">
            {[
              `${applications.filter((a) => a.state === "new").length} applications have not been opened.`,
              `${submissions.filter((s) => s.state === "queued").length} problem submissions are waiting for review.`,
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
              { ok: true, text: "Profile, activity and admin figures are marked as demo data." },
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

function Applications() {
  return (
    <Table head={["ID", "Applicant", "Course", "Applying to", "Role", "State", "Received"]}>
      {applications.map((a, i) => (
        <Row key={a.id} index={i}>
          <td className={cn(cell, "font-mono text-micro uppercase text-ink-ghost")}>{a.id}</td>
          <td className={cn(cell, "text-ink")}>{a.name}</td>
          <td className={cell}>{a.course}</td>
          <td className={cell}>{a.target}</td>
          <td className={cell}>{a.role}</td>
          <td className={cn(cell, "font-mono text-micro uppercase", STATE_TONE[a.state])}>{a.state}</td>
          <td className={cn(cell, "font-mono text-micro uppercase text-ink-ghost")}>{a.when}</td>
        </Row>
      ))}
    </Table>
  );
}

function Submissions() {
  return (
    <>
      <p className="mb-8 max-w-2xl font-mono text-micro uppercase leading-relaxed text-ink-ghost">
        Submissions are never published automatically. A queued item is not visible anywhere on the public site.
      </p>
      <Table head={["ID", "Problem", "Area", "Submitted", "State", "Received"]}>
        {submissions.map((s, i) => (
          <Row key={s.id} index={i}>
            <td className={cn(cell, "font-mono text-micro uppercase text-ink-ghost")}>{s.id}</td>
            <td className={cn(cell, "text-ink")}>{s.title}</td>
            <td className={cell}>{s.area}</td>
            <td className={cn(cell, "font-mono text-micro uppercase text-ink-ghost")}>
              {s.anonymous ? "Anonymous" : "Named"}
            </td>
            <td className={cn(cell, "font-mono text-micro uppercase", STATE_TONE[s.state])}>{s.state}</td>
            <td className={cn(cell, "font-mono text-micro uppercase text-ink-ghost")}>{s.when}</td>
          </Row>
        ))}
      </Table>
    </>
  );
}

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
            <Link href={`/projects/${p.slug}`} className="font-mono text-micro uppercase text-acm-bright hover:text-white">
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
            <Link href={`/problems/${p.slug}`} className="font-mono text-micro uppercase text-acm-bright hover:text-white">
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
