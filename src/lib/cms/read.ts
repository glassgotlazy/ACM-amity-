import { unstable_cache } from "next/cache";
import { cache } from "react";
import { isStorageConfigured, rest, StorageError } from "@/lib/supabase";
import * as D from "./defaults";
import {
  SECTION_KEYS,
  brandCaption,
  toProject,
  type Announcement,
  type EventItem,
  type NavItem,
  type Project,
  type ProjectMemberRow,
  type ProjectRow,
  type PublicMember,
  type Section,
  type SectionKey,
  type SiteSettings,
  type SocialLink,
  type TeamMember,
  type TeamRole,
} from "./types";

/**
 * Public read path for CMS content.
 *
 * Every read is server-side and cached under a tag; the admin API calls
 * revalidateTag on save, so a change is live on the next request without a
 * redeploy, and visitors never wait on the database. The hourly revalidate is
 * only a backstop for edits made directly in Supabase.
 *
 * Until the CMS is initialised (no site_settings row yet) the site renders the
 * built-in defaults. Once it is, the database is the only source — an empty
 * table means "nothing to show", never "fall back".
 */

export const CMS_TAGS = {
  settings: "cms:settings",
  nav: "cms:nav",
  social: "cms:social",
  sections: "cms:sections",
  team: "cms:team",
  events: "cms:events",
  projects: "cms:projects",
  announcements: "cms:announcements",
} as const;
export type CmsTag = (typeof CMS_TAGS)[keyof typeof CMS_TAGS];
export const ALL_CMS_TAGS = Object.values(CMS_TAGS);

const REVALIDATE = 3600;

/**
 * `null` means the content is not there to read: storage is not configured,
 * or the table has not been created yet (PostgREST answers 404). Any other
 * failure throws, so an outage keeps the last good page in the cache instead
 * of quietly swapping in defaults.
 */
async function select<T>(path: string): Promise<T[] | null> {
  if (!isStorageConfigured()) return null;
  try {
    return await rest<T[]>(path);
  } catch (error) {
    if (error instanceof StorageError && error.status === 404) return null;
    throw error;
  }
}

function cached<T>(key: string, tag: CmsTag, fn: () => Promise<T>) {
  return unstable_cache(fn, [key], { tags: [tag], revalidate: REVALIDATE });
}

const SETTINGS_COLUMNS = Object.keys(D.defaultSettings).join(",");

const settingsRow = cached("cms-settings", CMS_TAGS.settings, async () => {
  const rows = await select<SiteSettings>(`site_settings?id=eq.1&select=${SETTINGS_COLUMNS}`);
  return rows?.[0] ?? null;
});

export const isInitialised = cache(async () => (await settingsRow()) !== null);

export const getSettings = cache(async (): Promise<SiteSettings> => (await settingsRow()) ?? D.defaultSettings);

const navRows = cached("cms-nav", CMS_TAGS.nav, () =>
  select<NavItem>("nav_items?select=id,label,href,in_header,footer_group,enabled,sort&enabled=eq.true&order=sort.asc"),
);

export const getNav = cache(async (): Promise<NavItem[]> => {
  if (!(await isInitialised())) return D.defaultNav;
  return (await navRows()) ?? [];
});

const socialRows = cached("cms-social", CMS_TAGS.social, () =>
  select<SocialLink>("social_links?select=id,platform,url,enabled,sort&enabled=eq.true&order=sort.asc"),
);

export const getSocial = cache(async (): Promise<SocialLink[]> => {
  if (!(await isInitialised())) return D.defaultSocial;
  return (await socialRows()) ?? [];
});

const sectionRows = cached("cms-sections", CMS_TAGS.sections, () => select<Section>("page_sections?select=*"));

/**
 * Every known section in display order. A key with no row yet (a section
 * added to the code after the CMS was initialised) uses its default, so new
 * sections appear without a data migration.
 */
export const getSections = cache(async (): Promise<Section[]> => {
  const rows = (await isInitialised()) ? ((await sectionRows()) ?? []) : [];
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return D.defaultSections
    .filter((d) => (SECTION_KEYS as readonly string[]).includes(d.key))
    .map((d) => ({ ...d, ...(byKey.get(d.key) ?? {}) }))
    // The hero carries the page's h1 and sits under the fixed header.
    .map((s) => (s.key === "hero" ? { ...s, enabled: true } : s))
    .sort((a, b) => (a.key === "hero" ? -1 : b.key === "hero" ? 1 : a.sort - b.sort));
});

export async function getSection(key: SectionKey): Promise<Section> {
  return (await getSections()).find((s) => s.key === key)!;
}

const teamRows = cached("cms-team", CMS_TAGS.team, async () => {
  const [roles, members] = await Promise.all([
    select<TeamRole>("roles?select=id,name,sort&order=sort.asc"),
    select<TeamMember>("team_members?select=*&published=eq.true&order=sort.asc"),
  ]);
  return { roles: roles ?? [], members: members ?? [] };
});

export const getTeam = cache(async (): Promise<PublicMember[]> => {
  const { roles, members } = (await isInitialised())
    ? await teamRows()
    : { roles: D.defaultRoles, members: D.defaultMembers };
  const roleName = new Map(roles.map((r) => [r.id, r.name]));
  return members.filter((m) => m.published).map((m) => ({ ...m, role: roleName.get(m.role_id) ?? "" }));
});

const eventRows = cached("cms-events", CMS_TAGS.events, () =>
  select<EventItem>("events?select=*&published=eq.true&order=starts_at.asc,sort.asc&limit=200"),
);

export const getEvents = cache(async (): Promise<EventItem[]> => {
  if (!(await isInitialised())) return D.defaultEvents;
  return (await eventRows()) ?? [];
});

/** Upcoming or running events whose end (or start) has not passed. */
export function upcoming(events: EventItem[], now = Date.now()) {
  return events.filter(
    (e) =>
      (e.status === "upcoming" || e.status === "ongoing") &&
      new Date(e.ends_at ?? e.starts_at).getTime() >= now - 12 * 3600_000,
  );
}

const projectRows = cached("cms-projects", CMS_TAGS.projects, async () => {
  const [rows, members] = await Promise.all([
    select<ProjectRow>("projects?select=*&published=eq.true&order=sort.asc&limit=200"),
    select<ProjectMemberRow>("project_members?select=project_id,member_id,name,role,sort&order=sort.asc&limit=2000"),
  ]);
  return { rows: rows ?? [], members: members ?? [] };
});

export const getProjects = cache(async (): Promise<Project[]> => {
  if (!(await isInitialised())) return D.defaultProjectRows.map(({ row, members }) => toProject(row, members));
  const { rows, members } = await projectRows();
  return rows.map((row) => toProject(row, members.filter((m) => m.project_id === row.id)));
});

export async function getProject(slug: string): Promise<Project | undefined> {
  return (await getProjects()).find((p) => p.slug === slug);
}

const announcementRows = cached("cms-announcements", CMS_TAGS.announcements, () =>
  select<Announcement>("announcements?select=*&published=eq.true&order=sort.asc,date.desc&limit=5"),
);

export const getAnnouncements = cache(async (): Promise<Announcement[]> => {
  if (!(await isInitialised())) return D.defaultAnnouncements;
  return (await announcementRows()) ?? [];
});

/** Wordmark for generated share images. */
export async function ogBrand() {
  const s = await getSettings();
  return { short: s.short_name, caption: brandCaption(s) };
}
