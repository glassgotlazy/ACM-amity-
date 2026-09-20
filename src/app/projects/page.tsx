import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/SectionHeading";
import { ProjectIndex } from "@/components/projects/ProjectIndex";
import { projects, allOpenRoles } from "@/data/projects";
import { RecruitCTA } from "@/components/home/RecruitCTA";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Every ACM @ Amity project, with what exists today and what does not. Find one with an open role and start contributing.",
};

export default function ProjectsPage() {
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
          { label: "Open roles", value: String(allOpenRoles().length) },
          { label: "Need a lead", value: String(needLeads.length) },
        ]}
      />
      <ProjectIndex />
      <RecruitCTA />
    </>
  );
}
