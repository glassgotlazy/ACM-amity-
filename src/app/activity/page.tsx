import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/SectionHeading";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { activity } from "@/data/activity";

export const metadata: Metadata = {
  title: "Activity",
  description: "What ACM @ Amity has been working on — commits, reviews, literature passes, new roles and new people.",
};

export default function ActivityPage() {
  return (
    <>
      <PageHeader
        index="05"
        eyebrow="Activity"
        title={
          <>
            WHAT ACTUALLY
            <br />
            HAPPENED THIS WEEK.
          </>
        }
        lede="A community is easiest to judge by what it did recently. This is the log — work shipped, papers read, reviews completed, people arriving."
        meta={[
          { label: "Entries shown", value: String(activity.length) },
          { label: "Source", value: "Demo data" },
          { label: "Live feed", value: "Not yet wired" },
          { label: "Window", value: "Recent" },
        ]}
      >
        <p className="max-w-xl font-mono text-micro uppercase leading-relaxed text-ink-ghost">
          Demo content · this feed is not yet connected to repository or task activity. The entries below illustrate
          the shape of a real log rather than reporting one.
        </p>
      </PageHeader>

      <ActivityFeed />
    </>
  );
}
