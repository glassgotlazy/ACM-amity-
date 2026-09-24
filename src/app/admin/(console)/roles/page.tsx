import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/cms/kit";
import { RolesEditor } from "@/components/admin/cms/Team";

export const metadata: Metadata = { title: "Roles" };

export default function Page() {
  return (
    <AdminPage title="Roles" description="The titles team members hold. A role in use cannot be deleted until its members are moved to another role.">
      <RolesEditor />
    </AdminPage>
  );
}
