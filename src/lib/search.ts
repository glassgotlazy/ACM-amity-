import type { Idea, Problem, ResearchProject, Team } from "@/lib/cms/content-types";

export type SearchKind = "problem" | "project" | "idea" | "team" | "research" | "page";

export type SearchEntry = {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string;
  href: string;
  /** Lower-cased haystack, weighted by field: title counts more than body. */
  title_: string;
  tags_: string;
  body_: string;
};

export const KIND_LABEL: Record<SearchKind, string> = {
  problem: "Problem",
  project: "Project",
  idea: "Idea",
  team: "Team",
  research: "Research",
  page: "Page",
};

const lower = (s: string) => s.toLowerCase();
const join = (xs: readonly string[]) => lower(xs.join(" "));

/** The fields of a project that search needs; sent to the browser with the page. */
export type SearchProject = {
  slug: string;
  name: string;
  summary: string;
  category: string;
  domains: string[];
  technologies: string[];
  roles: string[];
};

const problemEntry = (p: Problem): SearchEntry => ({
  id: `problem:${p.slug}`,
  kind: "problem",
  title: p.title,
  subtitle: p.hook,
  href: `/problems/${p.slug}`,
  title_: lower(p.title),
  tags_: join([p.category, ...p.domains, ...p.technologies, p.potentialProject?.name ?? "", ...p.openRoles]),
  body_: lower(`${p.question} ${p.hook}`),
});

const projectEntry = (p: SearchProject): SearchEntry => ({
  id: `project:${p.slug}`,
  kind: "project",
  title: p.name,
  subtitle: p.summary,
  href: `/projects/${p.slug}`,
  title_: lower(p.name),
  tags_: join([p.category, ...p.domains, ...p.technologies, ...p.roles]),
  body_: lower(p.summary),
});

const ideaEntry = (i: Idea): SearchEntry => ({
  id: `idea:${i.slug}`,
  kind: "idea",
  title: i.name,
  subtitle: i.tagline,
  href: `/ideas#${i.slug}`,
  title_: lower(i.name),
  tags_: join([i.band, ...i.domains, ...i.technologies, ...i.skills]),
  body_: lower(i.tagline),
});

const teamEntry = (t: Team): SearchEntry => ({
  id: `team:${t.slug}`,
  kind: "team",
  title: t.name,
  subtitle: t.focus,
  href: `/teams#${t.slug}`,
  title_: lower(t.name),
  tags_: join([...t.domains, ...t.works]),
  body_: lower(t.focus),
});

const researchEntry = (r: ResearchProject): SearchEntry => ({
  id: `research:${r.slug}`,
  kind: "research",
  title: r.title,
  subtitle: r.field,
  href: `/research/${r.slug}`,
  title_: lower(r.title),
  tags_: lower(r.field),
  body_: lower(r.question),
});

const pageEntries: SearchEntry[] = [
  ["Join ACM", "Seven short questions. No experience required.", "/join", "apply membership register signup"],
  ["Find your project", "Two questions, then a shortlist.", "/discover", "match recommend quiz"],
  ["Submit a problem", "Noticed something that should work better?", "/problems/submit", "report suggest"],
  ["Problem Lab", "Every problem statement.", "/problems", "browse all"],
  ["Events", "Sessions, workshops and build nights.", "/events", "workshop session meetup calendar"],
  ["Activity", "What actually shipped recently.", "/activity", "log updates news"],
  ["Contribution profile", "The record, not the membership.", "/profile", "portfolio"],
].map(([title, subtitle, href, extra]) => ({
  id: `page:${href}`,
  kind: "page" as const,
  title,
  subtitle,
  href,
  title_: lower(title),
  tags_: lower(extra),
  body_: lower(subtitle),
}));

/**
 * Built on the server from the same CMS data the pages render, so search
 * can never show something the site does not. Tiny corpus (a few dozen
 * entries), so the browser scores it in memory — no index library, no
 * network.
 */
export function buildIndex(data: {
  problems: Problem[];
  projects: SearchProject[];
  ideas: Idea[];
  teams: Team[];
  research: ResearchProject[];
}): SearchEntry[] {
  return [
    ...data.problems.map(problemEntry),
    ...data.projects.map(projectEntry),
    ...data.ideas.map(ideaEntry),
    ...data.teams.map(teamEntry),
    ...data.research.map(researchEntry),
    ...pageEntries,
  ];
}

const KIND_ORDER: SearchKind[] = ["problem", "project", "idea", "research", "team", "page"];

/**
 * Every query token must hit somewhere (AND), so "quantum research" does not
 * surface every research entry. Title hits weigh most, a title prefix most of
 * all; tags next; body last. Ties break by kind order, then alphabetically.
 */
export function search(index: SearchEntry[], query: string, limit = 12): SearchEntry[] {
  const tokens = lower(query).split(/\s+/).filter((t) => t.length > 0);
  if (tokens.length === 0) return [];

  const scored: { entry: SearchEntry; score: number }[] = [];
  for (const entry of index) {
    let score = 0;
    let allHit = true;
    for (const tok of tokens) {
      let hit = 0;
      if (entry.title_.startsWith(tok)) hit = 12;
      else if (entry.title_.includes(tok)) hit = 8;
      if (entry.tags_.includes(tok)) hit = Math.max(hit, 5);
      if (entry.body_.includes(tok)) hit = Math.max(hit, 2);
      if (hit === 0) {
        allHit = false;
        break;
      }
      score += hit;
    }
    if (allHit) scored.push({ entry, score });
  }

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      KIND_ORDER.indexOf(a.entry.kind) - KIND_ORDER.indexOf(b.entry.kind) ||
      a.entry.title.localeCompare(b.entry.title),
  );
  return scored.slice(0, limit).map((s) => s.entry);
}

/** Shown before anyone types: the fastest routes into the site. */
export function suggestions(index: SearchEntry[]): SearchEntry[] {
  const page = (href: string) => index.find((e) => e.id === `page:${href}`)!;
  return [page("/problems"), page("/discover"), page("/join"), ...index.filter((e) => e.kind === "problem").slice(0, 3)].filter(Boolean);
}
