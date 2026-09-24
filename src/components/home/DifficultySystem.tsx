"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { LEVELS, type LevelId } from "@/data/taxonomy";
import type { Idea, Problem } from "@/lib/cms/content-types";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Lines } from "@/components/ui/Lines";
import { cn } from "@/lib/utils";
import type { Section } from "@/lib/cms/types";

const EASE = [0.23, 1, 0.32, 1] as const;

/**
 * The four levels drawn as a staircase you can step on. Picking a step shows
 * what that level asks of you and the real problems and ideas that sit on it,
 * so the scale is something to explore rather than a legend to read.
 */
export function DifficultySystem({
  section,
  index,
  problems,
  ideas,
}: {
  section: Section;
  index: string;
  problems: Problem[];
  ideas: Idea[];
}) {
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState<LevelId>("build");
  const lvl = LEVELS.find((l) => l.id === selected)!;
  const atLevel = problems.filter((p) => p.level === selected);
  const ideasAtLevel = ideas.filter((i) => i.level === selected);

  return (
    <section className="shell py-section" aria-labelledby="levels">
      <SectionHeading
        index={index}
        eyebrow={section.eyebrow}
        title={
          <span id="levels">
            <Lines text={section.title} />
          </span>
        }
        lede={section.body || undefined}
        align="wide"
      />

      <div className="mt-6 grid gap-10 rounded-2xl border border-line bg-surface/40 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14 lg:p-10">
        <div>
          <p id="levels-pick" className="text-sm text-ink-faint">
            Choose a level
          </p>
          <div className="mt-4 flex h-44 items-end gap-2 sm:h-64 sm:gap-3" role="group" aria-labelledby="levels-pick">
            {LEVELS.map((l) => {
              const on = l.id === selected;
              return (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setSelected(l.id)}
                  className="group flex h-full flex-1 flex-col justify-end rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acm"
                >
                  <span
                    className={cn(
                      "relative block w-full overflow-hidden rounded-t-lg transition-colors duration-200",
                      on ? "bg-acm-solid" : "bg-surface-high group-hover:bg-line-strong",
                    )}
                    style={{ height: `${l.ordinal * 25}%` }}
                  >
                    {on && !reduce ? (
                      <motion.span
                        key={selected}
                        aria-hidden
                        className="absolute inset-x-0 top-0 h-1 bg-gold"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.35, ease: EASE }}
                      />
                    ) : on ? (
                      <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gold" />
                    ) : null}
                  </span>
                  <span className="mt-3 block text-xs tnum text-ink-faint">Level {l.ordinal}</span>
                  <span
                    className={cn(
                      "block text-sm font-semibold transition-colors duration-150 sm:text-base",
                      on ? "text-ink" : "text-ink-muted group-hover:text-ink",
                    )}
                  >
                    {l.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div aria-live="polite" className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={selected}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, transition: { duration: 0.15 } }}
            >
              <p className="text-sm text-ink-faint">
                Level {lvl.ordinal} of {LEVELS.length}
              </p>
              <h3 className="mt-1 text-display-sm">{lvl.name}</h3>
              <p className="mt-1 text-[0.9375rem] font-medium text-gold">{lvl.summary}</p>
              <p className="mt-4 max-w-prose text-[1.0625rem] leading-relaxed text-ink-muted text-pretty">{lvl.description}</p>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-ink">
                    Problems at this level <span className="tnum text-ink-faint">{atLevel.length}</span>
                  </p>
                  {atLevel.length ? (
                    <ul className="mt-3 space-y-2">
                      {atLevel.slice(0, 4).map((p) => (
                        <li key={p.slug}>
                          <Link
                            href={`/problems/${p.slug}`}
                            className="text-[0.9375rem] text-ink-muted underline-offset-4 transition-colors hover:text-acm-bright hover:underline"
                          >
                            {p.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-ink-faint">None open right now. Submit one.</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">
                    Ideas at this level <span className="tnum text-ink-faint">{ideasAtLevel.length}</span>
                  </p>
                  {ideasAtLevel.length ? (
                    <ul className="mt-3 space-y-2">
                      {ideasAtLevel.slice(0, 4).map((idea) => (
                        <li key={idea.slug}>
                          <Link
                            href={`/ideas#${idea.slug}`}
                            className="text-[0.9375rem] text-ink-muted underline-offset-4 transition-colors hover:text-acm-bright hover:underline"
                          >
                            {idea.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-ink-faint">No ideas listed at this level yet.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
