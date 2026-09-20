import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { FeatureProject } from "@/components/projects/ProjectCard";
import { featuredProjects } from "@/data/projects";
import { Reveal } from "@/components/ui/Reveal";

export function WhatWeBuild() {
  return (
    <section className="shell py-section" aria-labelledby="what-we-build">
      <SectionHeading
        index="01"
        eyebrow="What we build"
        title={
          <span id="what-we-build">
            WE BUILD THINGS
            <br />
            THAT MATTER.
          </span>
        }
        lede={
          <>
            <p>
              Not another collection of ideas sitting inside a presentation. These are problems students can explore,
              contribute to and learn from.
            </p>
            <p className="mt-5 font-mono text-micro uppercase leading-relaxed text-ink-ghost">
              Every project below states what exists today and what does not.
            </p>
          </>
        }
        action={<ArrowLink href="/projects">All projects</ArrowLink>}
      />

      <div className="mt-12 grid gap-px bg-line lg:grid-cols-2">
        {featuredProjects.map((project, i) => (
          <FeatureProject key={project.slug} project={project} index={i} />
        ))}
      </div>

      <Reveal className="mt-8 border border-line px-6 py-5" delay={0.1}>
        <p className="font-mono text-micro uppercase leading-relaxed text-ink-faint">
          <span className="text-acm-bright">Note ·</span> The admissions assistant is a working student project, not an
          official university admissions channel. Quantum Handshake is an ongoing research effort with no published
          result. Neither is presented as more than it is.
        </p>
      </Reveal>
    </section>
  );
}
