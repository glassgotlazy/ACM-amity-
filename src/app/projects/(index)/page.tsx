import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/SectionHeading";
import { ProjectIndex } from "@/components/projects/ProjectIndex";
import { getProjects, getSection } from "@/lib/cms/read";
import { allOpenRoles } from "@/lib/cms/types";
import { RecruitCTA } from "@/components/home/RecruitCTA";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Every ACM @ Amity project, with what exists today and what does not. Find one with an open role and start contributing.",
};

export default async function ProjectsPage() {
  const [projects, recruit] = await Promise.all([getProjects(), getSection("recruit")]);
  const active = projects.filter((p) => p.status === "development" || p.status === "current" || p.status === "ongoing");
  const needLeads = projects.filter((p) => p.team.every((t) => t.name === "Open"));

  return (
    <>
      <PageHeader
        index="01"
        eyebrow="Projects"
        title={
          <>
            FIND SOMETHING
            <br />
            WORTH BUILDING.
          </>
        }
        lede="Each project below states its current status honestly — what is working, what is not built yet, and which roles are open. Nothing here is finished, which is the point."
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
