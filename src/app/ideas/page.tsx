import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/SectionHeading";
import { IdeaIndex } from "@/components/ideas/IdeaIndex";
import { ideas } from "@/data/ideas";
import { RecruitCTA } from "@/components/home/RecruitCTA";

export const metadata: Metadata = {
  title: "Project Ideas",
  description:
    "Unclaimed starting points for students who want to build but have not found a problem yet — filtered by level and domain.",
};

export default function IdeasPage() {
  return (
    <>
      <PageHeader
        index="06"
        eyebrow="Project ideas"
        title={
          <>
            DON&rsquo;T HAVE AN IDEA?
            <br />
            WE&rsquo;VE GOT PROBLEMS.
          </>
        }
        lede="Not knowing what to build is the most common reason people never start. Every idea below is unclaimed and has no team — which means the first person in gets to decide what it becomes."
        meta={[
          { label: "Ideas", value: String(ideas.length) },
          { label: "Beginner", value: String(ideas.filter((i) => i.band === "Beginner").length) },
          { label: "Research", value: String(ideas.filter((i) => i.band === "Research").length) },
          { label: "Claimed", value: "0" },
        ]}
      />
      <IdeaIndex />
      <RecruitCTA />
    </>
  );
}
