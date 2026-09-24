import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/cms/kit";
import { EventsEditor } from "@/components/admin/cms/Events";

export const metadata: Metadata = { title: "Events" };

export default function Page() {
  return (
    <AdminPage title="Events" description="Workshops, sessions and build nights. Published upcoming events appear on the homepage and /events.">
      <EventsEditor />
    </AdminPage>
  );
}
