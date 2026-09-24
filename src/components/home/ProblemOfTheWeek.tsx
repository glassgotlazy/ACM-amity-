import Link from "next/link";
import type { Problem } from "@/lib/cms/content-types";
import { DifficultyMeter, OriginTag, Tag } from "@/components/ui/Badges";
import { Reveal } from "@/components/ui/Reveal";
import type { Section } from "@/lib/cms/types";

/**
 * A single editorial slot. It rotates weekly from the problem set today; the
 * component takes the problem as a prop so a backend pick drops straight in.
 */
export function ProblemOfTheWeek({ problem, section, index }: { problem: Problem; section: Section; index: string }) {
  return (
    <section className="shell py-section" aria-labelledby="potw">
      <Reveal className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-4">
        <div className="flex items-baseline gap-4">
          <span className="meta text-acm-bright">{index} /</span>
          <span className="meta">{section.eyebrow}</span>
        </div>
        {section.subtitle ? (
          <span className="flex items-center gap-2 font-mono text-micro uppercase text-ink-ghost">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-acm" />
            {section.subtitle}
          </span>
        ) : null}
      </Reveal>

      <div className="grid gap-px bg-line lg:grid-cols-[1.5fr_1fr]">
        <Reveal className="bg-void px-0 py-12 lg:pr-16">
          <OriginTag origin={problem.origin} />

          <h2 id="potw" className="mt-7 max-w-2xl text-display-sm text-balance">
            {problem.question}
          </h2>

          <p className="mt-7 max-w-prose text-[1.0625rem] leading-relaxed text-ink-muted text-pretty">
            {problem.whyItMatters[0]}
          </p>

          <Link
            href={`/problems/${problem.slug}`}
            className="group mt-10 inline-flex h-12 items-center gap-3 border border-line-strong px-7 font-mono text-label uppercase transition-colors duration-200 hover:border-acm hover:text-acm-bright"
          >
            {section.primary_label || "Explore problem"}
            <span aria-hidden className="transition-transform duration-300 ease-out group-hover:translate-x-1">
              →
            </span>
          </Link>
        </Reveal>

        <Reveal delay={0.08} className="bg-void py-12 lg:pl-12">
          <dl className="space-y-8">
            <div>
              <dt className="meta">The problem</dt>
              <dd className="mt-3 text-lg font-medium tracking-[-0.02em]">{problem.title}</dd>
            </div>
            <div className="border-t border-line pt-7">
              <dt className="meta">Possible technologies</dt>
              <dd className="mt-3 flex flex-wrap gap-1.5">
                {problem.technologies.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </dd>
            </div>
            <div className="border-t border-line pt-7">
              <dt className="meta">Difficulty</dt>
              <dd className="mt-3">
                <DifficultyMeter level={problem.level} />
              </dd>
            </div>
            <div className="border-t border-line pt-7">
              <dt className="meta">Potential project</dt>
              <dd className="mt-3 text-sm leading-relaxed text-ink-muted">{problem.potentialProject.name}</dd>
            </div>
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
