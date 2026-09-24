import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/cms/kit";
import { TeamEditor } from "@/components/admin/cms/Team";

export const metadata: Metadata = { title: "Team" };

export default function Page() {
  return (
    <AdminPage title="Team" description="The office bearers shown on the Teams page and in the footer.">
      <TeamEditor />
    </AdminPage>
  );
}
