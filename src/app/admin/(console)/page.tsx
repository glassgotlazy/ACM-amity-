import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/cms/kit";
import { Dashboard } from "@/components/admin/cms/Dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default function Page() {
  return (
    <AdminPage title="Dashboard" description="What needs attention, and a shortcut to every part of the site." gate={false}>
      <Dashboard />
    </AdminPage>
  );
}
