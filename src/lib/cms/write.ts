import { revalidateTag } from "next/cache";
import { problems } from "@/data/problems";
import { researchProjects } from "@/data/research";
import { rest, StorageError } from "@/lib/supabase";
import * as D from "./defaults";
import { ALL_CMS_TAGS, CMS_TAGS, type CmsTag } from "./read";
import type { KnownSlugs } from "./routes";
import { SECTION_KEYS } from "./types";
import * as V from "./validate";

/**
 * Admin write path. Every function here is called from an /api/admin route
 * that has already checked the session. Writes go to Supabase, then the
 * affected cache tags are revalidated so the public site shows the change on
 * the next request.
 */

type Row = Record<string, unknown> & { id?: string };

type Validator = (input: Record<string, unknown>, ctx: V.Ctx) => V.Result<Row> | { ok: true; row: Row; members: Row[] };

type Resource = { table: string; tag: CmsTag; validate: Validator; order: string; unique?: string };

export const RESOURCES: Record<string, Resource> = {
  nav: { table: "nav_items", tag: CMS_TAGS.nav, validate: V.validateNav, order: "sort.asc" },
  social: { table: "social_links", tag: CMS_TAGS.social, validate: V.validateSocial, order: "sort.asc" },
  roles: { table: "roles", tag: CMS_TAGS.team, validate: V.validateRole, order: "sort.asc", unique: "name" },
  team: { table: "team_members", tag: CMS_TAGS.team, validate: V.validateMember, order: "sort.asc" },
  events: { table: "events", tag: CMS_TAGS.events, validate: V.validateEvent, order: "starts_at.desc", unique: "slug" },
  projects: { table: "projects", tag: CMS_TAGS.projects, validate: V.validateProject, order: "sort.asc", unique: "slug" },
  announcements: {
    table: "announcements",
    tag: CMS_TAGS.announcements,
    validate: V.validateAnnouncement,
    order: "sort.asc,date.desc",
  },
};

