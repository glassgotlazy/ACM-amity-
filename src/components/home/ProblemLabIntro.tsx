"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { displayCase } from "@/lib/display-case";
import { useMemo, useState } from "react";
import Link from "next/link";
import { PROBLEM_CATEGORIES } from "@/data/taxonomy";
import { cn } from "@/lib/utils";
import type { Problem } from "@/lib/cms/content-types";
import { ProblemCard } from "@/components/problems/ProblemCard";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { MaskedHeadline } from "@/components/ui/MaskedHeadline";
import { lines, type Section } from "@/lib/cms/types";

/**
 * The Problem Lab is the argument the whole site rests on, so it gets the
 * full-bleed treatment: its own dark field, its own numbering, and a headline
 * that is larger than anything else on the page apart from the hero.
 */
export function ProblemLabIntro({ section, index, problems }: { section: Section; index: string; problems: Problem[] }) {
  const reduce = useReducedMotion();
  const [category, setCategory] = useState<string | null>(null);
  // Only categories that actually have a problem become filters.
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    problems.forEach((p) => m.set(p.category, (m.get(p.category) ?? 0) + 1));
    return m;
  }, [problems]);
  const categories = PROBLEM_CATEGORIES.filter((c) => counts.has(c));
  const shown = category ? problems.filter((p) => p.category === category) : problems.slice(0, 6);

  return (
    <section className="relative overflow-hidden border-y border-line bg-surface/30" aria-labelledby="problem-lab">
      <div className="pointer-events-none absolute inset-0 grid-field opacity-50" aria-hidden />

      <div className="shell relative py-section">
        <div className="flex items-baseline gap-4">
          <span className="label text-acm-bright">{section.eyebrow}</span>
        </div>

        <MaskedHeadline
          className="mt-10 text-display-md"
          id="problem-lab"
          lines={lines(displayCase(section.title))}
        />

        <div className="mt-14 grid gap-14 lg:grid-cols-[1.35fr_1fr] lg:gap-20">
          <div>
            <Reveal delay={0.1} className="max-w-prose space-y-5 text-[1.0625rem] leading-relaxed text-ink-muted text-pretty">
              {section.body ? <p>{section.body}</p> : null}
              {section.subtitle ? <p className="text-ink">{section.subtitle}</p> : null}
            </Reveal>

            {section.primary_label && section.primary_href ? (
              <Reveal delay={0.16} className="mt-9">
                <ArrowLink href={section.primary_href} tone="accent">
                  {section.primary_label}
                </ArrowLink>
              </Reveal>
            ) : null}
          </div>

          <div className="lg:pt-4">
            <p id="problem-filter" className="text-sm text-ink-faint">
              Filter by category
            </p>
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-labelledby="problem-filter">
              {[null, ...categories].map((c) => {
                const on = category === c;
                return (
                  <button
                    key={c ?? "all"}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setCategory(c)}
                    className={cn(
                      "relative inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acm",
                      on ? "bg-acm-solid text-white" : "bg-surface-high/70 text-ink-muted hover:bg-surface-high hover:text-ink",
                    )}
                  >
                    <span className="relative">{c ?? "All"}</span>
                    <span className={cn("relative tnum text-xs", on ? "text-white" : "text-ink-faint")}>
                      {c ? counts.get(c) : problems.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {section.note ? (
              <div className="mt-10 border-t border-line pt-6">
                <p className="label-sm leading-relaxed text-ink-ghost">{section.note}</p>
              </div>
            ) : null}
          </div>
        </div>

        <motion.div layout={!reduce} className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map((problem, i) => (
              <ProblemCard key={problem.slug} problem={problem} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-sm">
          <span className="text-ink-faint">
            {category
              ? `${shown.length} ${shown.length === 1 ? "problem" : "problems"} in ${category}`
              : `Showing ${shown.length} of ${problems.length} problems`}
          </span>
          <Link href="/problems" className="font-medium text-acm-bright underline-offset-4 hover:underline">
            See every problem
          </Link>
        </div>
      </div>
    </section>
  );
}
