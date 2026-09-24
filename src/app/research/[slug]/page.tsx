import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getResearch, getResearchProject } from "@/lib/cms/read";
import { StatusPill } from "@/components/ui/Badges";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Section, Prose } from "@/components/ui/Section";
import { ResearchTimeline } from "@/components/research/ResearchTimeline";
import { cn } from "@/lib/utils";

export async function generateStaticParams() {
  return (await getResearch()).map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getResearchProject(slug);
  if (!project) return { title: "Research not found" };
  return { title: project.title, description: project.question };
}

/** Sections with no content yet say so, rather than being hidden. */
function ComingSoon({ what }: { what: string }) {
  return (
    <Reveal className="border border-dashed border-line-strong px-7 py-10">
      <div className="meta text-ink-ghost">Coming soon</div>
      <p className="mt-4 max-w-prose text-[0.9375rem] leading-relaxed text-ink-faint">{what}</p>
    </Reveal>
  );
}

const EXPERIMENT_TONE = {
  running: "text-signal-live",
  planned: "text-signal-idea",
  blocked: "text-signal-work",
} as const;

export default async function ResearchDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getResearchProject(slug);
  if (!project) notFound();

  return (
    <article>
      <header className="rule-b relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-field grid-mask opacity-50" aria-hidden />
        <div className="shell relative pb-16 pt-32 sm:pt-40">
          <Reveal>
            <ArrowLink href="/research" direction="back">
              Research hub
            </ArrowLink>
          </Reveal>

          <Reveal delay={0.05} className="mt-10 flex flex-wrap items-center gap-5">
            <StatusPill status={project.status} />
            <span className="h-3 w-px bg-line-strong" aria-hidden />
            <span className="font-mono text-micro uppercase text-ink-faint">{project.field}</span>
          </Reveal>

          <Reveal delay={0.08} className="mt-7 max-w-4xl">
            <h1 className="text-display-lg text-balance">{project.title}</h1>
          </Reveal>

          <Reveal delay={0.12} className="mt-10 max-w-3xl border-l border-acm pl-7">
            <div className="meta">Research question</div>
            <p className="mt-4 text-xl leading-relaxed text-ink text-pretty sm:text-2xl">{project.question}</p>
          </Reveal>
        </div>
      </header>

      <Section index="01" title="Background">
        <Prose>
          {project.background.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </Prose>
      </Section>

      <Section index="02" title="Literature" lede="Reading themes rather than a citation list — the bibliography is maintained by the group, not published here.">
        <ul className="grid gap-px bg-line sm:grid-cols-2">
          {project.literature.map((entry, i) => (
            <Reveal as="li" key={entry.theme} delay={i * 0.05} className="bg-void p-7">
              <span className="meta tnum text-acm-bright">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-4 text-lg font-medium tracking-[-0.02em]">{entry.theme}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{entry.note}</p>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section index="03" title="Exploration">
        <ol className="space-y-1">
          {project.exploration.map((item, i) => (
            <Reveal as="li" key={item} delay={i * 0.05} className="flex gap-6 border-b border-line py-6 last:border-0">
              <span className="meta tnum shrink-0 pt-1 text-ink-ghost">{String(i + 1).padStart(2, "0")}</span>
              <p className="max-w-prose text-[1.0625rem] leading-relaxed text-ink-muted text-pretty">{item}</p>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section index="04" title="Experiments">
        <ul>
          {project.experiments.map((exp, i) => (
            <Reveal
              as="li"
              key={exp.title}
              delay={i * 0.05}
              className="grid gap-3 border-b border-line py-7 lg:grid-cols-[1fr_8rem_1.2fr] lg:items-baseline lg:gap-10"
            >
              <span className="text-lg font-medium tracking-[-0.02em]">{exp.title}</span>
              <span className={cn("font-mono text-micro uppercase", EXPERIMENT_TONE[exp.state])}>{exp.state}</span>
              <span className="text-sm leading-relaxed text-ink-muted">{exp.note}</span>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section index="05" title="Analysis">
        {project.analysis ? (
          <Prose>
            <p>{project.analysis}</p>
          </Prose>
        ) : (
          <ComingSoon what="There is nothing to analyse yet. Analysis appears here once there are experimental results worth arguing about — and not before." />
        )}
      </Section>

      <Section index="06" title="Paper">
        {project.paper ? (
          <Prose>
            <p>{project.paper}</p>
          </Prose>
        ) : (
          <ComingSoon what="No paper is written, submitted or under review. If this project produces a contribution worth defending, that is where it would appear." />
        )}
      </Section>

      <Section index="07" title="Where it stands">
        <ResearchTimeline stages={project.stages} />
      </Section>

      <Section index="08" title="Open to">
        <ul className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {project.openTo.map((item, i) => (
            <Reveal as="li" key={item} delay={i * 0.05} className="bg-void p-7">
              <p className="text-[0.9375rem] leading-relaxed text-ink-muted text-pretty">{item}</p>
            </Reveal>
          ))}
        </ul>
        <Reveal className="mt-9" delay={0.12}>
          <Link
            href="/join"
            className="group inline-flex h-14 items-center gap-3 bg-acm-solid px-8 font-mono text-label uppercase text-white transition-colors duration-200 hover:bg-acm-deep"
          >
            Join the research team
            <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </Reveal>
      </Section>

      <section className="border-t border-line bg-surface/30">
        <div className="shell py-16">
          <p className="max-w-3xl font-mono text-micro uppercase leading-relaxed text-ink-ghost">
            Accuracy note · This is an ongoing student research initiative. Nothing on this page is a proven result, a
            peer-reviewed finding or an established contribution to the field, and none of it should be cited as one.
          </p>
        </div>
      </section>
    </article>
  );
}
