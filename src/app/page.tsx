import { Hero } from "@/components/home/Hero";
import { WhatWeBuild } from "@/components/home/WhatWeBuild";
import { ProblemLabIntro } from "@/components/home/ProblemLabIntro";
import { ProblemOfTheWeek } from "@/components/home/ProblemOfTheWeek";
import { DifficultySystem } from "@/components/home/DifficultySystem";
import { ContributionPitch } from "@/components/home/ContributionPitch";
import { IdeasTeaser } from "@/components/home/IdeasTeaser";
import { RecruitCTA } from "@/components/home/RecruitCTA";
import { FinalCTA } from "@/components/home/FinalCTA";
import { problemOfTheWeek } from "@/data/problems";

/**
 * The homepage is prerendered, so without revalidation the weekly pick would
 * be frozen at build time and the section's "rotates weekly" claim would be
 * false until the next deploy. Regenerating daily is far more often than the
 * pick changes, which guarantees the rotation lands on time while keeping the
 * page static for every visitor.
 */
export const revalidate = 86400;

export default function Home() {
  // Resolved on the server so the weekly pick is baked into the HTML.
  const featured = problemOfTheWeek();

  return (
    <>
      <Hero />
      <WhatWeBuild />
      <ProblemLabIntro />
      <ProblemOfTheWeek problem={featured} />
      <DifficultySystem />
      <IdeasTeaser />
      <ContributionPitch />
      <RecruitCTA />
      <FinalCTA />
    </>
  );
}
