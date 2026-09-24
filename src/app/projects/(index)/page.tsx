import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/SectionHeading";
import { CmsTitle } from "@/components/ui/Lines";
import { ProjectIndex } from "@/components/projects/ProjectIndex";
import { getPage, getProjects, getSection } from "@/lib/cms/read";
import { allOpenRoles } from "@/lib/cms/types";
import { RecruitCTA } from "@/components/home/RecruitCTA";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Every ACM @ Amity project, with what exists today and what does not. Find one with an open role and start contributing.",
};

export default async function ProjectsPage() {
  const [projects, recruit, page] = await Promise.all([getProjects(), getSection("recruit"), getPage("page_projects")]);
  const active = projects.filter((p) => p.status === "development" || p.status === "current" || p.status === "ongoing");
  const needLeads = projects.filter((p) => p.team.every((t) => t.name === "Open"));

  return (
    <>
      <PageHeader
        index="01"
        eyebrow={page.eyebrow}
        title={<CmsTitle text={page.title} />}
        lede={page.body || undefined}
        meta={[
          { label: "Projects", value: String(projects.length) },
          { label: "Active", value: String(active.length) },
          { label: "Open roles", value: String(allOpenRoles(projects).length) },
          { label: "Need a lead", value: String(needLeads.length) },
        ]}
      />
      <ProjectIndex projects={projects} />
      <RecruitCTA section={recruit} />
    </>
  );
}
