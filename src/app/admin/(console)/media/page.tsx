import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/cms/kit";
import { MediaLibrary } from "@/components/admin/cms/media";

export const metadata: Metadata = { title: "Media" };

export default function Page() {
  return (
    <AdminPage title="Media" description="Every uploaded image. Images are checked for type, size and dimensions when uploaded.">
      <MediaLibrary />
    </AdminPage>
  );
}
