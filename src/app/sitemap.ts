import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getEvents, getProblems, getProjects, getResearch } from "@/lib/cms/read";

/**
 * Every public route. Derived from the same data the pages render, so a new
 * problem or project appears here automatically rather than needing a second
 * edit that someone will forget.
 *
 * /admin is deliberately absent — it is excluded in robots.ts too.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [projects, events, problems, researchProjects] = await Promise.all([getProjects(), getEvents(), getProblems(), getResearch()]);

  const staticRoutes: { path: string; priority: number; frequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "", priority: 1, frequency: "weekly" },
    { path: "/problems", priority: 0.9, frequency: "weekly" },
    { path: "/projects", priority: 0.9, frequency: "weekly" },
    { path: "/join", priority: 0.8, frequency: "monthly" },
    { path: "/discover", priority: 0.8, frequency: "monthly" },
    { path: "/ideas", priority: 0.7, frequency: "monthly" },
    { path: "/research", priority: 0.7, frequency: "monthly" },
    { path: "/teams", priority: 0.7, frequency: "monthly" },
    { path: "/problems/submit", priority: 0.6, frequency: "monthly" },
    { path: "/activity", priority: 0.5, frequency: "weekly" },
    ...(events.length ? [{ path: "/events", priority: 0.6, frequency: "weekly" as const }] : []),
    { path: "/profile", priority: 0.4, frequency: "monthly" },
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${SITE_URL}${route.path}`,
      lastModified: now,
      changeFrequency: route.frequency,
      priority: route.priority,
    })),
    ...problems.map((problem) => ({
      url: `${SITE_URL}/problems/${problem.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...projects.map((project) => ({
      url: `${SITE_URL}/projects/${project.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...researchProjects.map((research) => ({
      url: `${SITE_URL}/research/${research.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
