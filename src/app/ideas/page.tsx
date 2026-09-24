import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/SectionHeading";
import { CmsTitle } from "@/components/ui/Lines";
import { IdeaIndex } from "@/components/ideas/IdeaIndex";
import { RecruitCTA } from "@/components/home/RecruitCTA";
import { getIdeas, getPage, getSection } from "@/lib/cms/read";

export const metadata: Metadata = {
  title: "Project Ideas",
  description:
    "Unclaimed starting points for students who want to build but have not found a problem yet — filtered by level and domain.",
};

export default async function IdeasPage() {
  const [ideas, page] = await Promise.all([getIdeas(), getPage("page_ideas")]);
  const recruit = await getSection("recruit");
  return (
    <>
      <PageHeader
        index="06"
        eyebrow={page.eyebrow}
        title={<CmsTitle text={page.title} />}
        lede={page.body || undefined}
        meta={[
          { label: "Ideas", value: String(ideas.length) },
          { label: "Beginner", value: String(ideas.filter((i) => i.band === "Beginner").length) },
          { label: "Research", value: String(ideas.filter((i) => i.band === "Research").length) },
          { label: "Claimed", value: "0" },
        ]}
      />
      <IdeaIndex ideas={ideas} />
      <RecruitCTA section={recruit} />
    </>
  );
}
