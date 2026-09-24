"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import type { Problem } from "@/lib/cms/content-types";
import { DifficultyMeter, OriginTag, Tag } from "@/components/ui/Badges";
import { pad } from "@/lib/utils";

/**
 * Problem card. The pointer-tracked hairline highlight is the one place on
 * the site with a mouse-reactive surface — the Problem Lab is meant to feel
 * like the most alive part of the platform.
 */
export function ProblemCard({ problem, index }: { problem: Problem; index: number }) {
  const reduce = useReducedMotion();

  return (
    <motion.article
      layout={!reduce}
      className="group relative isolate flex h-full flex-col rounded-xl border border-line bg-surface/60 transition-[border-color,background-color] duration-200 hover:border-line-strong hover:bg-surface"
      initial={reduce ? undefined : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.24) }}
    >
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="label-sm tnum text-ink-faint">Problem {pad(problem.index)}</span>
          <OriginTag origin={problem.origin} />
        </div>

        <h3 className="mt-4 text-xl font-semibold leading-snug tracking-[-0.02em] text-balance">
          <Link href={`/problems/${problem.slug}`} className="transition-colors duration-150 group-hover:text-acm-bright">
            <span className="absolute inset-0 rounded-xl" aria-hidden />
            {problem.title}
          </Link>
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-ink-faint">{problem.hook}</p>

        <p className="mt-5 text-[0.9375rem] leading-relaxed text-ink-muted text-pretty">{problem.question}</p>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {problem.technologies.slice(0, 4).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line pt-4 [margin-top:max(1.75rem,auto)]">
          <DifficultyMeter level={problem.level} />
          <span className="text-xs text-ink-faint">
            {problem.openRoles.length} open roles · could become <span className="text-ink-muted">{problem.potentialProject.name}</span>
          </span>
        </div>
      </div>
    </motion.article>
  );
}
