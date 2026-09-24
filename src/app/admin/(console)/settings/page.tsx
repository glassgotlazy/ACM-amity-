import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/cms/kit";
import { SettingsEditor } from "@/components/admin/cms/Settings";

export const metadata: Metadata = { title: "Site Settings" };

export default function Page() {
  return (
    <AdminPage title="Site Settings" description="Name, logo, favicon, contact details and footer text. Changes appear on every page as soon as you save.">
      <SettingsEditor />
    </AdminPage>
  );
}
