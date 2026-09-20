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
