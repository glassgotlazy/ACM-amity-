import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/SectionHeading";
import { JoinFlow } from "@/components/forms/JoinFlow";

export const metadata: Metadata = {
  title: "Join ACM",
  description: "Seven short questions. No prior experience required — bring a problem you care about and a willingness to build.",
};

export default function JoinPage() {
  return (
    <>
      <PageHeader
        eyebrow="Join ACM @ Amity"
        title={
          <>
            YOU DON&rsquo;T NEED
            <br />
            TO KNOW EVERYTHING.
          </>
        }
        lede="Seven short questions. There is no test, no minimum skill level and no wrong answer — the only thing that matters is that there is something you want to work on."
      />
      <JoinFlow />
    </>
  );
}
