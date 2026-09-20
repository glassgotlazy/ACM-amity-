import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects, projectBySlug } from "@/data/projects";
import { StatusPill, Tag } from "@/components/ui/Badges";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { ProjectTimeline } from "@/components/projects/ProjectTimeline";
import { ProgressTicks } from "@/components/projects/ProjectCard";
import { ApplyPanel } from "@/components/projects/ApplyPanel";
import { Section, Prose } from "@/components/ui/Section";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = projectBySlug(slug);
  if (!project) return { title: "Project not found" };
  return { title: project.name, description: project.summary };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projectBySlug(slug);
  if (!project) notFound();

  return (
    <article>
      <header className="rule-b relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-field grid-mask opacity-50" aria-hidden />
        <div className="shell relative pb-16 pt-32 sm:pt-40">
          <Reveal>
            <ArrowLink href="/projects" direction="back">
              All projects
            </ArrowLink>
          </Reveal>

          <Reveal delay={0.05} className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3">
            <StatusPill status={project.status} />
            <span className="h-3 w-px bg-line-strong" aria-hidden />
            <span className="font-mono text-micro uppercase text-ink-faint">{project.category}</span>
          </Reveal>

          <Reveal delay={0.08} className="mt-6 max-w-4xl">
            <h1 className="text-display-lg text-balance">{project.name}</h1>
          </Reveal>

          <Reveal delay={0.12} className="mt-8 max-w-2xl">
            <p className="text-lg leading-relaxed text-ink-muted text-pretty">{project.summary}</p>
          </Reveal>

          <Reveal delay={0.16} className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-5">
            <ApplyPanel projectName={project.name} roles={project.openRoles.map((r) => r.role)} />
            <ProgressTicks value={project.progress} />
          </Reveal>
        </div>
      </header>

      <Section index="01" title="The problem">
        <Prose>
          <p>{project.problem}</p>
        </Prose>
        {project.problemSlug ? (
          <Reveal className="mt-8">
            <ArrowLink href={`/problems/${project.problemSlug}`} tone="accent">
              Read the full problem statement
            </ArrowLink>
          </Reveal>
        ) : null}
      </Section>

      <Section index="02" title="What we are building">
        <ol className="grid gap-px bg-line sm:grid-cols-2">
          {project.building.map((item, i) => (
            <Reveal as="li" key={item} delay={i * 0.05} className="bg-void p-7">
              <span className="meta tnum text-acm-bright">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-muted text-pretty">{item}</p>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section
        index="03"
        title="Current status"
        lede="The most useful thing a project page can do is be specific about what is not true yet."
      >
        <div className="grid gap-px bg-line lg:grid-cols-2">
          <Reveal className="bg-void p-8 lg:p-10">
            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-signal-live" aria-hidden />
              <span className="meta text-signal-live">What exists today</span>
            </div>
            <ul className="mt-7 space-y-5">
              {project.currentState.exists.map((item) => (
                <li key={item} className="flex gap-4 text-[0.9375rem] leading-relaxed text-ink-muted">
                  <span aria-hidden className="mt-2 h-px w-4 shrink-0 bg-signal-live/60" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.08} className="bg-void p-8 lg:p-10">
            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-ink-ghost" aria-hidden />
              <span className="meta">What does not exist yet</span>
            </div>
            <ul className="mt-7 space-y-5">
              {project.currentState.notYet.map((item) => (
                <li key={item} className="flex gap-4 text-[0.9375rem] leading-relaxed text-ink-faint">
                  <span aria-hidden className="mt-2 h-px w-4 shrink-0 bg-line-strong" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Section>

      <Section index="04" title="Technology">
        <Reveal className="flex flex-wrap gap-2">
          {project.technologies.map((tech) => (
            <Tag key={tech} className="px-4 py-2.5 text-label">
              {tech}
            </Tag>
          ))}
        </Reveal>
      </Section>

      <Section index="05" title="Team">
        <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {project.team.map((member, i) => (
            <Reveal key={`${member.name}-${member.role}`} delay={i * 0.05} className="bg-void p-7">
              <div className="meta">{member.role}</div>
              <p
                className={`mt-4 text-lg font-medium tracking-[-0.02em] ${
                  member.name === "Open" ? "text-acm-bright" : "text-ink"
                }`}
              >
                {member.name === "Open" ? "Position open" : member.name}
              </p>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section index="06" title="Open roles" lede="Pick the one that sounds like the thing you want to get better at.">
        <ul>
          {project.openRoles.map((role, i) => (
            <Reveal
              as="li"
              key={role.role}
              delay={i * 0.04}
              className="grid gap-3 border-b border-line py-7 lg:grid-cols-[10rem_9rem_1fr] lg:items-baseline lg:gap-10"
            >
              <span className="text-lg font-medium tracking-[-0.02em]">{role.role}</span>
              <span className="meta text-acm-bright">{role.level}</span>
              <span className="text-[0.9375rem] leading-relaxed text-ink-muted">{role.what}</span>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section index="07" title="What you can contribute">
        <ul className="grid gap-px bg-line sm:grid-cols-2">
          {project.contribute.map((item, i) => (
            <Reveal as="li" key={item} delay={i * 0.05} className="bg-void p-7">
              <p className="text-[0.9375rem] leading-relaxed text-ink-muted text-pretty">{item}</p>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section index="08" title="Timeline">
        <ProjectTimeline milestones={project.timeline} />
      </Section>

      <section className="border-t border-line bg-surface/30">
        <div className="shell flex flex-col items-start gap-8 py-20 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-display-sm">Want in?</h2>
            <p className="mt-4 max-w-prose text-[0.9375rem] leading-relaxed text-ink-muted">
              Apply to a role, or start by reading the problem behind it. Neither commits you to anything.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <ApplyPanel projectName={project.name} roles={project.openRoles.map((r) => r.role)} />
            <Link href="/problems" className="meta text-ink-muted transition-colors hover:text-ink">
              Browse problems →
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
