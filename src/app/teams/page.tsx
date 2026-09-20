import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/SectionHeading";
import { teams } from "@/data/teams";
import { Reveal } from "@/components/ui/Reveal";
import { Tag } from "@/components/ui/Badges";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Teams",
  description:
    "Six teams at ACM @ Amity — AI, Software, Research, Web, Design and Cybersecurity. What each one works on and where the open positions are.",
};

export default function TeamsPage() {
  const openCount = teams.reduce((n, t) => n + t.openPositions.length, 0);

  return (
    <>
      <PageHeader
        index="04"
        eyebrow="Teams"
        title={
          <>
            FIND PEOPLE WHOSE SKILLS
            <br />
            COVER WHAT YOURS DON&rsquo;T.
          </>
        }
        lede="Teams are how a problem becomes work that actually ships. You join one because of what it works on, not because of what it is called — and most projects need more than one."
        meta={[
          { label: "Teams", value: String(teams.length) },
          { label: "Open positions", value: String(openCount) },
          { label: "Prior experience", value: "Not required" },
          { label: "Member counts", value: "Demo data" },
        ]}
      />

      {/*
        Alternating editorial spreads rather than six identical cards: each team
        reads as a page of its own, which is what stops the section becoming a
        grid of interchangeable tiles.
      */}
      {teams.map((team, i) => {
        const flipped = i % 2 === 1;
        return (
          <section
            key={team.slug}
            id={team.slug}
            className={cn("scroll-mt-24 border-b border-line", i % 2 === 1 && "bg-surface/25")}
            aria-labelledby={`team-${team.slug}`}
          >
            <div className="shell py-20">
              <div
                className={cn(
                  "grid gap-12 lg:gap-20",
                  flipped ? "lg:grid-cols-[1fr_1.3fr]" : "lg:grid-cols-[1.3fr_1fr]",
                )}
              >
                <div className={cn(flipped && "lg:order-2")}>
                  <Reveal className="flex items-baseline gap-4">
                    <span className="meta tnum text-acm">{String(i + 1).padStart(2, "0")}</span>
                    <span className="meta">{team.domains.join(" · ")}</span>
                  </Reveal>

                  <Reveal delay={0.05}>
                    <h2 id={`team-${team.slug}`} className="mt-6 text-display-sm">
                      {team.name}
                    </h2>
                  </Reveal>

                  <Reveal delay={0.08}>
                    <p className="mt-6 max-w-prose text-[1.0625rem] leading-relaxed text-ink text-pretty">
                      {team.focus}
                    </p>
                    <p className="mt-6 max-w-prose text-[0.9375rem] leading-relaxed text-ink-muted text-pretty">
                      {team.charter}
                    </p>
                  </Reveal>

                  <Reveal delay={0.12} className="mt-9 flex flex-wrap gap-1.5">
                    {team.works.map((w) => (
                      <Tag key={w}>{w}</Tag>
                    ))}
                  </Reveal>
                </div>

                <div className={cn(flipped && "lg:order-1")}>
                  <Reveal delay={0.1} className="border-t border-line pt-7">
                    <div className="meta">Projects</div>
                    <ul className="mt-5 space-y-3">
                      {team.projects.map((p) => (
                        <li key={p.slug}>
                          <Link
                            href={`/projects/${p.slug}`}
                            className="group inline-flex items-center gap-2 text-[0.9375rem] text-ink-muted transition-colors duration-200 hover:text-acm-bright"
                          >
                            {p.name}
                            <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
                              →
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </Reveal>

                  <Reveal delay={0.14} className="mt-10 border-t border-line pt-7">
                    <div className="meta text-acm">Open positions</div>
                    <ul className="mt-5 space-y-5">
                      {team.openPositions.map((pos) => (
                        <li key={pos.role}>
                          <div className="flex items-baseline justify-between gap-4">
                            <span className="text-[0.9375rem] font-medium">{pos.role}</span>
                            <span className="font-mono text-micro uppercase text-ink-ghost">{pos.level}</span>
                          </div>
                          <p className="mt-1.5 text-sm text-ink-faint">{pos.note}</p>
                        </li>
                      ))}
                    </ul>
                  </Reveal>

                  <Reveal delay={0.18} className="mt-10 flex items-center justify-between border-t border-line pt-7">
                    <div>
                      <div className="meta">Meets</div>
                      <p className="mt-2 text-sm text-ink-muted">{team.meets}</p>
                    </div>
                    <div className="text-right">
                      <div className="meta">Contributors</div>
                      <p className="mt-2 text-sm tnum text-ink-muted">
                        {team.size} <span className="text-ink-ghost">(demo)</span>
                      </p>
                    </div>
                  </Reveal>

                  <Reveal delay={0.2} className="mt-9">
                    <Link
                      href="/join"
                      className="group inline-flex h-12 items-center gap-3 border border-line-strong px-6 font-mono text-label uppercase transition-colors duration-200 hover:border-acm hover:text-acm-bright"
                    >
                      Join {team.name.replace(" Team", "")}
                      <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </Link>
                  </Reveal>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      <section className="shell py-20">
        <Reveal className="grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-20">
          <h2 className="text-display-sm text-balance">Not sure which one?</h2>
          <div className="space-y-5 text-[1.0625rem] leading-relaxed text-ink-muted text-pretty">
            <p>
              Most people pick a team by picking a project first. Start from a problem that interests you and the team
              follows from what that problem needs.
            </p>
            <div className="flex flex-wrap gap-6 pt-3">
              <Link href="/discover" className="font-mono text-label uppercase text-acm-bright hover:text-white">
                Find your project →
              </Link>
              <Link href="/problems" className="font-mono text-label uppercase text-ink-muted hover:text-ink">
                Browse problems →
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