export class CmsError extends Error {
  constructor(
    public status: number,
    public code: string,
    public errors?: Record<string, string>,
    public extra?: Record<string, unknown>,
  ) {
    super(code);
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function checkId(id: string) {
  if (!UUID.test(id)) throw new CmsError(404, "not_found");
}

const q = (params: Record<string, string>) => new URLSearchParams(params).toString();

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

/** "missing": cms.sql has not been run. "empty": tables exist, content not loaded. */
export async function cmsStatus(): Promise<"missing" | "empty" | "ready"> {
  try {
    const rows = await rest<unknown[]>("site_settings?select=id&id=eq.1");
    return rows.length ? "ready" : "empty";
  } catch (error) {
    if (error instanceof StorageError && error.status === 404) return "missing";
    throw error;
  }
}

async function requireReady() {
  const status = await cmsStatus();
  if (status === "missing") throw new CmsError(409, "tables_missing");
  if (status === "empty") throw new CmsError(409, "not_initialised");
}

/** What a link or reference may point at, read fresh for every write. */
async function context(): Promise<V.Ctx> {
  const [projects, roles, members] = await Promise.all([
    rest<{ slug: string }[]>(`projects?${q({ select: "slug", published: "eq.true" })}`),
    rest<{ id: string }[]>("roles?select=id"),
    rest<{ id: string }[]>("team_members?select=id"),
  ]);
  const slugs: KnownSlugs = {
    projects: projects.map((p) => p.slug),
    problems: problems.map((p) => p.slug),
    research: researchProjects.map((r) => r.slug),
  };
  return { slugs, roleIds: roles.map((r) => r.id), memberIds: members.map((m) => m.id) };
}

export async function knownSlugs(): Promise<KnownSlugs> {
  return (await context()).slugs;
}

function refresh(...tags: CmsTag[]) {
  for (const tag of new Set(tags)) revalidateTag(tag);
}

async function guarded<T>(resource: Resource | null, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof StorageError && error.status === 409 && resource?.unique) {
      throw new CmsError(409, "conflict", { [resource.unique]: `Another item already uses this ${resource.unique}.` });
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Generic list resources
// ---------------------------------------------------------------------------

export function resource(name: string): Resource {
  const r = RESOURCES[name];
  if (!r) throw new CmsError(404, "unknown_resource");
  return r;
}

export async function listRows(name: string) {
  const r = resource(name);
  const rows = await rest<Row[]>(`${r.table}?${q({ select: "*", order: r.order, limit: "500" })}`);
  if (name === "projects") {
    const members = await rest<Row[]>("project_members?select=*&order=sort.asc&limit=2000");
    return rows.map((row) => ({ ...row, members: members.filter((m) => m.project_id === row.id) }));
  }
  return rows;
}

function validate(r: Resource, input: unknown, ctx: V.Ctx) {
  if (!input || typeof input !== "object") throw new CmsError(400, "invalid_body");
  const result = r.validate(input as Record<string, unknown>, ctx);
  if (!result.ok) throw new CmsError(422, "invalid", result.errors);
  return result as { ok: true; row: Row; members?: Row[] };
}

async function replaceMembers(projectId: string, members: Row[]) {
  await rest(`project_members?${q({ project_id: `eq.${projectId}` })}`, { method: "DELETE" });
  if (members.length) {
    await rest("project_members", {
      method: "POST",
      body: JSON.stringify(members.map((m) => ({ ...m, project_id: projectId }))),
    });
  }
}

export async function createRow(name: string, input: unknown) {
  const r = resource(name);
  await requireReady();
  const { row, members } = validate(r, input, await context());
  return guarded(r, async () => {
    const last = await rest<{ sort: number }[]>(`${r.table}?${q({ select: "sort", order: "sort.desc", limit: "1" })}`);
    const [created] = await rest<Row[]>(r.table, {
      method: "POST",
      body: JSON.stringify({ ...row, sort: (last[0]?.sort ?? -1) + 1 }),
      prefer: "return=representation",
    });
    if (members) await replaceMembers(created.id!, members);
    refresh(r.tag);
    return created;
  });
}

export async function updateRow(name: string, id: string, input: unknown) {
  const r = resource(name);
  checkId(id);
  await requireReady();
  const { row, members } = validate(r, input, await context());
  return guarded(r, async () => {
    const [updated] = await rest<Row[]>(`${r.table}?${q({ id: `eq.${id}` })}`, {
      method: "PATCH",
      body: JSON.stringify({ ...row, updated_at: new Date().toISOString() }),
      prefer: "return=representation",
    });
    if (!updated) throw new CmsError(404, "not_found");
    if (members) await replaceMembers(id, members);
    refresh(r.tag);
    return updated;
  });
}

export async function deleteRow(name: string, id: string, opts: { reassignTo?: string | null } = {}) {
  const r = resource(name);
  checkId(id);
  await requireReady();

  // A role still held by members cannot just vanish: the admin has to say
  // which role those members move to, and that move happens first.
  if (name === "roles") {
    const holders = await rest<{ id: string; name: string }[]>(
      `team_members?${q({ select: "id,name", role_id: `eq.${id}` })}`,
    );
    if (holders.length) {
      const target = opts.reassignTo;
      if (!target) throw new CmsError(409, "role_in_use", undefined, { members: holders.map((h) => h.name) });
      checkId(target);
      if (target === id) throw new CmsError(400, "reassign_to_self");
      const exists = await rest<unknown[]>(`roles?${q({ select: "id", id: `eq.${target}` })}`);
      if (!exists.length) throw new CmsError(400, "reassign_target_missing");
      await rest(`team_members?${q({ role_id: `eq.${id}` })}`, {
        method: "PATCH",
        body: JSON.stringify({ role_id: target, updated_at: new Date().toISOString() }),
      });
    }
  }

  const removed = await rest<Row[]>(`${r.table}?${q({ id: `eq.${id}` })}`, {
    method: "DELETE",
    prefer: "return=representation",
  });
  if (!removed.length) throw new CmsError(404, "not_found");
  // Deleting a team member unlinks them from projects (ON DELETE SET NULL).
  refresh(r.tag, ...(name === "team" ? [CMS_TAGS.projects] : []));
}

export async function reorderRows(name: string, ids: unknown) {
  const r = resource(name);
  if (!Array.isArray(ids) || ids.length > 500 || ids.some((i) => typeof i !== "string")) {
    throw new CmsError(400, "invalid_body");
  }
  (ids as string[]).forEach(checkId);
  await requireReady();
  await Promise.all(
    (ids as string[]).map((id, sort) =>
      rest(`${r.table}?${q({ id: `eq.${id}` })}`, { method: "PATCH", body: JSON.stringify({ sort }) }),
    ),
  );
  refresh(r.tag);
}

// ---------------------------------------------------------------------------
// Singletons: site settings and homepage sections
// ---------------------------------------------------------------------------

export async function readSettings() {
  const rows = await rest<Row[]>("site_settings?select=*&id=eq.1");
  return rows[0] ?? null;
}

export async function saveSettings(input: unknown) {
  await requireReady();
  if (!input || typeof input !== "object") throw new CmsError(400, "invalid_body");
  const result = V.validateSettings(input as Record<string, unknown>, await context());
  if (!result.ok) throw new CmsError(422, "invalid", result.errors);
  const [row] = await rest<Row[]>("site_settings?id=eq.1", {
    method: "PATCH",
    body: JSON.stringify({ ...result.row, updated_at: new Date().toISOString() }),
    prefer: "return=representation",
  });
  // The name, logo and footer text appear on every page.
  refresh(CMS_TAGS.settings);
  return row;
}

export async function readSections() {
  const rows = await rest<Row[]>("page_sections?select=*");
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return D.defaultSections
    .map((d) => ({ ...d, ...(byKey.get(d.key) ?? {}) }))
    .sort((a, b) => (a.key === "hero" ? -1 : b.key === "hero" ? 1 : Number(a.sort) - Number(b.sort)));
}

export async function saveSection(key: string, input: unknown) {
  await requireReady();
  if (!input || typeof input !== "object") throw new CmsError(400, "invalid_body");
  const result = V.validateSection(key, input as Record<string, unknown>, await context());
  if (!result.ok) throw new CmsError(422, "invalid", result.errors);
  const current = (await readSections()).find((s) => s.key === key);
  const [row] = await rest<Row[]>("page_sections?on_conflict=key", {
    method: "POST",
    body: JSON.stringify({ ...result.row, sort: current?.sort ?? 99, updated_at: new Date().toISOString() }),
    prefer: "return=representation,resolution=merge-duplicates",
  });
  refresh(CMS_TAGS.sections);
  return row;
}

export async function reorderSections(keys: unknown) {
  if (!Array.isArray(keys) || keys.some((k) => !(SECTION_KEYS as readonly string[]).includes(k as string))) {
    throw new CmsError(400, "invalid_body");
  }
  await requireReady();
  // The hero is pinned first: it sits under the fixed header and carries the h1.
  const order = ["hero", ...(keys as string[]).filter((k) => k !== "hero")];
  const current = await readSections();
  await rest("page_sections?on_conflict=key", {
    method: "POST",
    body: JSON.stringify(
      current.map((s) => {
        const sort = order.indexOf(s.key);
        const { updated_at: _u, ...rest } = s as typeof s & { updated_at?: string };
        return { ...rest, sort: sort === -1 ? order.length + Number(s.sort) : sort };
      }),
    ),
    prefer: "resolution=merge-duplicates",
  });
  refresh(CMS_TAGS.sections);
}

// ---------------------------------------------------------------------------
// One-time import of what the site shows today
// ---------------------------------------------------------------------------

/**
 * Copies the built-in content into the empty tables. Refuses once the CMS is
 * initialised. Writes are blocked until then, so anything already in the
 * content tables can only be the remains of an interrupted import; those are
 * cleared first so a retry never duplicates rows. The settings row goes in
 * last because its presence is what switches the public site over.
 */
export async function initialiseCms() {
  const status = await cmsStatus();
  if (status === "missing") throw new CmsError(409, "tables_missing");
  if (status === "ready") throw new CmsError(409, "already_initialised");

  for (const table of ["project_members", "projects", "team_members", "roles", "nav_items", "social_links", "events", "announcements"]) {
    await rest(`${table}?id=not.is.null`, { method: "DELETE" });
  }
  await rest("page_sections?key=not.is.null", { method: "DELETE" });

  const post = (table: string, rows: unknown[]) =>
    rows.length ? rest(table, { method: "POST", body: JSON.stringify(rows) }) : Promise.resolve();
  const strip = <T extends { id: string }>({ id: _id, ...row }: T) => row;

  await post("nav_items", D.defaultNav.map(strip));
  await post("page_sections", D.defaultSections);

  const roleIds = new Map(D.defaultRoles.map((r) => [r.id, crypto.randomUUID()]));
  await post("roles", D.defaultRoles.map((r) => ({ ...r, id: roleIds.get(r.id) })));
  await post(
    "team_members",
    D.defaultMembers.map((m) => ({ ...strip(m), role_id: roleIds.get(m.role_id) })),
  );

  const projectIds = new Map(D.defaultProjectRows.map(({ row }) => [row.id, crypto.randomUUID()]));
  await post("projects", D.defaultProjectRows.map(({ row }) => ({ ...row, id: projectIds.get(row.id) })));
  await post(
    "project_members",
    D.defaultProjectRows.flatMap(({ row, members }) => members.map((m) => ({ ...m, project_id: projectIds.get(row.id) }))),
  );

  await post("site_settings", [{ id: 1, ...D.defaultSettings }]);
  refresh(...ALL_CMS_TAGS);
}
