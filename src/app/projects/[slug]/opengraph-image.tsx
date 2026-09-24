import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { getProject, getProjects, ogBrand } from "@/lib/cms/read";
import { STATUSES } from "@/data/taxonomy";

export const alt = "An ACM @ Amity project";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export async function generateStaticParams() {
  return (await getProjects()).map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: { slug: string } }) {
  const project = await getProject(params.slug);

  return renderOgImage(
    {
      eyebrow: project ? `${project.category} · ${STATUSES[project.status].label}` : "Projects",
      title: project?.name ?? "Find something worth building.",
      footnote: project ? `${project.openRoles.length} open roles` : undefined,
    },
    await ogBrand(),
  );
}
