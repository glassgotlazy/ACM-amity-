import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/cms/kit";
import { NavigationEditor } from "@/components/admin/cms/Navigation";

export const metadata: Metadata = { title: "Navigation" };

export default function Page() {
  return (
    <AdminPage title="Navigation" description="The links in the header, the mobile menu and the footer, plus social links.">
      <NavigationEditor />
    </AdminPage>
  );
}
