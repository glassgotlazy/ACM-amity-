import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/cms/kit";
import { Submissions } from "@/components/admin/Submissions";

export const metadata: Metadata = { title: "Submissions" };

export default function Page() {
  return (
    <AdminPage
      title="Submissions"
      description="Applications, problem submissions, project proposals and membership sign-ups sent through the site. Nothing here is published automatically."
      gate={false}
    >
      <Submissions />
    </AdminPage>
  );
}
