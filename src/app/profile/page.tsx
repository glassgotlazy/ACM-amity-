import type { Metadata } from "next";
import Link from "next/link";
import { demoProfile, CONTRIBUTION_MODEL, TRACKED } from "@/data/profile";
import { Reveal } from "@/components/ui/Reveal";
import { Tag } from "@/components/ui/Badges";
import { Section } from "@/components/ui/Section";
import { SkillBars } from "@/components/profile/SkillBars";
import { ContributionCounters } from "@/components/profile/ContributionCounters";

export const metadata: Metadata = {
  title: "Contribution Profile",
  description:
    "A contribution record rather than a membership card — the projects worked on, the work completed, and the evidence behind it.",
};

export default function ProfilePage() {
  const p = demoProfile;

  return (
    <>
      <header className="rule-b relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-field grid-mask opacity-50" aria-hidden />
        <div className="shell relative pb-16 pt-32 sm:pt-40">
          <Reveal className="flex items-baseline gap-4">
            <span className="meta text-acm">07 /</span>
            <span className="meta">Contribution profile</span>
          </Reveal>

          <div className="mt-10 grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
            <div>
              <Reveal delay={0.05}>
                <h1 className="text-display-lg">{p.name}</h1>
              </Reveal>
              <Reveal delay={0.08} className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="meta-accent">{p.standing}</span>
                <span className="h-3 w-px bg-line-strong" aria-hidden />
                <span className="font-mono text-micro uppercase text-ink-faint">{p.course}</span>
                <span className="font-mono text-micro uppercase text-ink-faint">{p.year}</span>
              </Reveal>
              <Reveal delay={0.12} className="mt-9 max-w-prose border-l border-acm pl-6">
                <p className="text-lg leading-relaxed text-ink-muted text-pretty">{p.statement}</p>
              </Reveal>
            </div>

            <Reveal delay={0.1}>
              <div className="meta border-b border-line pb-3">Interests</div>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {p.interests.map((i) => (
                  <Tag key={i} className="px-4 py-2.5 text-label">
                    {i}
                  </Tag>
                ))}
              </div>

              <div className="meta mt-10 border-b border-line pb-3">Links</div>
              <ul className="mt-5 space-y-3">
                {p.links.map((link) => (
                  <li key={link.label} className="flex items-baseline justify-between gap-4">
                    <span className="text-sm text-ink-muted">{link.label}</span>
                    <span className="font-mono text-micro uppercase text-ink-ghost">
                      {link.href ?? "Not linked"}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal delay={0.18} className="mt-14 border border-line px-6 py-4">
            <p className="font-mono text-micro uppercase leading-relaxed text-ink-ghost">
              <span className="text-acm">Demo profile ·</span> every figure on this page is placeholder content. The
              structure is modelled on what a real contribution record would hold, so a live source can replace it
              without redesigning the page.
            </p>
          </Reveal>
        </div>
      </header>

      <Section index="01" title="Your contribution" lede="The record, not the membership.">
        <ContributionCounters contributions={p.contributions} />
      </Section>

      <Section index="02" title="Projects">
        <ul className="space-y-px bg-line">
          {p.projects.map((project, i) => (
            <Reveal as="li" key={project.slug} delay={i * 0.06} className="bg-void py-8">
              <div className="grid gap-5 lg:grid-cols-[1.2fr_1.6fr] lg:gap-14">
                <div>
                  <span className="font-mono text-micro uppercase text-ink-ghost">{project.status}</span>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                    <Link
                      href={`/projects/${project.slug}`}
                      className="transition-colors duration-200 hover:text-acm-bright"
                    >
                      {project.name}
                    </Link>
                  </h3>
                  <p className="mt-2.5 meta-accent">{project.role}</p>
                  <p className="mt-2 font-mono text-micro uppercase text-ink-ghost">{project.period}</p>
                </div>
                <ul className="space-y-3.5">
                  {project.did.map((d) => (
                    <li key={d} className="flex gap-4 text-[0.9375rem] leading-relaxed text-ink-muted">
                      <span aria-hidden className="mt-2.5 h-px w-4 shrink-0 bg-acm/60" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section index="03" title="Skills">
        <SkillBars skills={p.skills} />
      </Section>

      <Section index="04" title="How it started" lede="Nine weeks, from reading a problem to writing up a result.">
        <ol className="relative border-l border-line pl-8">
          {p.timeline.map((entry, i) => (
            <Reveal as="li" key={entry.when} delay={i * 0.05} className="relative pb-9 last:pb-0">
              <span
                aria-hidden
                className="absolute -left-[37px] top-1.5 block h-2.5 w-2.5 border border-acm bg-void"
              />
              <span className="meta text-ink-ghost">{entry.when}</span>
              <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-muted">{entry.what}</p>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section index="05" title="The model" lede="Why this page exists at all.">
        <div className="grid gap-px bg-line sm:grid-cols-2">
          {CONTRIBUTION_MODEL.map((entry, i) => (
            <Reveal key={entry.kind} delay={i * 0.06} className="relative bg-void p-8">
              {entry.tone === "accent" ? (
                <span aria-hidden className="absolute left-0 top-0 h-full w-px bg-acm" />
              ) : null}
              <div className={entry.tone === "accent" ? "meta-accent" : "meta"}>{entry.kind}</div>
              <p
                className={`mt-5 text-xl font-semibold tracking-[-0.03em] ${
                  entry.tone === "accent" ? "text-ink" : "text-ink-faint"
                }`}
              >
                “{entry.claim}”
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ink-muted">{entry.evidence}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10" delay={0.1}>
          <div className="meta border-b border-line pb-3">Eventually tracked</div>
          <ul className="mt-5 grid gap-x-10 gap-y-2.5 sm:grid-cols-2">
            {TRACKED.map((t, i) => (
              <li key={t} className="flex items-baseline gap-3 border-b border-line-faint py-2 text-sm text-ink-muted">
                <span className="meta tnum text-ink-ghost">{String(i + 1).padStart(2, "0")}</span>
                {t}
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>

      <section className="border-t border-line bg-surface/30">
        <div className="shell flex flex-col items-start gap-8 py-20 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="max-w-2xl text-display-sm text-balance">
            This page is empty until you build something. That is the whole idea.
          </h2>
          <Link
            href="/join"
            className="group inline-flex h-14 shrink-0 items-center gap-3 bg-acm px-8 font-mono text-label uppercase text-white transition-colors duration-200 hover:bg-acm-bright"
          >
            Start your record
            <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}
