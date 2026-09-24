"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ideas } from "@/data/ideas";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { DifficultyMeter } from "@/components/ui/Badges";
import { viewportOnce } from "@/lib/motion";
import { Lines } from "@/components/ui/Lines";
import type { Section } from "@/lib/cms/types";

/**
 * A dense index rather than a card grid — the point of this section is that
 * there are many starting points, which a list conveys and tiles do not.
 */
export function IdeasTeaser({ section, index }: { section: Section; index: string }) {
  const reduce = useReducedMotion();
  const shown = ideas.slice(0, 6);

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

      <ul className="mt-2">
        {shown.map((idea, i) => (
          <motion.li
            key={idea.slug}
            className="group border-b border-line"
            initial={reduce ? undefined : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.45, delay: Math.min(i * 0.05, 0.25) }}
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
              <span className="font-mono text-micro uppercase text-ink-faint">{idea.teamSize} people</span>
              <span className="flex items-center justify-between gap-4">
                <DifficultyMeter level={idea.level} showLabel={false} />
                <span className="font-mono text-micro uppercase text-ink-ghost">{idea.domains.join(" · ")}</span>
              </span>
            </Link>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
