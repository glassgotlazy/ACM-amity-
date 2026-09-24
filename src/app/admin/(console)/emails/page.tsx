import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/cms/kit";
import { EmailTemplates } from "@/components/admin/cms/EmailTemplates";

export const metadata: Metadata = { title: "Emails" };

export default function Page() {
  return (
    <AdminPage title="Emails" description="What applicants receive when you change the status of their submission." gate={false}>
      <EmailTemplates />
    </AdminPage>
  );
}
