import { problems } from "@/data/problems";
import { projects } from "@/data/projects";
import { ideas } from "@/data/ideas";
import { teams } from "@/data/teams";
import { researchProjects } from "@/data/research";

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

/**
 * Built once from the same data the pages render, so search can never show
 * something the site does not. Tiny corpus (a few dozen entries), so this is
 * a plain in-memory scorer — no index library, no network.
 */
export const SEARCH_INDEX: SearchEntry[] = [
  ...problems.map((p) => ({
    id: `problem:${p.slug}`,
    kind: "problem" as const,
    title: p.title,
    subtitle: p.hook,
    href: `/problems/${p.slug}`,
    title_: lower(p.title),
    tags_: join([p.category, ...p.domains, ...p.technologies, p.potentialProject.name, ...p.openRoles]),
    body_: lower(`${p.question} ${p.hook}`),
  })),
  ...projects.map((p) => ({
    id: `project:${p.slug}`,
    kind: "project" as const,
    title: p.name,
    subtitle: p.summary,
    href: `/projects/${p.slug}`,
    title_: lower(p.name),
    tags_: join([p.category, ...p.domains, ...p.technologies, ...p.openRoles.map((r) => r.role)]),
    body_: lower(p.summary),
  })),
  ...ideas.map((i) => ({
    id: `idea:${i.slug}`,
    kind: "idea" as const,
    title: i.name,
    subtitle: i.tagline,
    href: `/ideas#${i.slug}`,
    title_: lower(i.name),
    tags_: join([i.band, ...i.domains, ...i.technologies, ...i.skills]),
    body_: lower(i.tagline),
  })),
  ...teams.map((t) => ({
    id: `team:${t.slug}`,
    kind: "team" as const,
    title: t.name,
    subtitle: t.focus,
    href: `/teams#${t.slug}`,
    title_: lower(t.name),
    tags_: join([...t.domains, ...t.works]),
    body_: lower(t.focus),
  })),
  ...researchProjects.map((r) => ({
    id: `research:${r.slug}`,
    kind: "research" as const,
    title: r.title,
    subtitle: r.field,
    href: `/research/${r.slug}`,
    title_: lower(r.title),
    tags_: lower(r.field),
    body_: lower(r.question),
  })),
  ...[
    ["Join ACM", "Seven short questions. No experience required.", "/join", "apply membership register signup"],
    ["Find your project", "Two questions, then a shortlist.", "/discover", "match recommend quiz"],
    ["Submit a problem", "Noticed something that should work better?", "/problems/submit", "report suggest"],
    ["Problem Lab", "Every problem statement.", "/problems", "browse all"],
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
  })),
];

const KIND_ORDER: SearchKind[] = ["problem", "project", "idea", "research", "team", "page"];

/**
 * Every query token must hit somewhere (AND), so "quantum research" does not
 * surface every research entry. Title hits weigh most, a title prefix most of
 * all; tags next; body last. Ties break by kind order, then alphabetically.
 */
export function search(query: string, limit = 12): SearchEntry[] {
  const tokens = lower(query).split(/\s+/).filter((t) => t.length > 0);
  if (tokens.length === 0) return [];

  const scored: { entry: SearchEntry; score: number }[] = [];
  for (const entry of SEARCH_INDEX) {
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
export const SEARCH_SUGGESTIONS: SearchEntry[] = [
  SEARCH_INDEX.find((e) => e.id === "page:/problems")!,
  SEARCH_INDEX.find((e) => e.id === "page:/discover")!,
  SEARCH_INDEX.find((e) => e.id === "page:/join")!,
  ...SEARCH_INDEX.filter((e) => e.kind === "problem").slice(0, 3),
];
