import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/cms/kit";
import { AuditLog } from "@/components/admin/AuditLog";

export const metadata: Metadata = { title: "Audit log" };

export default function Page() {
  return (
    <AdminPage title="Audit log" description="Every admin sign-in and change, newest first. Passwords, tokens and form contents are never recorded." gate={false}>
      <AuditLog />
    </AdminPage>
  );
}
