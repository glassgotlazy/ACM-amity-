"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { Project } from "@/lib/cms/types";
import { StatusPill, Tag } from "@/components/ui/Badges";
import { viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { pad } from "@/lib/utils";

/**
 * Project row. Deliberately a row and not a card — projects belong in an
 * index, and a list of rules reads as a catalogue rather than a grid of tiles.
 */
export function ProjectRow({ project, index }: { project: Project; index: number }) {
  const reduce = useReducedMotion();

  return (
    <motion.article
      layout={!reduce}
      className="group relative border-b border-line"
      initial={reduce ? undefined : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.24) }}
    >
      <Link href={`/projects/${project.slug}`} className="block py-8 lg:py-10">
        {/* The accent rail grows on hover — the only motion the row needs. */}
        <span
          aria-hidden
          className="absolute left-0 top-0 h-full w-px origin-top scale-y-0 bg-acm transition-transform duration-500 ease-out group-hover:scale-y-100"
        />

        <div className="grid gap-6 pl-0 transition-[padding] duration-500 ease-out group-hover:pl-6 lg:grid-cols-[auto_1fr_auto] lg:items-start lg:gap-10">
          <span className="meta pt-1 tnum text-ink-ghost lg:w-12">{pad(index + 1)}</span>

          <div className="lg:max-w-3xl">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <StatusPill status={project.status} />
              <span className="font-mono text-micro uppercase text-ink-ghost">{project.category}</span>
            </div>

            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] transition-colors duration-200 group-hover:text-acm-bright sm:text-3xl">
              {project.name}
            </h3>

            <p className="mt-3 max-w-prose text-sm leading-relaxed text-ink-muted text-pretty">{project.summary}</p>

            <div className="mt-5 flex flex-wrap gap-1.5">
              {project.technologies.slice(0, 5).map((tech) => (
                <Tag key={tech}>{tech}</Tag>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-8 lg:flex-col lg:items-end lg:gap-4 lg:pt-1">
            <div className="lg:text-right">
              <div className="meta">Open roles</div>
              <div className="mt-1.5 text-2xl tnum text-ink">{project.openRoles.length}</div>
            </div>
            <span className="meta inline-flex items-center gap-2 text-ink-faint transition-colors duration-200 group-hover:text-acm-bright">
              View
              <span
                aria-hidden
                className="transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:-translate-y-0.5"
              >
                ↗
              </span>
            </span>
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
      className="group relative flex h-full flex-col border border-line bg-surface/40 transition-colors duration-300 hover:border-line-strong"
      initial={reduce ? undefined : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.6, delay: index * 0.08 }}
    >
      <div className="flex items-center justify-between border-b border-line px-7 py-4">
        <StatusPill status={project.status} />
        <span className="font-mono text-micro uppercase text-ink-ghost">{project.category}</span>
      </div>

      <div className="flex flex-1 flex-col p-7 lg:p-9">
        <h3 className="text-display-sm">
          <Link href={`/projects/${project.slug}`} className="transition-colors duration-200 hover:text-acm-bright">
            <span className="absolute inset-0" aria-hidden />
            {project.name}
          </Link>
        </h3>

        <p className="mt-5 max-w-prose text-[0.9375rem] leading-relaxed text-ink-muted text-pretty">
          {project.summary}
        </p>

        <dl className="mt-8 space-y-5 border-t border-line pt-7">
          <div>
            <dt className="meta">Technology</dt>
            <dd className="mt-2.5 flex flex-wrap gap-1.5">
              {project.technologies.slice(0, 6).map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </dd>
          </div>
          <div>
            <dt className="meta">Open roles</dt>
            <dd className="mt-2.5 flex flex-wrap gap-1.5">
              {project.openRoles.map((r) => (
                <Tag key={r.role} className="border-acm/30 text-ink">
                  {r.role}
                </Tag>
              ))}
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex items-center justify-between pt-9">
          <span className="meta inline-flex items-center gap-2 text-acm-bright">
            Explore project
            <span
              aria-hidden
              className="transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:-translate-y-0.5"
            >
              ↗
            </span>
          </span>
          <ProgressTicks value={project.progress} />
        </div>
      </div>
    </motion.article>
  );
}

/** Twelve ticks, filled proportionally. Reads as an instrument, not a bar. */
export function ProgressTicks({ value, count = 12 }: { value: number; count?: number }) {
  const filled = Math.round((value / 100) * count);
  return (
    <span className="flex items-center gap-2" title={`${value}% of the current phase plan`}>
      <span className="flex gap-[3px]" aria-hidden>
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className={cn("h-3 w-[2px]", i < filled ? "bg-acm" : "bg-line-strong")} />
        ))}
      </span>
      <span className="font-mono text-micro tnum text-ink-faint">{value}%</span>
    </span>
  );
}
