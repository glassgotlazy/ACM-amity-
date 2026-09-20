"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";
import type { Problem } from "@/data/problems";
import { DifficultyMeter, OriginTag, Tag } from "@/components/ui/Badges";
import { pad } from "@/lib/utils";

/**
 * Problem card. The pointer-tracked hairline highlight is the one place on
 * the site with a mouse-reactive surface — the Problem Lab is meant to feel
 * like the most alive part of the platform.
 */
export function ProblemCard({ problem, index }: { problem: Problem; index: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  function onMove(event: React.MouseEvent<HTMLDivElement>) {
    if (reduce) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  }

  return (
    <motion.article
      layout={!reduce}
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setPos(null)}
      className="group relative isolate flex h-full flex-col border border-line bg-surface/30 transition-colors duration-300 hover:border-line-strong"
      initial={reduce ? undefined : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.3) }}
    >
      {pos ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(340px circle at ${pos.x}px ${pos.y}px, rgba(229,52,43,0.07), transparent 65%)`,
          }}
        />
      ) : null}

      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <span className="meta tnum text-acm">PROBLEM {pad(problem.index)}</span>
        <OriginTag origin={problem.origin} className="border-0 px-0 py-0" />
      </div>

      <div className="flex flex-1 flex-col px-6 py-7">
        <h3 className="text-xl font-semibold leading-tight tracking-[-0.025em] text-balance">
          <Link href={`/problems/${problem.slug}`} className="transition-colors duration-200 group-hover:text-acm-bright">
            <span className="absolute inset-0" aria-hidden />
            {problem.title}
          </Link>
        </h3>

        <p className="mt-3 text-sm leading-relaxed text-ink-faint">{problem.hook}</p>

        <blockquote className="mt-6 border-l border-acm/50 pl-4 text-[0.9375rem] leading-relaxed text-ink-muted text-pretty">
          {problem.question}
        </blockquote>

        <div className="mt-6 flex flex-wrap gap-1.5">
          {problem.technologies.slice(0, 4).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>

        <div className="mt-auto space-y-4 pt-8">
          <div className="flex items-center justify-between border-t border-line pt-5">
            <DifficultyMeter level={problem.level} />
            <span className="font-mono text-micro uppercase text-ink-ghost">
              {problem.openRoles.length} roles
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-mono text-micro uppercase text-ink-faint">→ {problem.potentialProject.name}</span>
            <span className="meta inline-flex items-center gap-2 text-ink-faint transition-colors duration-200 group-hover:text-acm-bright">
              Explore
              <span
                aria-hidden
                className="transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:-translate-y-0.5"
              >
                ↗
              </span>
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
