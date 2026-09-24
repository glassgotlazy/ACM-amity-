"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { MaskedHeadline } from "@/components/ui/MaskedHeadline";
import { viewportOnce } from "@/lib/motion";
import { lines, type Section } from "@/lib/cms/types";

export function RecruitCTA({ section }: { section: Section }) {
  const reduce = useReducedMotion();

  return (
    <section className="shell py-section" aria-labelledby="recruit">
      <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:items-end">
        <MaskedHeadline
          id="recruit"
          className="text-display-md"
          // The last line is set back in a fainter ink, as designed.
          lines={lines(section.title).map((text, i, all) => ({
            text,
            className: all.length > 1 && i === all.length - 1 ? "text-ink-faint" : undefined,
          }))}
        />

        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {section.body ? (
            <p className="max-w-sm text-[1.0625rem] leading-relaxed text-ink-muted">{section.body}</p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            {section.primary_label && section.primary_href ? (
            <Link
              href={section.primary_href}
              className="group inline-flex items-center gap-3 bg-acm-solid px-7 py-4 font-mono text-label uppercase text-white transition-colors duration-200 hover:bg-acm-deep"
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
              className="group inline-flex items-center gap-3 border border-line-strong px-7 py-4 font-mono text-label uppercase transition-colors duration-200 hover:border-acm hover:text-acm-bright"
            >
              {section.secondary_label}
              <span aria-hidden className="transition-transform duration-300 ease-out group-hover:translate-x-1">
                →
              </span>
            </Link>
            ) : null}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
