import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/cms/kit";
import { PagesEditor } from "@/components/admin/cms/Homepage";

export const metadata: Metadata = { title: "Pages" };

export default function Page() {
  return (
    <AdminPage title="Pages" description="The header of every public page: eyebrow, headline and introduction.">
      <PagesEditor />
    </AdminPage>
  );
}
