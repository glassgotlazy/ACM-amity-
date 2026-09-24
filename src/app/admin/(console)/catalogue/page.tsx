import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/cms/kit";
import { Catalogue } from "@/components/admin/Catalogue";

export const metadata: Metadata = { title: "Catalogue" };

export default function Page() {
  return (
    <AdminPage
      title="Catalogue"
      description="Problem statements, working teams, research and the activity log. These still live in the codebase, so this view is read-only."
      gate={false}
    >
      <Catalogue />
    </AdminPage>
  );
}
