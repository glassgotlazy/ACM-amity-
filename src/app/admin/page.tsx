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
        lede="A working view over everything the platform manages — applications, problem submissions, projects, teams, research and activity."
      >
        <p className="max-w-2xl border border-line px-6 py-4 font-mono text-micro uppercase leading-relaxed text-ink-ghost">
          <span className="text-acm">Demo console ·</span> every figure and row below is placeholder content. There is
          no authentication and no backend — this view exists to show the shape of the eventual back office, and no
          real application or submission is stored anywhere.
        </p>
      </PageHeader>

      <AdminConsole />
    </>
  );
}
