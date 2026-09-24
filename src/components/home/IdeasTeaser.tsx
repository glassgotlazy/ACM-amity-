"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import type { Idea } from "@/lib/cms/content-types";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { DifficultyMeter } from "@/components/ui/Badges";
import { cn } from "@/lib/utils";
import { Lines } from "@/components/ui/Lines";
import type { Section } from "@/lib/cms/types";

const BANDS: Idea["band"][] = ["Beginner", "Intermediate", "Advanced", "Research"];

/**
 * A dense index rather than a card grid — the point of this section is that
 * there are many starting points, which a list conveys and tiles do not.
 */
export function IdeasTeaser({ section, index, ideas }: { section: Section; index: string; ideas: Idea[] }) {
  const reduce = useReducedMotion();
  const [band, setBand] = useState<Idea["band"] | null>(null);
  const bands = BANDS.filter((b) => ideas.some((i) => i.band === b));
  const shown = (band ? ideas.filter((i) => i.band === band) : ideas).slice(0, 6);

  return (
    <section className="shell py-section" aria-labelledby="ideas">
      <SectionHeading
        index={index}
        eyebrow={section.eyebrow}
        title={
          <span id="ideas">
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

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line pb-5">
        <span id="idea-band" className="text-sm text-ink-faint">
          How much do you already know?
        </span>
        <div className="flex flex-wrap gap-1 rounded-xl bg-surface-high/60 p-1" role="group" aria-labelledby="idea-band">
          {[null, ...bands].map((b) => {
            const on = band === b;
            return (
              <button
                key={b ?? "all"}
                type="button"
                aria-pressed={on}
                onClick={() => setBand(b)}
                className={cn(
                  "relative h-8 rounded-lg px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acm",
                  on ? "text-ink" : "text-ink-faint hover:text-ink",
                )}
              >
                {on ? (
                  <motion.span
                    layoutId="idea-band-pill"
                    className="absolute inset-0 rounded-lg bg-void shadow-sm ring-1 ring-line"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 42, mass: 0.8 }}
                  />
                ) : null}
                <span className="relative">{b ?? "Anything"}</span>
              </button>
            );
          })}
        </div>
      </div>

      <ul aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
        {shown.map((idea, i) => (
          <motion.li
            key={idea.slug}
            layout={!reduce}
            className="group border-b border-line"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.2), ease: [0.23, 1, 0.32, 1] }}
          >
            <Link
              href={`/ideas#${idea.slug}`}
              className="grid items-baseline gap-x-8 gap-y-3 py-6 transition-[padding] duration-500 ease-out group-hover:pl-4 lg:grid-cols-[7rem_1fr_9rem_10rem]"
            >
              <span className="meta text-ink-ghost">{idea.band}</span>
              <span>
                <span className="block text-lg font-medium tracking-[-0.02em] transition-colors duration-200 group-hover:text-acm-bright">
                  {idea.name}
                </span>
                <span className="mt-1 block text-sm text-ink-faint">{idea.tagline}</span>
              </span>
              <span className="label-sm text-ink-faint">{idea.teamSize} people</span>
              <span className="flex items-center justify-between gap-4">
                <DifficultyMeter level={idea.level} showLabel={false} />
                <span className="label-sm text-ink-ghost">{idea.domains.join(" · ")}</span>
              </span>
            </Link>
          </motion.li>
        ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
