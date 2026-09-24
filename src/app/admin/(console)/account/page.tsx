import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/cms/kit";
import { MyAccount } from "@/components/admin/Admins";

export const metadata: Metadata = { title: "My account" };

export default function Page() {
  return (
    <AdminPage title="My account" description="Your admin account." gate={false}>
      <MyAccount />
    </AdminPage>
  );
}
