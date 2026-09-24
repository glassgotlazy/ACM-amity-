import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/cms/AdminShell";
import { getSettings } from "@/lib/cms/read";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

/** Every console page is per-request: it sits behind the session cookie. */
export const dynamic = "force-dynamic";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const { site_name } = await getSettings();
  return <AdminShell siteName={site_name}>{children}</AdminShell>;
}
