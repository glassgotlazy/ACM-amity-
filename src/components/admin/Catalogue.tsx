"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { problems } from "@/data/problems";
import { teams } from "@/data/teams";
import { researchProjects } from "@/data/research";
import { activity } from "@/data/activity";
import { StatusPill } from "@/components/ui/Badges";
import { cn } from "@/lib/utils";

const TABS = ["Problems", "Teams", "Research", "Activity"] as const;
type Tab = (typeof TABS)[number];

/**
 * Read-only view of the content that still lives in the codebase (problem
 * statements, working teams, research and the activity log). Changing these
 * needs a code change; everything else is edited in the CMS sections.
 */
export function Catalogue() {
  const [tab, setTab] = useState<Tab>("Problems");
  return (
    <div>
      <div role="tablist" aria-label="Catalogue" className="flex flex-wrap gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 font-mono text-label uppercase transition-colors",
              tab === t ? "border-acm text-ink" : "border-transparent text-ink-faint hover:text-ink",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div role="tabpanel" aria-label={tab} className="mt-6">
        {tab === "Problems" ? <ProblemsTable /> : null}
        {tab === "Teams" ? <TeamsTable /> : null}
        {tab === "Research" ? <ResearchTable /> : null}
        {tab === "Activity" ? <ActivityTable /> : null}
      </div>
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
