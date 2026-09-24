import { Hero } from "@/components/home/Hero";
import { Announcements } from "@/components/home/Announcements";
import { WhatWeBuild } from "@/components/home/WhatWeBuild";
import { ProblemLabIntro } from "@/components/home/ProblemLabIntro";
import { ProblemOfTheWeek } from "@/components/home/ProblemOfTheWeek";
import { EventsSection } from "@/components/home/EventsSection";
import { DifficultySystem } from "@/components/home/DifficultySystem";
import { ContributionPitch } from "@/components/home/ContributionPitch";
import { IdeasTeaser } from "@/components/home/IdeasTeaser";
import { RecruitCTA } from "@/components/home/RecruitCTA";
import { FinalCTA } from "@/components/home/FinalCTA";
import {
  getAnnouncements,
  getEvents,
  getIdeas,
  getProblems,
  getProjects,
  getSections,
  getSettings,
  problemOfTheWeek,
  upcoming,
} from "@/lib/cms/read";
import type { SectionKey } from "@/lib/cms/types";

/**
 * The homepage is prerendered, so without revalidation the weekly pick would
 * be frozen at build time and the section's "rotates weekly" claim would be
 * false until the next deploy. Regenerating daily is far more often than the
 * pick changes, which guarantees the rotation lands on time while keeping the
 * page static for every visitor. CMS edits do not wait for this: saving in the
 * admin revalidates the page immediately.
 */
export const revalidate = 86400;

/** Sections that carry the editorial "01 /" numbering. */
const NUMBERED: SectionKey[] = [
  "what_we_build",
  "problem_lab",
  "problem_of_the_week",
  "events",
  "difficulty",
  "ideas",
  "contribution",
];

export default async function Home() {
  const [sections, settings, events, announcements, projects, problems, ideas, featured] = await Promise.all([
    getSections(),
    getSettings(),
    getEvents(),
    getAnnouncements(),
    getProjects(),
    getProblems(),
    getIdeas(),
    // Resolved on the server so the weekly pick is baked into the HTML.
    problemOfTheWeek(),
  ]);
  const nextEvents = upcoming(events).slice(0, 3);
  const featuredProjects = projects.filter((p) => p.featured);

  // A section with nothing to show is skipped like a hidden one, so the
  // numbering never jumps and no empty band appears on the page.
  const visible = sections.filter(
    (s) =>
      s.enabled &&
      !(s.key === "events" && nextEvents.length === 0) &&
      !(s.key === "announcements" && announcements.length === 0) &&
      !(s.key === "problem_of_the_week" && !featured),
  );

  let n = 0;
  const numbered = new Map(
    visible.filter((s) => NUMBERED.includes(s.key as SectionKey)).map((s) => [s.key, String(++n).padStart(2, "0")]),
  );

  return (
    <>
      {visible.map((section) => {
        const index = numbered.get(section.key) ?? "";
        switch (section.key) {
          case "hero":
            return <Hero key={section.key} section={section} />;
          case "announcements":
            return <Announcements key={section.key} section={section} items={announcements} />;
          case "what_we_build":
            return <WhatWeBuild key={section.key} section={section} index={index} projects={featuredProjects} />;
          case "problem_lab":
            return <ProblemLabIntro key={section.key} section={section} index={index} problems={problems} />;
          case "problem_of_the_week":
            return <ProblemOfTheWeek key={section.key} section={section} index={index} problem={featured!} />;
          case "events":
            return <EventsSection key={section.key} section={section} index={index} events={nextEvents} />;
          case "difficulty":
            return <DifficultySystem key={section.key} section={section} index={index} />;
          case "ideas":
            return <IdeasTeaser key={section.key} section={section} index={index} ideas={ideas} />;
          case "contribution":
            return <ContributionPitch key={section.key} section={section} index={index} />;
          case "recruit":
            return <RecruitCTA key={section.key} section={section} />;
          case "final_cta":
            return <FinalCTA key={section.key} section={section} pillars={settings.pillars} />;
        }
      })}
    </>
  );
}
