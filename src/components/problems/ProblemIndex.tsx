"use client";

import { AnimatePresence, LayoutGroup } from "framer-motion";
import { useMemo, useState } from "react";
import { problems } from "@/data/problems";
import { LEVELS, PROBLEM_CATEGORIES } from "@/data/taxonomy";
import { FilterBar } from "@/components/ui/FilterBar";
import { ProblemCard } from "./ProblemCard";

const CATEGORY_FILTERS = ["All", ...PROBLEM_CATEGORIES] as const;
const LEVEL_FILTERS = ["Any level", ...LEVELS.map((l) => l.name)] as const;

export function ProblemIndex() {
  const [category, setCategory] = useState<string>("All");
  const [levelName, setLevelName] = useState<string>("Any level");

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: problems.length };
    for (const c of PROBLEM_CATEGORIES) map[c] = problems.filter((p) => p.category === c).length;
    return map;
  }, []);

  const shown = useMemo(() => {
    const levelId = LEVELS.find((l) => l.name === levelName)?.id;
    return problems.filter(
      (p) => (category === "All" || p.category === category) && (!levelId || p.level === levelId),
    );
  }, [category, levelName]);

  return (
    <section className="shell py-14">
      <div className="sticky top-[4.5rem] z-40 -mx-gutter space-y-3 border-b border-line bg-void/90 px-gutter py-4 backdrop-blur-xl">
        <FilterBar
          label="Filter problems by category"
          options={CATEGORY_FILTERS}
          value={category}
          onChange={setCategory}
          counts={counts}
          layoutId="problem-category"
        />
        <div className="flex flex-wrap items-center gap-4 border-t border-line-faint pt-3">
          <span className="font-mono text-micro uppercase text-ink-ghost">Difficulty</span>
          <FilterBar
            label="Filter problems by difficulty"
            options={LEVEL_FILTERS}
            value={levelName}
            onChange={setLevelName}
            layoutId="problem-level"
          />
        </div>
      </div>

      <LayoutGroup>
        <div className="mt-10 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map((problem, i) => (
              <ProblemCard key={problem.slug} problem={problem} index={i} />
            ))}
          </AnimatePresence>
        </div>
      </LayoutGroup>

      {shown.length === 0 ? (
        <div className="border border-line px-8 py-20 text-center">
          <p className="font-mono text-label uppercase text-ink-faint">Nothing matches that combination yet.</p>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
            That is a gap, not an error. If you have noticed a problem that belongs here, write it up.
          </p>
          <a
            href="/problems/submit"
            className="mt-7 inline-flex items-center gap-2 font-mono text-label uppercase text-acm-bright hover:text-white"
          >
            Submit a problem →
          </a>
        </div>
      ) : null}
    </section>
  );
}
