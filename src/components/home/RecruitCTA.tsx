"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { Button } from "@/components/ui/Button";
import { displayCase } from "@/lib/display-case";
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
          lines={lines(displayCase(section.title))}
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
              <Button href={section.primary_href}>{displayCase(section.primary_label)}</Button>
            ) : null}
            {section.secondary_label && section.secondary_href ? (
              <Button href={section.secondary_href} variant="outline">
                {displayCase(section.secondary_label)}
              </Button>
            ) : null}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
