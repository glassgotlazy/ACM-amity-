import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/cms/kit";
import { ProjectsEditor } from "@/components/admin/cms/Projects";

export const metadata: Metadata = { title: "Projects" };

export default function Page() {
  return (
    <AdminPage title="Projects" description="Published projects on /projects. Proposals sent through the site stay in Submissions — publishing one means creating it here.">
      <ProjectsEditor />
    </AdminPage>
  );
}
