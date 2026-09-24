"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { CmsImage } from "@/components/ui/CmsImage";
import { ease } from "@/lib/motion";
import { PipelineGraph } from "./PipelineGraph";
import { MaskedHeadline } from "@/components/ui/MaskedHeadline";
import { Button } from "@/components/ui/Button";
import { displayCase } from "@/lib/display-case";
import { extraList, extraText, lines, type Section } from "@/lib/cms/types";

/**
 * Every piece of text here comes from the Homepage → Hero section in the
 * admin. An empty field hides its element rather than leaving a gap.
 */
export function Hero({ section }: { section: Section }) {
  const reduce = useReducedMotion();
  const headline = lines(displayCase(section.title));
  const subtitle = lines(section.subtitle);
  const focus = extraList(section, "focus");
  const badge = extraText(section, "badge");
  const tertiary = { label: extraText(section, "tertiary_label"), href: extraText(section, "tertiary_href") };

  return (
    <section className="relative overflow-hidden rule-b">
      <div className="shell relative pb-16 pt-32 sm:pt-40 lg:pb-20 lg:pt-44">
        <motion.div
          className="flex items-center gap-4"
          initial={reduce ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {section.eyebrow ? <span className="label text-acm-bright">{section.eyebrow}</span> : null}
          {badge ? <span className="rounded-full border border-line-strong px-2.5 py-0.5 label-sm text-ink-muted">{badge}</span> : null}
        </motion.div>

        {/* The headline runs the full width of the shell. Nothing sits beside
            it — the statement is the composition. */}
        <MaskedHeadline as="h1" className="mt-6 max-w-5xl text-display-xl text-balance" trigger="mount" delay={0.12} lines={headline} />

        <div className="mt-14 grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
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
                <ul className="space-y-1.5 text-[0.9375rem] font-medium text-ink">
                  {subtitle.map((line, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold" />
                      {displayCase(line)}
                    </li>
                  ))}
                </ul>
              ) : null}
              {section.body ? (
                <p className="max-w-prose text-[1.0625rem] leading-relaxed text-ink-muted text-pretty">{section.body}</p>
              ) : null}
            </motion.div>

            <motion.div
              className="mt-10 flex flex-wrap items-center gap-3"
              initial={reduce ? undefined : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.68, ease }}
            >
              {section.primary_label && section.primary_href ? (
                <Button href={section.primary_href} size="lg">
                  {displayCase(section.primary_label)}
                </Button>
              ) : null}
              {section.secondary_label && section.secondary_href ? (
                <Button href={section.secondary_href} size="lg" variant="outline">
                  {displayCase(section.secondary_label)}
                </Button>
              ) : null}
              {tertiary.label && tertiary.href ? (
                <Button href={tertiary.href} size="lg" variant="ghost">
                  {displayCase(tertiary.label)}
                </Button>
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

      {/* Focus areas: a quiet row, not numbered — they are not a sequence. */}
      {focus.length ? (
        <div className="relative border-t border-line">
          <div className="shell flex flex-wrap items-center gap-x-2 gap-y-2 py-6">
            <span className="mr-3 text-sm text-ink-faint">Areas we work in</span>
            {focus.map((item, i) => (
              <motion.span
                key={item}
                className="rounded-full bg-surface-high/70 px-3 py-1 text-sm text-ink-muted"
                initial={reduce ? undefined : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.8 + i * 0.03 }}
              >
                {displayCase(item)}
              </motion.span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
