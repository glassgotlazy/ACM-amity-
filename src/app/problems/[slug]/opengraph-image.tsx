import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { problems, problemBySlug } from "@/data/problems";
import { ORIGINS } from "@/data/taxonomy";

export const alt = "An ACM @ Amity problem statement";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return problems.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: { slug: string } }) {
  const problem = problemBySlug(params.slug);

  return renderOgImage({
    eyebrow: problem
      ? `Problem ${String(problem.index).padStart(2, "0")} · ${ORIGINS[problem.origin]}`
      : "Problem Lab",
    title: problem?.title ?? "Find a problem worth solving.",
    footnote: problem?.hook,
  });
}
