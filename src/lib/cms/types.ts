import type { Domain, Role as SkillRole, StatusId } from "@/data/taxonomy";

/**
 * Shapes of everything the admin can edit. Column names match the tables in
 * supabase/cms.sql one to one, so a row from PostgREST is already the type.
 */

export type SiteSettings = {
  site_name: string;
  short_name: string;
  organization: string;
  tagline: string;
  description: string;
  logo_url: string | null;
  favicon_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  location: string | null;
  registration_url: string | null;
  registration_qr_url: string | null;
  footer_text: string;
  pillars: string[];
  copyright_text: string;
  disclaimer_text: string;
};

/**
 * The small caption beside the wordmark: the organisation name without the
 * short name it starts with ("ACM" + "@ Amity University").
 */
export function brandCaption(s: Pick<SiteSettings, "short_name" | "organization">): string {
  const org = s.organization.trim();
  return org.toLowerCase().startsWith(s.short_name.trim().toLowerCase())
    ? org.slice(s.short_name.trim().length).trim()
    : org;
}

export const FOOTER_GROUPS = [
  { id: "platform", label: "Platform" },
  { id: "community", label: "Community" },
  { id: "take-part", label: "Take part" },
] as const;
export type FooterGroup = (typeof FOOTER_GROUPS)[number]["id"];

export type NavItem = {
  id: string;
  label: string;
  href: string;
  in_header: boolean;
  footer_group: FooterGroup | null;
  enabled: boolean;
  sort: number;
};

export const SOCIAL_PLATFORMS = [
  "instagram",
  "linkedin",
  "github",
  "x",
  "youtube",
  "discord",
  "whatsapp",
  "email",
  "website",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export type SocialLink = {
  id: string;
  platform: SocialPlatform;
  url: string;
  enabled: boolean;
  sort: number;
};

/**
 * The homepage is built from these sections, in `sort` order. The set is
 * fixed by the site's components — the admin edits text, order and
 * visibility, not layout. The hero always renders first.
 */
export const SECTION_KEYS = [
  "hero",
  "announcements",
  "what_we_build",
  "problem_lab",
  "problem_of_the_week",
  "events",
  "difficulty",
  "ideas",
  "contribution",
  "recruit",
  "final_cta",
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export type Section = {
  key: SectionKey;
  enabled: boolean;
  sort: number;
  eyebrow: string;
  /** Headline. Each line break is a line of the rendered headline. */
  title: string;
  subtitle: string;
  body: string;
  /** Small-print note under a section, where the design has one. */
  note: string;
  primary_label: string;
  primary_href: string;
  secondary_label: string;
  secondary_href: string;
  image_url: string | null;
  /** Short per-section string lists only (see SECTION_EXTRA). */
  extra: Record<string, string[] | string>;
};

export type TeamRole = { id: string; name: string; sort: number };

export type TeamMember = {
  id: string;
  name: string;
  role_id: string;
  bio: string;
  photo_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  website_url: string | null;
  email: string | null;
  published: boolean;
  sort: number;
};

/** A member as the public site sees it: role resolved to its name. */
export type PublicMember = TeamMember & { role: string };

export const EVENT_STATUSES = ["upcoming", "ongoing", "completed", "cancelled"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export type EventItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string | null;
  location: string;
  registration_url: string | null;
  image_url: string | null;
  status: EventStatus;
  published: boolean;
  sort: number;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  link_url: string | null;
  date: string;
  published: boolean;
  sort: number;
};

export const MILESTONE_STATES = ["done", "active", "next", "later"] as const;

export type Milestone = {
  phase: string;
  state: (typeof MILESTONE_STATES)[number];
  detail: string;
};

export type OpenRole = { role: SkillRole; level: string; what: string };

export type ProjectMemberRow = {
  id?: string;
  project_id?: string;
  member_id: string | null;
  name: string;
  role: string;
  sort: number;
};

/** A projects row exactly as stored. */
export type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  status: StatusId;
  summary: string;
  problem: string;
  problem_slug: string | null;
  image_url: string | null;
  repo_url: string | null;
  live_url: string | null;
  progress: number;
  featured: boolean;
  published: boolean;
  sort: number;
  domains: Domain[];
  technologies: string[];
  building: string[];
  exists_now: string[];
  not_yet: string[];
  contribute: string[];
  timeline: Milestone[];
  open_roles: OpenRole[];
};

/**
 * A project as the public pages render it. This is the shape the project
 * components were written against before the CMS existed, so they did not
 * need to change.
 */
export type Project = {
  id: string;
  slug: string;
  name: string;
  category: string;
  status: StatusId;
  domains: Domain[];
  summary: string;
  problem: string;
  problemSlug?: string;
  building: string[];
  currentState: { exists: string[]; notYet: string[] };
  technologies: string[];
  team: { name: string; role: string }[];
  openRoles: OpenRole[];
  contribute: string[];
  timeline: Milestone[];
  progress: number;
  featured?: boolean;
  repo?: string;
  liveUrl?: string;
  image?: string;
};

export function toProject(row: ProjectRow, members: ProjectMemberRow[]): Project {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    status: row.status,
    domains: row.domains,
    summary: row.summary,
    problem: row.problem,
    problemSlug: row.problem_slug ?? undefined,
    building: row.building,
    currentState: { exists: row.exists_now, notYet: row.not_yet },
    technologies: row.technologies,
    team: members.map((m) => ({ name: m.name, role: m.role })),
    openRoles: row.open_roles,
    contribute: row.contribute,
    timeline: row.timeline,
    progress: row.progress,
    featured: row.featured,
    repo: row.repo_url ?? undefined,
    liveUrl: row.live_url ?? undefined,
    image: row.image_url ?? undefined,
  };
}

/** Every open role across every project — used by /teams, /projects and the admin. */
export function allOpenRoles(projects: Project[]) {
  return projects.flatMap((p) => p.openRoles.map((r) => ({ ...r, project: p.name, slug: p.slug })));
}

/** What the header and footer need to draw the wordmark or logo. */
export type Brand = { short: string; caption: string; logo: string | null; label: string };

/** A headline field split into its rendered lines. */
export function lines(text: string): string[] {
  return text.split("\n").map((l) => l.trim()).filter(Boolean);
}

/** Reads a string-list entry from a section's `extra`. */
export function extraList(section: Section, name: string): string[] {
  const v = section.extra?.[name];
  return Array.isArray(v) ? v : [];
}

/** Reads a text entry from a section's `extra`. */
export function extraText(section: Section, name: string): string {
  const v = section.extra?.[name];
  return typeof v === "string" ? v : "";
}
