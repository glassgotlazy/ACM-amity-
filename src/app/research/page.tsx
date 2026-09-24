import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/SectionHeading";
import { CmsTitle } from "@/components/ui/Lines";
import { getPage, getResearch } from "@/lib/cms/read";
import { StatusPill } from "@/components/ui/Badges";
import { Reveal } from "@/components/ui/Reveal";
import { ResearchTimeline } from "@/components/research/ResearchTimeline";

export const metadata: Metadata = {
  title: "Research",
  description:
    "We don’t just build. We ask why. Ongoing research at ACM @ Amity — what we are reading, what we are testing, and what we have not found yet.",
};

export default async function ResearchPage() {
  const [researchProjects, page] = await Promise.all([getResearch(), getPage("page_research")]);
  const [featured, ...rest] = researchProjects;

  return (
    <>
      <PageHeader
        index="03"
        eyebrow={page.eyebrow}
        title={<CmsTitle text={page.title} />}
        lede={page.body || undefined}
        meta={[
          { label: "Research projects", value: String(researchProjects.length) },
          { label: "Published papers", value: "0" },
          { label: "Under review", value: "0" },
          { label: "Entry requirement", value: "None" },
        ]}
      />

      {featured ? (
        <>
      {/* Featured research gets a full editorial spread rather than a card. */}
      <section className="border-b border-line">
        <div className="shell py-20">
          <Reveal className="flex flex-wrap items-center gap-5">
            <span className="meta text-acm-bright">Featured</span>
            <StatusPill status={featured.status} />
            <span className="label-sm text-ink-faint">{featured.field}</span>
          </Reveal>

          <Reveal delay={0.05} className="mt-8">
            <h2 className="text-display-md">
              <Link href={`/research/${featured.slug}`} className="transition-colors duration-200 hover:text-acm-bright">
                {featured.title}
              </Link>
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-14 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
            <div>
              <Reveal delay={0.08}>
                <div className="meta">Research question</div>
                <p className="mt-5 max-w-prose border-l border-acm pl-6 text-xl leading-relaxed text-ink text-pretty">
                  {featured.question}
                </p>
              </Reveal>

              <Reveal delay={0.12} className="mt-12">
                <div className="meta">Background</div>
                <div className="mt-6 max-w-prose space-y-5 text-[1.0625rem] leading-relaxed text-ink-muted text-pretty">
                  {featured.background.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </Reveal>

              <Reveal delay={0.16} className="mt-12">
                <Link
                  href={`/research/${featured.slug}`}
                  className="group inline-flex h-12 items-center gap-3 border border-line-strong px-7 label transition-colors duration-200 hover:border-acm hover:text-acm-bright"
                >
                  Open research record
                </Link>
              </Reveal>
            </div>

            <Reveal delay={0.1}>
              <div className="meta border-b border-line pb-3">Where it stands</div>
              <div className="mt-2">
                <ResearchTimeline stages={featured.stages} variant="compact" />
              </div>
              <p className="mt-7 label-sm leading-relaxed text-ink-ghost">
                An ongoing research initiative. Not a proven result, not a breakthrough, and not something to cite.
              </p>
            </Reveal>
          </div>
        </div>
      </section>
        </>
      ) : null}

      {rest.length ? (
      <section className="shell py-20">
        <div className="meta border-b border-line pb-4">Also running</div>
        <div className="mt-2">
          {rest.map((project, i) => (
            <Reveal key={project.slug} delay={i * 0.06}>
              <Link
                href={`/research/${project.slug}`}
                className="group grid gap-5 border-b border-line py-9 transition-[padding] duration-500 ease-out hover:pl-4 lg:grid-cols-[1fr_1.4fr] lg:gap-16"
              >
                <div>
                  <StatusPill status={project.status} />
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] transition-colors duration-200 group-hover:text-acm-bright">
                    {project.title}
                  </h3>
                  <p className="mt-2 label-sm text-ink-ghost">{project.field}</p>
                </div>
                <p className="max-w-prose text-[0.9375rem] leading-relaxed text-ink-muted text-pretty">
                  {project.question}
                </p>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-16 grid gap-10 border border-line p-9 lg:grid-cols-[1fr_1.6fr] lg:p-12">
          <div>
            <h2 className="text-display-sm text-balance">You do not need research experience.</h2>
          </div>
          <div className="space-y-5 text-[1.0625rem] leading-relaxed text-ink-muted text-pretty">
            <p>
              The entry requirement for the reading group is being willing to read something difficult twice and then
              explain it to people who will disagree with your reading.
            </p>
            <p>
              Everything else — the methodology, the simulation work, the writing — is learned by doing it badly first,
              which is what the group is for.
            </p>
            <Link href="/join" className="inline-flex items-center gap-2 label text-acm-bright hover:text-ink">
              Join the reading group
            </Link>
          </div>
        </Reveal>
      </section>
      ) : null}
    </>
  );
}
