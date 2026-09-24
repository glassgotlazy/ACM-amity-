import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/SectionHeading";
import { CmsTitle } from "@/components/ui/Lines";
import { getPage, getTeam, getWorkingTeams } from "@/lib/cms/read";
import type { PublicMember } from "@/lib/cms/types";
import { Reveal } from "@/components/ui/Reveal";
import { Tag } from "@/components/ui/Badges";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Teams",
  description:
    "Six teams at ACM @ Amity — AI, Software, Research, Web, Design and Cybersecurity. What each one works on and where the open positions are.",
};

export default async function TeamsPage() {
  const [coreTeam, teams, page, core] = await Promise.all([getTeam(), getWorkingTeams(), getPage("page_teams"), getPage("page_teams_core")]);
  const openCount = teams.reduce((n, t) => n + t.openPositions.length, 0);

  return (
    <>
      <PageHeader
        index="04"
        eyebrow={page.eyebrow}
        title={<CmsTitle text={page.title} />}
        lede={page.body || undefined}
        meta={[
          { label: "Teams", value: String(teams.length) },
          { label: "Open positions", value: String(openCount) },
          { label: "Prior experience", value: "Not required" },
          { label: "Member counts", value: "Demo data" },
        ]}
      />

      {coreTeam.length ? (
      <section className="border-b border-line" aria-labelledby="core-team">
        <div className="shell py-20">
          <Reveal className="flex items-baseline gap-4">
            <span className="meta text-acm-bright">00 /</span>
            <span className="meta">{core.eyebrow}</span>
          </Reveal>

          <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_1.7fr] lg:gap-20">
            <Reveal delay={0.05}>
              <h2 id="core-team" className="text-display-sm text-balance">
                <CmsTitle text={core.title} />
              </h2>
              {core.body ? (
                <p className="mt-6 max-w-prose text-[0.9375rem] leading-relaxed text-ink-muted text-pretty">{core.body}</p>
              ) : null}
            </Reveal>

            <div className="grid gap-px bg-line sm:grid-cols-2">
              {coreTeam.map((person, i) => (
                <Reveal key={person.id} delay={0.06 * i} className="bg-void p-7">
                  <Officer person={person} />
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>
      ) : null}

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
                    <span className="meta tnum text-acm-bright">{String(i + 1).padStart(2, "0")}</span>
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
                    <div className="meta text-acm-bright">Open positions</div>
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
              <Link href="/discover" className="font-mono text-label uppercase text-acm-bright hover:text-ink">
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

const LINKS: { key: "linkedin_url" | "github_url" | "website_url"; label: string }[] = [
  { key: "linkedin_url", label: "LinkedIn" },
  { key: "github_url", label: "GitHub" },
  { key: "website_url", label: "Website" },
];

/** One office bearer: photo when uploaded, role, name, remit and links. */
function Officer({ person }: { person: PublicMember }) {
  const links = LINKS.filter((l) => person[l.key]);
  return (
    <div className="flex gap-5">
      {person.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- CMS photo, size-checked on upload
        <img
          src={person.photo_url}
          alt=""
          loading="lazy"
          decoding="async"
          width={64}
          height={64}
          className="h-16 w-16 shrink-0 border border-line object-cover"
        />
      ) : null}
      <div className="min-w-0">
        <div className="meta text-acm-bright">{person.role}</div>
        <h3 className="mt-4 text-xl font-semibold tracking-[-0.025em]">{person.name}</h3>
        {person.bio ? <p className="mt-3 text-sm leading-relaxed text-ink-muted text-pretty">{person.bio}</p> : null}
        {links.length || person.email ? (
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
            {links.map((l) => (
              <li key={l.key}>
                <a
                  href={person[l.key]!}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-mono text-micro uppercase text-ink-faint transition-colors hover:text-acm-bright"
                >
                  {l.label} ↗<span className="sr-only"> — {person.name}</span>
                </a>
              </li>
            ))}
            {person.email ? (
              <li>
                <a
                  href={`mailto:${person.email}`}
                  className="font-mono text-micro uppercase text-ink-faint transition-colors hover:text-acm-bright"
                >
                  Email<span className="sr-only"> {person.name}</span>
                </a>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
