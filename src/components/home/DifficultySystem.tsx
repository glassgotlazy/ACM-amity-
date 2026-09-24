"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LEVELS } from "@/data/taxonomy";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { viewportOnce } from "@/lib/motion";
import { Lines } from "@/components/ui/Lines";
import type { Section } from "@/lib/cms/types";

/**
 * Levels presented as a staircase — each row indents and its bar grows, so
 * the escalation is visible before any of the text is read.
 */
export function DifficultySystem({ section, index }: { section: Section; index: string }) {
  const reduce = useReducedMotion();

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

      <ol className="mt-4">
        {LEVELS.map((lvl, i) => (
          <motion.li
            key={lvl.id}
            className="group border-b border-line"
            initial={reduce ? undefined : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.5, delay: i * 0.07 }}
          >
            <div
              className="grid items-baseline gap-4 py-8 transition-[padding] duration-500 ease-out lg:grid-cols-[7rem_14rem_1fr] lg:gap-12 lg:group-hover:pl-4"
              style={{ paddingLeft: reduce ? undefined : `${i * 0}px` }}
            >
              <div className="flex items-center gap-4">
                <span className="meta tnum text-ink-ghost">LEVEL {String(lvl.ordinal).padStart(2, "0")}</span>
              </div>

              <div>
                <h3 className="text-2xl font-semibold tracking-[-0.03em] transition-colors duration-300 group-hover:text-acm-bright">
                  {lvl.name}
                </h3>
                <p className="mt-2 font-mono text-micro uppercase leading-[1.6] text-ink-faint">{lvl.summary}</p>
              </div>

              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
                <p className="max-w-prose text-sm leading-relaxed text-ink-muted text-pretty lg:flex-1">
                  {lvl.description}
                </p>
                <span className="flex shrink-0 items-end gap-1 lg:pt-1" aria-hidden>
                  {LEVELS.map((bar) => (
                    <motion.span
                      key={bar.id}
                      className={bar.ordinal <= lvl.ordinal ? "w-1 bg-acm" : "w-1 bg-line-strong"}
                      initial={reduce ? undefined : { height: 4 }}
                      whileInView={{ height: 8 + bar.ordinal * 7 }}
                      viewport={viewportOnce}
                      transition={{ duration: 0.5, delay: 0.1 + i * 0.07 + bar.ordinal * 0.04 }}
                      style={{ height: 8 + bar.ordinal * 7 }}
                    />
                  ))}
                </span>
              </div>
            </div>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
