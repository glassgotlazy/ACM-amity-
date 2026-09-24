import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/cms/kit";
import { Admins } from "@/components/admin/Admins";

export const metadata: Metadata = { title: "Admins" };

export default function Page() {
  return (
    <AdminPage title="Admins" description="Personal admin accounts and what each person may do." gate={false}>
      <Admins />
    </AdminPage>
  );
}
