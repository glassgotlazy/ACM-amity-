import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/cms/kit";
import { WorkingTeamsEditor } from "@/components/admin/cms/Content";

export const metadata: Metadata = { title: "Working teams" };

export default function Page() {
  return (
    <AdminPage title="Working teams" description="The teams listed on /teams, below the core team." content="workteams">
      <WorkingTeamsEditor />
    </AdminPage>
  );
}
