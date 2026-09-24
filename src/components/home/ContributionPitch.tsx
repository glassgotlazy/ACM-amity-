"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import Link from "next/link";
import { CONTRIBUTION_MODEL, TRACKED } from "@/data/profile";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { viewportOnce } from "@/lib/motion";
import { Lines } from "@/components/ui/Lines";
import type { Section } from "@/lib/cms/types";

export function ContributionPitch({ section, index }: { section: Section; index: string }) {
  const reduce = useReducedMotion();

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

        <div className="mt-14 grid gap-px bg-line lg:grid-cols-2">
          {CONTRIBUTION_MODEL.map((entry, i) => (
            <motion.div
              key={entry.kind}
              className="relative bg-void p-9 lg:p-12"
              initial={reduce ? undefined : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.55, delay: i * 0.1 }}
            >
              {entry.tone === "accent" ? (
                <span aria-hidden className="absolute left-0 top-0 h-full w-px bg-acm" />
              ) : null}
              <div className={entry.tone === "accent" ? "meta-accent" : "meta"}>{entry.kind}</div>
              <p
                className={`mt-6 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl ${
                  entry.tone === "accent" ? "text-ink" : "text-ink-faint"
                }`}
              >
                “{entry.claim}”
              </p>
              <p className="mt-6 max-w-prose text-sm leading-relaxed text-ink-muted">{entry.evidence}</p>
            </motion.div>
          ))}
        </div>

        <Reveal className="mt-14">
          <div className="meta border-b border-line pb-3">What a contribution record can hold</div>
          <ul className="mt-6 grid gap-x-10 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
            {TRACKED.map((item, i) => (
              <motion.li
                key={item}
                className="flex items-baseline gap-3 border-b border-line-faint py-2.5 text-sm text-ink-muted"
                initial={reduce ? undefined : { opacity: 0, x: -6 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={viewportOnce}
                transition={{ duration: 0.4, delay: i * 0.04 }}
              >
                {item}
              </motion.li>
            ))}
          </ul>
          {section.note ? <p className="mt-6 label-sm text-ink-ghost">{section.note}</p> : null}
        </Reveal>
      </div>
    </section>
  );
}
