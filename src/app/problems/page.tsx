import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/SectionHeading";
import { ProblemIndex } from "@/components/problems/ProblemIndex";
import { DifficultySystem } from "@/components/home/DifficultySystem";
import { problems } from "@/data/problems";
import { PROBLEM_CATEGORIES } from "@/data/taxonomy";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Problem Lab",
  description:
    "Don't start with an idea. Start with a problem. Student-written problem statements from around campus, each with possible directions, technologies and open roles.",
};

export default function ProblemsPage() {
  const roleCount = new Set(problems.flatMap((p) => p.openRoles)).size;

  return (
    <>
      <PageHeader
        index="02"
        eyebrow="Problem Lab"
        title={
          <>
            DON&rsquo;T START WITH AN IDEA.
            <br />
            <span className="text-acm-bright">START WITH A PROBLEM.</span>
          </>
        }
        lede="Universities are rapidly adopting AI, automation, digital platforms and data-driven systems. That creates new challenges that still need better solutions. Find a problem worth solving."
        meta={[
          { label: "Problem statements", value: String(problems.length) },
          { label: "Categories", value: String(PROBLEM_CATEGORIES.length) },
          { label: "Role types open", value: String(roleCount) },
          { label: "Officially commissioned", value: "None" },
        ]}
      >
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link
            href="/problems/submit"
            className="group inline-flex h-12 items-center gap-3 border border-line-strong px-7 font-mono text-label uppercase transition-colors duration-200 hover:border-acm hover:text-acm-bright"
          >
            Submit a problem
            <span aria-hidden className="transition-transform duration-300 ease-out group-hover:translate-x-1">
              →
            </span>
          </Link>
          <p className="max-w-md font-mono text-micro uppercase leading-relaxed text-ink-ghost">
            Every statement below was written by students. None has been commissioned, confirmed or endorsed by the
            university.
          </p>
        </div>
      </PageHeader>

      <ProblemIndex />

      <section className="border-y border-line bg-surface/30">
        <div className="shell py-16">
          <Reveal className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
            <div>
              <div className="meta">How a problem becomes work</div>
              <h2 className="mt-6 text-display-sm text-balance">
                A problem statement is the start of a project, not a substitute for one.
              </h2>
            </div>
            <ol className="space-y-5">
              {[
                "Read a problem until you can argue with it. The framing is a first draft, not a specification.",
                "Pick a direction. Most problems here have three or four credible approaches and no obvious winner.",
                "Propose the smallest version that would still be useful, and say what you would build first.",
                "Find people whose skills cover what yours do not — that is what the roles list is for.",
                "Build. Document what broke. The failures are the part nobody else can copy from you.",
              ].map((step, i) => (
                <li key={step} className="flex gap-6 border-b border-line pb-5">
                  <span className="meta tnum shrink-0 text-acm-bright">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[0.9375rem] leading-relaxed text-ink-muted text-pretty">{step}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      <DifficultySystem />
    </>
  );
}
