"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useMemo, useState } from "react";
import Link from "next/link";
import { BANDS, type Idea } from "@/lib/cms/content-types";
import { DOMAINS } from "@/data/taxonomy";
import { FilterBar } from "@/components/ui/FilterBar";
import { DifficultyMeter, Tag } from "@/components/ui/Badges";

const BAND_FILTERS = ["All", ...BANDS] as const;
const DOMAIN_FILTERS = ["All domains", ...DOMAINS] as const;

export function IdeaIndex({ ideas }: { ideas: Idea[] }) {
  const [band, setBand] = useState<string>("All");
  const [domain, setDomain] = useState<string>("All domains");
  const reduce = useReducedMotion();

  const bandCounts = useMemo(() => {
    const map: Record<string, number> = { All: ideas.length };
    for (const b of BANDS) map[b] = ideas.filter((i) => i.band === b).length;
    return map;
  }, [ideas]);

  const shown = useMemo(
    () =>
      ideas.filter(
        (idea) =>
          (band === "All" || idea.band === band) &&
          (domain === "All domains" || idea.domains.includes(domain as never)),
      ),
    [ideas, band, domain],
  );

  return (
    <section className="shell py-14" aria-labelledby="idea-list">
      <h2 id="idea-list" className="sr-only">
        Project ideas
      </h2>

      <div className="sticky top-[4.5rem] z-40 -mx-gutter space-y-3 border-b border-line bg-void/90 px-gutter py-4 backdrop-blur-xl">
        <FilterBar
          label="Filter ideas by level"
          options={BAND_FILTERS}
          value={band}
          onChange={setBand}
          counts={bandCounts}
          layoutId="idea-band"
        />
        <div className="border-t border-line-faint pt-3">
          <FilterBar
            label="Filter ideas by domain"
            options={DOMAIN_FILTERS}
            value={domain}
            onChange={setDomain}
            layoutId="idea-domain"
          />
        </div>
      </div>

      <LayoutGroup>
        <div className="mt-10 space-y-px bg-line">
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map((idea, i) => (
              <motion.article
                key={idea.slug}
                id={idea.slug}
                layout={!reduce}
                initial={reduce ? undefined : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0 }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.2) }}
                className="group scroll-mt-44 bg-void"
              >
                <div className="grid gap-8 py-9 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-12">
                  <div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <span className="meta text-acm-bright">{idea.band}</span>
                      <span className="h-3 w-px bg-line-strong" aria-hidden />
                      <DifficultyMeter level={idea.level} />
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] transition-colors duration-200 group-hover:text-acm-bright">
                      {idea.name}
                    </h3>
                    <p className="mt-3 max-w-prose text-[0.9375rem] leading-relaxed text-ink-muted text-pretty">
                      {idea.tagline}
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
                      <span className="label-sm text-ink-ghost">Team of {idea.teamSize}</span>
                      <span className="label-sm text-ink-ghost">{idea.domains.join(" · ")}</span>
                      {idea.problemSlug ? (
                        <Link
                          href={`/problems/${idea.problemSlug}`}
                          className="label-sm text-acm-bright hover:text-ink"
                        >
                          Linked problem
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <div className="meta">Technologies &amp; skills</div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {[...idea.technologies, ...idea.skills].slice(0, 7).map((t) => (
                        <Tag key={t}>{t}</Tag>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-7">
                    <div>
                      <div className="meta">What you would learn</div>
                      <ul className="mt-4 space-y-2.5">
                        {idea.learn.map((l) => (
                          <li key={l} className="flex gap-3 text-sm leading-relaxed text-ink-muted">
                            <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-acm/60" />
                            {l}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link
                      href="/join"
                      className="inline-flex items-center gap-2 self-start label text-ink-faint transition-colors duration-200 hover:text-acm-bright"
                    >
                      Start building
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      </LayoutGroup>

      {shown.length === 0 ? (
        <p className="border border-line px-8 py-20 text-center label text-ink-faint">
          Nothing at that level in that domain yet.
        </p>
      ) : null}
    </section>
  );
}
