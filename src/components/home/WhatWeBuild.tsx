import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { FeatureProject } from "@/components/projects/ProjectCard";
import { Reveal } from "@/components/ui/Reveal";
import { Lines } from "@/components/ui/Lines";
import type { Project, Section } from "@/lib/cms/types";

export function WhatWeBuild({ section, index, projects }: { section: Section; index: string; projects: Project[] }) {
  return (
    <section className="shell py-section" aria-labelledby="what-we-build">
      <SectionHeading
        index={index}
        eyebrow={section.eyebrow}
        title={
          <span id="what-we-build">
            <Lines text={section.title} />
          </span>
        }
        lede={
          section.body || section.subtitle ? (
            <>
              {section.body ? <p>{section.body}</p> : null}
              {section.subtitle ? (
                <p className="mt-5 label-sm leading-relaxed text-ink-ghost">{section.subtitle}</p>
              ) : null}
            </>
          ) : undefined
        }
        action={
          section.primary_label && section.primary_href ? (
            <ArrowLink href={section.primary_href}>{section.primary_label}</ArrowLink>
          ) : undefined
        }
      />

      {projects.length ? (
        <div className="mt-12 grid gap-px bg-line lg:grid-cols-2">
          {projects.map((project, i) => (
            <FeatureProject key={project.slug} project={project} index={i} />
          ))}
        </div>
      ) : null}

      {section.note ? (
        <Reveal className="mt-8 border border-line px-6 py-5" delay={0.1}>
          <p className="label-sm leading-relaxed text-ink-faint">
            <span className="text-acm-bright">Note ·</span> {section.note}
          </p>
        </Reveal>
      ) : null}
    </section>
  );
}
