import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/SectionHeading";
import { AdminConsole } from "@/components/admin/AdminConsole";

export const metadata: Metadata = {
  title: "Admin",
  description: "Back-office view over projects, problems, applications, teams, research and activity.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="BUILDHUB CONSOLE"
        lede="The queue: every application, problem submission and project proposal, plus the catalogue of projects, problems, teams and research."
      >
        <p className="max-w-2xl border border-line px-6 py-4 font-mono text-micro uppercase leading-relaxed text-ink-ghost">
          <span className="text-acm-bright">Core team only ·</span> applications, submissions and proposals here are
          real stored records. Nothing is published automatically. Team sizes are the one remaining demo figure.
        </p>
      </PageHeader>

      <AdminConsole />
    </>
  );
}
