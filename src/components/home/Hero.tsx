"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CmsImage } from "@/components/ui/CmsImage";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ease } from "@/lib/motion";
import { PipelineGraph } from "./PipelineGraph";
import { MaskedHeadline } from "@/components/ui/MaskedHeadline";
import { extraList, extraText, lines, type Section } from "@/lib/cms/types";

/**
 * Every piece of text here comes from the Homepage → Hero section in the
 * admin. An empty field hides its element rather than leaving a gap.
 */
export function Hero({ section }: { section: Section }) {
  const reduce = useReducedMotion();
  const headline = lines(section.title);
  const subtitle = lines(section.subtitle);
  const focus = extraList(section, "focus");
  const badge = extraText(section, "badge");
  const tertiary = { label: extraText(section, "tertiary_label"), href: extraText(section, "tertiary_href") };

  return (
    <section className="relative overflow-hidden rule-b">
      <div className="pointer-events-none absolute inset-0 grid-field grid-mask opacity-70" aria-hidden />

      <div className="shell relative pb-16 pt-32 sm:pt-40 lg:pb-20 lg:pt-44">
        <motion.div
          className="flex items-center gap-4"
          initial={reduce ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {section.eyebrow ? <span className="meta-accent">{section.eyebrow}</span> : null}
          {section.eyebrow && badge ? <span className="h-px w-10 bg-line-strong" aria-hidden /> : null}
          {badge ? <span className="meta">{badge}</span> : null}
        </motion.div>

        {/* The headline runs the full width of the shell. Nothing sits beside
            it — the statement is the composition. */}
        <MaskedHeadline as="h1" className="mt-10 text-display-xl" trigger="mount" delay={0.12} lines={headline} />

        <div className="mt-16 grid gap-14 border-t border-line pt-12 lg:grid-cols-[1.25fr_1fr] lg:gap-20">
          <div>
            <motion.div
              className={
                subtitle.length && section.body
                  ? "grid gap-8 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-12"
                  : "grid gap-8"
              }
              initial={reduce ? undefined : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55, ease }}
            >
              {subtitle.length ? (
                <p className="max-w-[16rem] border-l border-acm pl-5 font-mono text-label uppercase leading-[1.9] text-ink">
                  {subtitle.map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))}
                </p>
              ) : null}
              {section.body ? (
                <p className="max-w-prose text-[1.0625rem] leading-relaxed text-ink-muted text-pretty">{section.body}</p>
              ) : null}
            </motion.div>

            <motion.div
              className="mt-12 flex flex-wrap items-center gap-3"
              initial={reduce ? undefined : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.68, ease }}
            >
              {section.primary_label && section.primary_href ? (
              <Link
                href={section.primary_href}
                className="group inline-flex h-14 items-center gap-3 bg-acm-solid px-8 font-mono text-[0.75rem] uppercase tracking-[0.16em] text-white transition-colors duration-200 hover:bg-acm-deep"
              >
                {section.primary_label}
                <span aria-hidden className="transition-transform duration-300 ease-out group-hover:translate-x-1">
                  →
                </span>
              </Link>
              ) : null}
              {section.secondary_label && section.secondary_href ? (
              <Link
                href={section.secondary_href}
                className="group inline-flex h-14 items-center gap-3 border border-line-strong px-8 font-mono text-[0.75rem] uppercase tracking-[0.16em] text-ink transition-colors duration-200 hover:border-acm hover:text-acm-bright"
              >
                {section.secondary_label}
                <span aria-hidden className="transition-transform duration-300 ease-out group-hover:translate-x-1">
                  →
                </span>
              </Link>
              ) : null}
              {tertiary.label && tertiary.href ? (
              <Link
                href={tertiary.href}
                className="inline-flex h-14 items-center px-4 font-mono text-[0.75rem] uppercase tracking-[0.16em] text-ink-muted underline decoration-line-strong underline-offset-8 transition-colors duration-200 hover:text-ink hover:decoration-acm"
              >
                {tertiary.label}
              </Link>
              ) : null}
            </motion.div>
          </div>

          <motion.div
            initial={reduce ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {section.image_url ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden border border-line">
                <CmsImage src={section.image_url} alt="" sizes="(min-width: 1024px) 40vw, 100vw" priority />
              </div>
            ) : (
              <PipelineGraph />
            )}
          </motion.div>
        </div>
      </div>

      {/* Focus areas as a hairline strip rather than a row of chips. */}
      {focus.length ? (
      <div className="relative border-t border-line">
        <div className="shell">
          <ul
            className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-[repeat(var(--focus-cols),minmax(0,1fr))]"
            style={{ "--focus-cols": Math.min(focus.length, 8) } as CSSProperties}
          >
            {focus.map((item, i) => (
              <motion.li
                key={item}
                className="border-b border-line px-1 py-5 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:px-4 lg:py-6 [&:nth-child(2n)]:border-l sm:[&:nth-child(2n)]:border-l-0"
                initial={reduce ? undefined : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + i * 0.04 }}
              >
                <span className="block font-mono text-micro uppercase text-ink-ghost">{String(i + 1).padStart(2, "0")}</span>
                <span className="mt-2 block font-mono text-label uppercase text-ink-muted">{item}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
      ) : null}
    </section>
  );
}
