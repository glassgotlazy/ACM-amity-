import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { problems, problemBySlug } from "@/data/problems";
import { getProjects } from "@/lib/cms/read";
import { DifficultyMeter, OriginTag, Tag } from "@/components/ui/Badges";
import { level } from "@/data/taxonomy";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Section, Prose } from "@/components/ui/Section";
import { TurnIntoProject } from "@/components/problems/TurnIntoProject";

export function generateStaticParams() {
  return problems.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const problem = problemBySlug(slug);
  if (!problem) return { title: "Problem not found" };
  return { title: problem.title, description: problem.question };
}

export default async function ProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const problem = problemBySlug(slug);
  if (!problem) notFound();

  const lvl = level(problem.level);
  const linkedProject = (await getProjects()).find((p) => p.problemSlug === problem.slug);

  return (
    <article>
      <header className="rule-b relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-field grid-mask opacity-50" aria-hidden />
        <div className="shell relative pb-16 pt-32 sm:pt-40">
          <Reveal>
            <ArrowLink href="/problems" direction="back">
              Problem Lab
            </ArrowLink>
          </Reveal>

          <Reveal delay={0.05} className="mt-10 flex flex-wrap items-center gap-4">
            <span className="meta tnum text-acm-bright">PROBLEM {String(problem.index).padStart(2, "0")}</span>
            <OriginTag origin={problem.origin} />
            <span className="font-mono text-micro uppercase text-ink-faint">{problem.category}</span>
          </Reveal>

          <Reveal delay={0.08} className="mt-7 max-w-5xl">
            <h1 className="text-display-lg text-balance">{problem.title}</h1>
          </Reveal>

          <Reveal delay={0.12} className="mt-10 max-w-3xl border-l border-acm pl-7">
            <p className="text-xl leading-relaxed text-ink text-pretty sm:text-2xl">{problem.question}</p>
          </Reveal>

          <Reveal delay={0.16} className="mt-12">
            <TurnIntoProject problemTitle={problem.title} suggestedName={problem.potentialProject.name} />
          </Reveal>
        </div>
      </header>

      <Section index="01" title="The problem" lede="Where students run into it today.">
        <Prose>
          <p>{problem.hook}</p>
        </Prose>
        <Reveal className="mt-9 flex flex-wrap gap-2" delay={0.05}>
          {problem.context.map((c) => (
            <Tag key={c} className="px-4 py-2.5 text-label">
              {c}
            </Tag>
          ))}
        </Reveal>
      </Section>

      <Section index="02" title="Why it matters">
        <ul className="space-y-8">
          {problem.whyItMatters.map((point, i) => (
            <Reveal as="li" key={point} delay={i * 0.06} className="flex gap-7 border-b border-line pb-8 last:border-0">
              <span className="meta tnum shrink-0 pt-1.5 text-ink-ghost">{String(i + 1).padStart(2, "0")}</span>
              <p className="max-w-prose text-[1.0625rem] leading-relaxed text-ink-muted text-pretty">{point}</p>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section
        index="03"
        title="Possible directions"
        lede="Several credible approaches, no obvious winner. Choosing between them is part of the work."
      >
        <div className="grid gap-px bg-line sm:grid-cols-2">
          {problem.directions.map((dir, i) => (
            <Reveal key={dir.title} delay={i * 0.05} className="bg-void p-7 lg:p-8">
              <span className="meta tnum text-acm-bright">{String.fromCharCode(65 + i)}</span>
              <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em]">{dir.title}</h3>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-muted text-pretty">{dir.detail}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section index="04" title="Technologies & difficulty">
        <Reveal className="flex flex-wrap gap-2">
          {problem.technologies.map((t) => (
            <Tag key={t} className="px-4 py-2.5 text-label">
              {t}
            </Tag>
          ))}
        </Reveal>

        <Reveal delay={0.08} className="mt-10 border border-line p-7 lg:p-9">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <DifficultyMeter level={problem.level} />
            <span className="meta text-ink-ghost">Level {String(lvl.ordinal).padStart(2, "0")} of 04</span>
          </div>
          <p className="mt-6 max-w-prose text-[0.9375rem] leading-relaxed text-ink-muted">{lvl.description}</p>
          <p className="mt-5 font-mono text-micro uppercase leading-relaxed text-ink-ghost">
            Difficulty describes the work, not the person. A level 04 problem is not closed to a first-year — it just
            needs a team and a longer runway.
          </p>
        </Reveal>
      </Section>

      <Section index="05" title="Potential project">
        <Reveal className="border border-line-strong p-8 lg:p-10">
          <span className="meta-accent">If someone takes this on</span>
          <h3 className="mt-6 text-display-sm">{problem.potentialProject.name}</h3>
          <p className="mt-6 max-w-prose text-[1.0625rem] leading-relaxed text-ink-muted text-pretty">
            {problem.potentialProject.summary}
          </p>
          {linkedProject ? (
            <div className="mt-8 border-t border-line pt-7">
              <ArrowLink href={`/projects/${linkedProject.slug}`} tone="accent">
                This already exists as a project — {linkedProject.name}
              </ArrowLink>
            </div>
          ) : (
            <p className="mt-8 border-t border-line pt-7 font-mono text-micro uppercase text-ink-ghost">
              No team has taken this on yet.
            </p>
          )}
        </Reveal>
      </Section>

      <Section index="06" title="Skills needed">
        <Reveal className="flex flex-wrap gap-2">
          {problem.skills.map((s) => (
            <Tag key={s} className="px-4 py-2.5 text-label">
              {s}
            </Tag>
          ))}
        </Reveal>
      </Section>

      <Section index="07" title="Open roles & possible team">
        <ul className="grid gap-px bg-line sm:grid-cols-2">
          {problem.team.map((slot, i) => (
            <Reveal as="li" key={slot.role} delay={i * 0.05} className="bg-void p-7">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-lg font-medium tracking-[-0.02em]">{slot.role}</span>
                <span className="meta tnum text-acm-bright">×{slot.count}</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink-muted">{slot.note}</p>
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-8 flex flex-wrap gap-2" delay={0.1}>
          {problem.openRoles.map((r) => (
            <Tag key={r} className="border-acm/30 px-4 py-2.5 text-label text-ink">
              {r}
            </Tag>
          ))}
        </Reveal>
      </Section>

      <Section index="08" title="Research questions" lede="The things nobody in the group can currently answer.">
        <ul className="space-y-1">
          {problem.researchQuestions.map((q, i) => (
            <Reveal
              as="li"
              key={q}
              delay={i * 0.05}
              className="flex gap-6 border-b border-line py-6 last:border-0"
            >
              <span aria-hidden className="meta pt-1 text-acm-bright">
                ?
              </span>
              <p className="max-w-prose text-[1.0625rem] leading-relaxed text-ink-muted text-pretty">{q}</p>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section index="09" title="Next steps" lede="What the first two weeks would sensibly look like.">
        <ol className="space-y-1">
          {problem.nextSteps.map((step, i) => (
            <Reveal as="li" key={step} delay={i * 0.05} className="flex gap-6 border-b border-line py-6 last:border-0">
              <span className="meta tnum shrink-0 pt-1 text-ink-ghost">{String(i + 1).padStart(2, "0")}</span>
              <p className="max-w-prose text-[0.9375rem] leading-relaxed text-ink-muted text-pretty">{step}</p>
            </Reveal>
          ))}
        </ol>
      </Section>

      <section className="relative overflow-hidden border-t border-line bg-surface/40">
        <div className="pointer-events-none absolute inset-0 grid-field opacity-40" aria-hidden />
        <div className="shell relative py-24">
          <h2 className="max-w-3xl text-display-md text-balance">
            You have read the problem. The next step is deciding what to build.
          </h2>
          <div className="mt-12 flex flex-wrap items-center gap-8">
            <TurnIntoProject problemTitle={problem.title} suggestedName={problem.potentialProject.name} />
            <Link href="/problems" className="meta text-ink-muted transition-colors hover:text-ink">
              Back to the Problem Lab →
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
