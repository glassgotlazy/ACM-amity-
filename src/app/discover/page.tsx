import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/SectionHeading";
import { DiscoverFlow } from "@/components/discover/DiscoverFlow";
import { getProjects } from "@/lib/cms/read";

export const metadata: Metadata = {
  title: "Find Your Project",
  description: "Two questions, then a shortlist of problems, projects and unclaimed ideas that fit what you want to build.",
};

export default async function DiscoverPage() {
  const projects = await getProjects();
  return (
    <>
      <PageHeader
        eyebrow="Discover"
        title={
          <>
            WHAT DO YOU
            <br />
            WANT TO BUILD?
          </>
        }
        lede="Two questions. Then a shortlist of problems to explore, projects with open roles, and unclaimed ideas — ranked by how closely they match what you picked."
      />
      <DiscoverFlow projects={projects} />
    </>
  );
}
