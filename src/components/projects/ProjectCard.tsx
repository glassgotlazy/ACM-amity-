"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import type { Project } from "@/lib/cms/types";
import { StatusPill, Tag } from "@/components/ui/Badges";
import { viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Project row. A row, not a card: projects belong in an index. The whole row
 * is the link; hovering lifts its background, nothing else moves.
 */
export function ProjectRow({ project, index }: { project: Project; index: number }) {
  const reduce = useReducedMotion();

  return (
    <motion.article
      layout={!reduce}
      className="group relative border-b border-line"
      initial={reduce ? undefined : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.24) }}
    >
      <Link
        href={`/projects/${project.slug}`}
        className="-mx-4 block rounded-xl px-4 py-8 transition-colors duration-200 hover:bg-surface/70 lg:-mx-6 lg:px-6"
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start lg:gap-12">
          <div className="lg:max-w-3xl">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <StatusPill status={project.status} />
              <span className="text-xs text-ink-ghost">{project.category}</span>
            </div>

            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.025em] transition-colors duration-150 group-hover:text-acm-bright sm:text-[1.75rem]">
              {project.name}
            </h3>

            <p className="mt-2.5 max-w-prose text-[0.9375rem] leading-relaxed text-ink-muted text-pretty">{project.summary}</p>

            <div className="mt-5 flex flex-wrap gap-1.5">
              {project.technologies.slice(0, 5).map((tech) => (
                <Tag key={tech}>{tech}</Tag>
              ))}
            </div>
          </div>

          <div className="flex items-baseline gap-2 lg:flex-col lg:items-end lg:gap-0 lg:pt-1 lg:text-right">
            <div className="text-3xl font-semibold tnum tracking-[-0.03em] text-gold">{project.openRoles.length}</div>
            <div className="text-sm text-ink-faint">open {project.openRoles.length === 1 ? "role" : "roles"}</div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

/** Larger treatment used for the two featured projects on the homepage. */
export function FeatureProject({ project, index }: { project: Project; index: number }) {
  const reduce = useReducedMotion();

  return (
    <motion.article
      className="group relative flex h-full flex-col rounded-2xl border border-line bg-surface/60 p-7 transition-[border-color,background-color] duration-200 hover:border-line-strong hover:bg-surface lg:p-9"
      initial={reduce ? undefined : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.5, delay: index * 0.06 }}
    >
      <div className="flex items-center justify-between gap-4">
        <StatusPill status={project.status} />
        <span className="text-xs text-ink-ghost">{project.category}</span>
      </div>

      <h3 className="mt-5 text-display-sm">
        <Link href={`/projects/${project.slug}`} className="transition-colors duration-150 group-hover:text-acm-bright">
          <span className="absolute inset-0 rounded-2xl" aria-hidden />
          {project.name}
        </Link>
      </h3>

      <p className="mt-4 max-w-prose text-[0.9375rem] leading-relaxed text-ink-muted text-pretty">{project.summary}</p>

      <dl className="mt-7 space-y-5">
        <div>
          <dt className="text-sm text-ink-faint">Built with</dt>
          <dd className="mt-2 flex flex-wrap gap-1.5">
            {project.technologies.slice(0, 6).map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-ink-faint">Looking for</dt>
          <dd className="mt-2 flex flex-wrap gap-1.5">
            {project.openRoles.map((r) => (
              <Tag key={r.role} className="bg-gold/10 text-gold">
                {r.role}
              </Tag>
            ))}
          </dd>
        </div>
      </dl>

      <div className="mt-auto pt-8">
        <ProgressTicks value={project.progress} />
      </div>
    </motion.article>
  );
}

/** How far the current phase has come: a plain bar with its number. */
export function ProgressTicks({ value }: { value: number; count?: number }) {
  return (
    <span className="flex items-center gap-3" title={`${value}% of the current phase plan`}>
      <span className="relative h-1.5 w-full max-w-[12rem] overflow-hidden rounded-full bg-line-strong" aria-hidden>
        <span className="absolute inset-y-0 left-0 rounded-full bg-acm" style={{ width: `${value}%` }} />
      </span>
      <span className="shrink-0 text-xs tnum text-ink-faint">{value}% of this phase</span>
    </span>
  );
}
