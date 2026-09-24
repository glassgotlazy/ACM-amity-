import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/cms/kit";
import { HomepageEditor } from "@/components/admin/cms/Homepage";

export const metadata: Metadata = { title: "Homepage" };

export default function Page() {
  return (
    <AdminPage title="Homepage" description="Show, hide, reorder and edit the sections of the homepage.">
      <HomepageEditor />
    </AdminPage>
  );
}
