import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/cms/kit";
import { Backup } from "@/components/admin/Backup";

export const metadata: Metadata = { title: "Backup" };

export default function Page() {
  return (
    <AdminPage title="Backup" description="A copy of everything in the database, to keep somewhere safe." gate={false}>
      <Backup />
    </AdminPage>
  );
}
