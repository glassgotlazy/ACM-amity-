import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/cms/kit";
import { IdeasEditor } from "@/components/admin/cms/Content";

export const metadata: Metadata = { title: "Project ideas" };

export default function Page() {
  return (
    <AdminPage title="Project ideas" description="Unclaimed starting points on /ideas and the homepage." content="ideas">
      <IdeasEditor />
    </AdminPage>
  );
}
