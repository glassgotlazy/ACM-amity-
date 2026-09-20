"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import Link from "next/link";
import { DOMAINS, COMFORT, type ComfortId } from "@/data/taxonomy";
import { ideas } from "@/data/ideas";
import { projects } from "@/data/projects";
import { problems } from "@/data/problems";
import { DifficultyMeter, StatusPill, Tag } from "@/components/ui/Badges";
import { Button } from "@/components/ui/Button";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

const INTERESTS = [...DOMAINS, "Leadership"] as const;

/** Comfort maps to the level range a recommendation should sit in. */
const COMFORT_LEVELS: Record<ComfortId, string[]> = {
  beginner: ["build", "integrate"],
  intermediate: ["integrate", "research"],
  advanced: ["research", "deploy"],
  learning: ["build", "integrate", "research", "deploy"],
};

type Step = 0 | 1 | 2;

export function DiscoverFlow() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState<Step>(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [comfort, setComfort] = useState<ComfortId | null>(null);

  const results = useMemo(() => {
    if (!comfort) return { ideas: [], projects: [], problems: [] };
    const levels = COMFORT_LEVELS[comfort];
    const matches = (domains: readonly string[]) =>
      interests.length === 0 || domains.some((d) => interests.includes(d));

    // Rank by how many of the selected interests a candidate covers, so a
    // close match always sorts above an incidental one.
    const score = (domains: readonly string[]) => domains.filter((d) => interests.includes(d)).length;

    return {
      ideas: ideas
        .filter((i) => matches(i.domains) && levels.includes(i.level))
        .sort((a, b) => score(b.domains) - score(a.domains))
        .slice(0, 4),
      projects: projects
        .filter((p) => matches(p.domains))
        .sort((a, b) => score(b.domains) - score(a.domains))
        .slice(0, 3),
      problems: problems
        .filter((p) => matches(p.domains))
        .sort((a, b) => score(b.domains) - score(a.domains))
        .slice(0, 3),
    };
  }, [interests, comfort]);

  const total = results.ideas.length + results.projects.length + results.problems.length;

  function toggle(interest: string) {
    setInterests((v) => (v.includes(interest) ? v.filter((i) => i !== interest) : [...v, interest]));
  }

  const slide = {
    initial: reduce ? { opacity: 0 } : { opacity: 0, x: 24 },
    animate: reduce ? { opacity: 1 } : { opacity: 1, x: 0 },
    exit: reduce ? { opacity: 0 } : { opacity: 0, x: -24 },
    transition: { duration: 0.4, ease },
  };

  return (
    <div className="shell py-16">
      {/* Progress: three segments, filled as you go. */}
      <div className="flex items-center gap-4 border-b border-line pb-5">
        {["Interests", "Experience", "Matches"].map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-4">
            <div className="flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className={cn("meta", i <= step ? "text-ink" : "text-ink-ghost")}>
                  {String(i + 1).padStart(2, "0")} {label}
                </span>
              </div>
              <div className="mt-3 h-px w-full bg-line-strong">
                <motion.div
                  className="h-px origin-left bg-acm"
                  initial={false}
                  animate={{ scaleX: i <= step ? 1 : 0 }}
                  transition={{ duration: reduce ? 0 : 0.5, ease }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="min-h-[24rem] py-14">
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div key="s0" {...slide}>
              <h2 className="text-display-sm">What interests you?</h2>
              <p className="mt-5 max-w-prose text-[1.0625rem] leading-relaxed text-ink-muted">
                Pick as many as you like. This is about what you want to spend time on, not what you already know.
              </p>

              <div className="mt-11 flex flex-wrap gap-2.5">
                {INTERESTS.map((interest, i) => {
                  const active = interests.includes(interest);
                  return (
                    <motion.button
                      key={interest}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggle(interest)}
                      initial={reduce ? undefined : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.03 }}
                      className={cn(
                        "border px-5 py-3.5 font-mono text-label uppercase transition-colors duration-200",
                        active
                          ? "border-acm bg-acm-wash text-ink"
                          : "border-line text-ink-faint hover:border-line-strong hover:text-ink-muted",
                      )}
                    >
                      {interest}
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-14 flex items-center gap-6">
                <Button size="lg" onClick={() => setStep(1)} arrow>
                  Continue
                </Button>
                <span className="font-mono text-micro uppercase text-ink-ghost">
                  {interests.length === 0 ? "Or continue to see everything" : `${interests.length} selected`}
                </span>
              </div>
            </motion.div>
          ) : null}

          {step === 1 ? (
            <motion.div key="s1" {...slide}>
              <h2 className="text-display-sm">How comfortable are you?</h2>
              <p className="mt-5 max-w-prose text-[1.0625rem] leading-relaxed text-ink-muted">
                There is no wrong answer here, and the last option is not a lesser one — it usually produces the better
                match.
              </p>

              <div className="mt-11 grid gap-px bg-line sm:grid-cols-2">
                {COMFORT.map((option, i) => {
                  const active = comfort === option.id;
                  return (
                    <motion.button
                      key={option.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setComfort(option.id);
                        setStep(2);
                      }}
                      initial={reduce ? undefined : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.05 }}
                      className={cn(
                        "group relative bg-void p-8 text-left transition-colors duration-200",
                        active ? "bg-surface-raised" : "hover:bg-surface/50",
                      )}
                    >
                      <span
                        aria-hidden
                        className="absolute left-0 top-0 h-full w-px origin-top scale-y-0 bg-acm transition-transform duration-400 ease-out group-hover:scale-y-100"
                      />
                      <span className="meta tnum text-ink-ghost">{String(i + 1).padStart(2, "0")}</span>
                      <span className="mt-5 block text-2xl font-semibold tracking-[-0.03em] transition-colors duration-200 group-hover:text-acm-bright">
                        {option.label}
                      </span>
                      <span className="mt-3 block text-sm leading-relaxed text-ink-muted">{option.note}</span>
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-12">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  ← Back
                </Button>
              </div>
            </motion.div>
          ) : null}

          {step === 2 ? (
            <motion.div key="s2" {...slide}>
              <div className="flex flex-wrap items-baseline justify-between gap-5 border-b border-line pb-5">
                <h2 className="text-display-sm">Projects for you</h2>
                <span className="font-mono text-micro uppercase text-ink-ghost">
                  {total} match{total === 1 ? "" : "es"}
                </span>
              </div>

              {results.problems.length ? (
                <ResultBlock title="Start from a problem" index="01">
                  {results.problems.map((problem, i) => (
                    <ResultRow
                      key={problem.slug}
                      href={`/problems/${problem.slug}`}
                      title={problem.title}
                      note={problem.question}
                      delay={i * 0.05}
                      aside={<DifficultyMeter level={problem.level} />}
                    />
                  ))}
                </ResultBlock>
              ) : null}

              {results.projects.length ? (
                <ResultBlock title="Join an existing project" index="02">
                  {results.projects.map((project, i) => (
                    <ResultRow
                      key={project.slug}
                      href={`/projects/${project.slug}`}
                      title={project.name}
                      note={project.summary}
                      delay={i * 0.05}
                      aside={<StatusPill status={project.status} />}
                    />
                  ))}
                </ResultBlock>
              ) : null}

              {results.ideas.length ? (
                <ResultBlock title="Or take an unclaimed idea" index="03">
                  {results.ideas.map((idea, i) => (
                    <ResultRow
                      key={idea.slug}
                      href={`/ideas#${idea.slug}`}
                      title={idea.name}
                      note={idea.tagline}
                      delay={i * 0.05}
                      aside={
                        <span className="flex flex-wrap items-center gap-2">
                          {idea.domains.slice(0, 2).map((d) => (
                            <Tag key={d}>{d}</Tag>
                          ))}
                        </span>
                      }
                    />
                  ))}
                </ResultBlock>
              ) : null}

              {total === 0 ? (
                <div className="border border-line px-8 py-20 text-center">
                  <p className="font-mono text-label uppercase text-ink-faint">
                    Nothing matches that combination yet.
                  </p>
                  <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
                    That is a gap in what ACM is working on, not in what you picked. Tell us about it.
                  </p>
                  <Link
                    href="/problems/submit"
                    className="mt-7 inline-flex font-mono text-label uppercase text-acm-bright hover:text-white"
                  >
                    Submit a problem →
                  </Link>
                </div>
              ) : null}

              <div className="mt-14 flex flex-wrap items-center gap-6 border-t border-line pt-10">
                <Button href="/join" size="lg" arrow>
                  Join ACM
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStep(0);
                    setComfort(null);
                  }}
                >
                  ← Start over
                </Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ResultBlock({ title, index, children }: { title: string; index: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <div className="flex items-baseline gap-4">
        <span className="meta tnum text-acm">{index}</span>
        <h3 className="meta text-ink">{title}</h3>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ResultRow({
  href,
  title,
  note,
  aside,
  delay,
}: {
  href: string;
  title: string;
  note: string;
  aside?: React.ReactNode;
  delay: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? undefined : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + delay }}
    >
      <Link
        href={href}
        className="group grid gap-3 border-b border-line py-6 transition-[padding] duration-500 ease-out hover:pl-4 lg:grid-cols-[1fr_auto] lg:items-baseline lg:gap-10"
      >
        <span>
          <span className="block text-lg font-medium tracking-[-0.02em] transition-colors duration-200 group-hover:text-acm-bright">
            {title}
          </span>
          <span className="mt-1.5 block max-w-prose text-sm leading-relaxed text-ink-muted">{note}</span>
        </span>
        {aside ? <span className="shrink-0">{aside}</span> : null}
      </Link>
    </motion.div>
  );
}
