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
          { label: "Source", value: "Project history" },
          { label: "Live feed", value: "Not yet wired" },
          { label: "Updated", value: "By hand" },
        ]}
      >
        <p className="max-w-xl font-mono text-micro uppercase leading-relaxed text-ink-ghost">
          These are real project milestones, taken from the two ACM repositories. The feed is not yet wired to
          repository events, so it is updated by hand. Entries describe work on projects rather than output by
          individuals.
        </p>
      </PageHeader>

      <ActivityFeed />
    </>
  );
}
