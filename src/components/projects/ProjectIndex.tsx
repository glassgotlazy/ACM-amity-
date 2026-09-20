"use client";

import { AnimatePresence, LayoutGroup } from "framer-motion";
import { useMemo, useState } from "react";
import { projects } from "@/data/projects";
import { DOMAINS } from "@/data/taxonomy";
import { FilterBar } from "@/components/ui/FilterBar";
import { ProjectRow } from "./ProjectCard";

const FILTERS = ["All", ...DOMAINS.filter((d) => d !== "IoT" && d !== "Design")] as const;

export function ProjectIndex() {
  const [filter, setFilter] = useState<string>("All");

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: projects.length };
    for (const domain of DOMAINS) {
      map[domain] = projects.filter((p) => p.domains.includes(domain)).length;
    }
    return map;
  }, []);

  const shown = useMemo(
    () => (filter === "All" ? projects : projects.filter((p) => p.domains.includes(filter as never))),
    [filter],
  );

  return (
    <section className="shell py-16" aria-labelledby="project-list">
      <h2 id="project-list" className="sr-only">
        All projects
      </h2>

      <div className="sticky top-[4.5rem] z-40 -mx-gutter border-b border-line bg-void/90 px-gutter py-4 backdrop-blur-xl">
        <FilterBar
          label="Filter projects by domain"
          options={FILTERS}
          value={filter}
          onChange={setFilter}
          counts={counts}
          layoutId="project-filter"
        />
      </div>

      <LayoutGroup>
        <div className="mt-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map((project, i) => (
              <ProjectRow key={project.slug} project={project} index={i} />
            ))}
          </AnimatePresence>
        </div>
      </LayoutGroup>

      {shown.length === 0 ? (
        <p className="py-20 text-center font-mono text-label uppercase text-ink-faint">
          No projects in this domain yet — which is an opening, not a dead end.
        </p>
      ) : null}
    </section>
  );
}
