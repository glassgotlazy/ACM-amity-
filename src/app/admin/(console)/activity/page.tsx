import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/cms/kit";
import { ActivityEditor } from "@/components/admin/cms/Content";

export const metadata: Metadata = { title: "Activity log" };

export default function Page() {
  return (
    <AdminPage title="Activity log" description="Milestones shown on the public /activity page." content="activity">
      <ActivityEditor />
    </AdminPage>
  );
}
