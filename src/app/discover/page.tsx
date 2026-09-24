import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/SectionHeading";
import { DiscoverFlow } from "@/components/discover/DiscoverFlow";
import { getIdeas, getPage, getProblems, getProjects } from "@/lib/cms/read";
import { CmsTitle } from "@/components/ui/Lines";

export const metadata: Metadata = {
  title: "Find Your Project",
  description: "Two questions, then a shortlist of problems, projects and unclaimed ideas that fit what you want to build.",
};

export default async function DiscoverPage() {
  const [projects, ideas, problems, page] = await Promise.all([getProjects(), getIdeas(), getProblems(), getPage("page_discover")]);
  return (
    <>
      <PageHeader
        eyebrow={page.eyebrow}
        title={<CmsTitle text={page.title} />}
        lede={page.body || undefined}
      />
      <DiscoverFlow projects={projects} ideas={ideas} problems={problems} />
    </>
  );
}
