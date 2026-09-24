import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/SectionHeading";
import { CmsTitle } from "@/components/ui/Lines";
import { JoinFlow } from "@/components/forms/JoinFlow";
import { getPage, getSettings } from "@/lib/cms/read";

export const metadata: Metadata = {
  title: "Join ACM",
  description: "Seven short questions. No prior experience required — bring a problem you care about and a willingness to build.",
};

export default async function JoinPage() {
  const [{ registration_url }, page] = await Promise.all([getSettings(), getPage("page_join")]);
  return (
    <>
      <PageHeader
        eyebrow={page.eyebrow}
        title={<CmsTitle text={page.title} />}
        lede={page.body || undefined}
      />
      <JoinFlow registrationUrl={registration_url} />
    </>
  );
}
