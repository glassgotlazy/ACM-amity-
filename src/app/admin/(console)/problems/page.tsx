import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/cms/kit";
import { ProblemsEditor } from "@/components/admin/cms/Content";

export const metadata: Metadata = { title: "Problem statements" };

export default function Page() {
  return (
    <AdminPage title="Problem statements" description="The Problem Lab. The order here sets each problem's number." content="problems">
      <ProblemsEditor />
    </AdminPage>
  );
}
