import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/SectionHeading";
import { CmsTitle } from "@/components/ui/Lines";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { getActivity, getPage } from "@/lib/cms/read";

export const metadata: Metadata = {
  title: "Activity",
  description: "What ACM @ Amity has actually shipped — features built, reviews completed, papers read and roles opened.",
};

export default async function ActivityPage() {
  const [activity, page] = await Promise.all([getActivity(), getPage("page_activity")]);
  return (
    <>
      <PageHeader
        index="05"
        eyebrow={page.eyebrow}
        title={<CmsTitle text={page.title} />}
        lede={page.body || undefined}
        meta={[
          { label: "Entries shown", value: String(activity.length) },
          { label: "Source", value: "Project history" },
          { label: "Live feed", value: "Not yet wired" },
          { label: "Updated", value: "Manual" },
        ]}
      >
        {page.note ? (
          <p className="max-w-xl label-sm leading-relaxed text-ink-ghost">{page.note}</p>
        ) : null}
      </PageHeader>

      <ActivityFeed activity={activity} />
    </>
  );
}
