import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/cms/kit";
import { AnnouncementsEditor } from "@/components/admin/cms/Events";

export const metadata: Metadata = { title: "Announcements" };

export default function Page() {
  return (
    <AdminPage title="Announcements" description="Short notices shown in a strip under the homepage hero.">
      <AnnouncementsEditor />
    </AdminPage>
  );
}
