"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { CONTRIBUTION_MODEL, TRACKED } from "@/data/profile";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Lines } from "@/components/ui/Lines";
import { cn } from "@/lib/utils";
import type { Section } from "@/lib/cms/types";

const WEEKS = 26;
const DAYS = 7;
const EASE = [0.23, 1, 0.32, 1] as const;

/**
 * A fixed, seeded pattern so the server and the browser draw the same grid.
 * 0 = nothing, 1–4 = how much happened that day, 5 = something shipped.
 */
const ACTIVITY: number[] = (() => {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const out: number[] = [];
  for (let w = 0; w < WEEKS; w++) {
    // Activity ramps up over the semester, as it does on a real project.
    const warm = 0.15 + (w / WEEKS) * 0.6;
    for (let d = 0; d < DAYS; d++) {
      const r = rand();
      const weekend = d >= 5 ? 0.5 : 1;
      if (r > warm * weekend) out.push(0);
      else out.push(1 + Math.floor(rand() * 4));
    }
  }
  [58, 101, 139, 171].forEach((i) => (out[i] = 5));
  return out;
})();

const SHADE = ["bg-surface-high", "bg-acm/25", "bg-acm/45", "bg-acm/70", "bg-acm", "bg-gold"];

const RECORD = [
  { value: 38, label: "commits merged" },
  { value: 11, label: "reviews given" },
  { value: 3, label: "write-ups" },
  { value: 1, label: "service deployed" },
];

const RECENT = [
  { what: "Merged the retrieval evaluation script", where: "Admissions AI" },
  { what: "Reviewed the timetable conflict checker", where: "Smart Campus Scheduler" },
  { what: "Published a note on anonymising feedback", where: "Feedback Intelligence" },
];

type View = "membership" | "contribution";

export function ContributionPitch({ section, index }: { section: Section; index: string }) {
  const reduce = useReducedMotion();
  const [view, setView] = useState<View>("contribution");
  const model = CONTRIBUTION_MODEL.find((m) => m.kind.toLowerCase() === view) ?? CONTRIBUTION_MODEL[1];
  const full = view === "contribution";

  return (
    <section className="border-y border-line bg-surface/30" aria-labelledby="contribution">
      <div className="shell py-section">
        <SectionHeading
          index={index}
          eyebrow={section.eyebrow}
          title={
            <span id="contribution">
              <Lines text={section.title} />
            </span>
          }
          lede={section.body || undefined}
          align="wide"
          action={
            section.primary_label && section.primary_href ? (
              <ArrowLink href={section.primary_href}>{section.primary_label}</ArrowLink>
            ) : undefined
          }
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center lg:gap-16">
          <div>
            <div className="inline-flex rounded-xl bg-surface-high/70 p-1" role="group" aria-label="Compare a profile">
              {CONTRIBUTION_MODEL.map((m) => {
                const id = m.kind.toLowerCase() as View;
                const on = id === view;
                return (
                  <button
                    key={m.kind}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setView(id)}
                    className={cn(
                      "relative h-9 rounded-lg px-4 text-sm font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acm",
                      on ? "text-ink" : "text-ink-faint hover:text-ink",
                    )}
                  >
                    {on ? (
                      <motion.span
                        layoutId="contribution-pill"
                        className="absolute inset-0 rounded-lg bg-void shadow-sm ring-1 ring-line"
                        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 42, mass: 0.8 }}
                      />
                    ) : null}
                    <span className="relative">{m.kind}</span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={view}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, transition: { duration: 0.15 } }}
              >
                <p className={cn("mt-8 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl", full ? "text-ink" : "text-ink-faint")}>
                  “{model.claim}”
                </p>
                <p className="mt-4 max-w-prose text-[1.0625rem] leading-relaxed text-ink-muted">{model.evidence}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* The example record. Same person, same months — only what they did changes. */}
          <figure className="rounded-2xl border border-line bg-void p-5 shadow-[0_40px_90px_-60px_rgba(0,0,0,0.6)] sm:p-7">
            <div className="flex items-center gap-3">
              <span aria-hidden className="grid h-10 w-10 place-items-center rounded-full bg-acm/15 text-sm font-semibold text-acm-bright">
                AS
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.9375rem] font-semibold">A student</p>
                <p className="text-sm text-ink-faint">B.Tech CSE, second year</p>
              </div>
              <span className="rounded-full border border-line-strong px-2.5 py-0.5 text-xs text-ink-faint">Example</span>
            </div>

            <div className="mt-6">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm text-ink-faint">Last six months</p>
                <p className="flex items-center gap-1.5 text-xs text-ink-faint">
                  <span aria-hidden className="h-2.5 w-2.5 rounded-[3px] bg-gold" /> something shipped
                </p>
              </div>
              <div
                className="mt-3 grid grid-flow-col gap-[3px]"
                style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${DAYS}, auto)` }}
                role="img"
                aria-label={
                  full
                    ? "Activity grid filled across six months, with four releases marked"
                    : "Activity grid with nothing recorded"
                }
              >
                {ACTIVITY.map((v, i) => (
                  <span
                    key={i}
                    className={cn(
                      "aspect-square rounded-[3px] transition-colors duration-300",
                      full ? SHADE[v] : "bg-surface-high",
                    )}
                    style={{ transitionDelay: reduce ? "0ms" : `${Math.floor(i / DAYS) * 14}ms` }}
                  />
                ))}
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              {RECORD.map((r) => (
                <div key={r.label}>
                  <dt className="text-xs text-ink-faint">{r.label}</dt>
                  <dd className={cn("mt-0.5 text-2xl font-semibold tnum tracking-[-0.02em] transition-colors duration-300", full ? "text-ink" : "text-ink-ghost")}>
                    {full ? r.value : 0}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 border-t border-line pt-5">
              {full ? (
                <ul className="space-y-3">
                  {RECENT.map((r, i) => (
                    <motion.li
                      key={r.what}
                      className="flex items-start gap-3 text-sm"
                      initial={reduce ? false : { opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: reduce ? 0 : 0.2 + i * 0.06, ease: EASE }}
                    >
                      <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-acm" />
                      <span>
                        <span className="text-ink">{r.what}</span>
                        <span className="text-ink-faint"> in {r.where}</span>
                      </span>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-faint">Member since August. Nothing else to show.</p>
              )}
            </div>
          </figure>
        </div>

        <div className="mt-14">
          <p className="text-sm font-medium text-ink">What a contribution record can hold</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {TRACKED.map((item) => (
              <li key={item} className="rounded-full bg-surface-high/70 px-3 py-1 text-sm text-ink-muted">
                {item}
              </li>
            ))}
          </ul>
          {section.note ? <p className="mt-6 label-sm text-ink-ghost">{section.note}</p> : null}
        </div>
      </div>
    </section>
  );
}
