import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { projects, projectBySlug } from "@/data/projects";
import { STATUSES } from "@/data/taxonomy";

export const alt = "An ACM @ Amity project";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: { slug: string } }) {
  const project = projectBySlug(params.slug);

  return renderOgImage({
    eyebrow: project ? `${project.category} · ${STATUSES[project.status].label}` : "Projects",
    title: project?.name ?? "Find something worth building.",
    footnote: project ? `${project.openRoles.length} open roles` : undefined,
  });
}
