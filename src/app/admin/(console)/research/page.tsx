import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/cms/kit";
import { ResearchEditor } from "@/components/admin/cms/Content";

export const metadata: Metadata = { title: "Research" };

export default function Page() {
  return (
    <AdminPage title="Research" description="Research projects on /research. The first one is featured." content="research">
      <ResearchEditor />
    </AdminPage>
  );
}
