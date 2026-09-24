import { revalidateTag } from "next/cache";
import { audit } from "@/lib/audit";
import { rest, StorageError } from "@/lib/supabase";
import * as D from "./defaults";
import { CONTENT, CONTENT_KEYS, type ContentKey } from "./content";
import { ALL_CMS_TAGS, CMS_TAGS, getProblems, getResearch, type CmsTag } from "./read";
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

type Resource = {
  table: string;
  tag: CmsTag;
  validate: Validator;
  order: string;
  unique?: string;
  /** Singular noun for audit entries. */
  noun: string;
};

export const RESOURCES: Record<string, Resource> = {
  nav: { table: "nav_items", tag: CMS_TAGS.nav, validate: V.validateNav, order: "sort.asc", noun: "navigation link" },
  social: { table: "social_links", tag: CMS_TAGS.social, validate: V.validateSocial, order: "sort.asc", noun: "social link" },
  roles: { table: "roles", tag: CMS_TAGS.team, validate: V.validateRole, order: "sort.asc", unique: "name", noun: "role" },
  team: { table: "team_members", tag: CMS_TAGS.team, validate: V.validateMember, order: "sort.asc", noun: "team member" },
  events: { table: "events", tag: CMS_TAGS.events, validate: V.validateEvent, order: "starts_at.desc", unique: "slug", noun: "event" },
  projects: { table: "projects", tag: CMS_TAGS.projects, validate: V.validateProject, order: "sort.asc", unique: "slug", noun: "project" },
  announcements: {
    table: "announcements",
    tag: CMS_TAGS.announcements,
    validate: V.validateAnnouncement,
    order: "sort.asc,date.desc",
    noun: "announcement",
  },
  problems: { table: "problems", tag: CMS_TAGS.problems, validate: V.validateProblem, order: "sort.asc", unique: "slug", noun: "problem statement" },
  ideas: { table: "ideas", tag: CMS_TAGS.ideas, validate: V.validateIdea, order: "sort.asc", unique: "slug", noun: "project idea" },
  research: { table: "research_projects", tag: CMS_TAGS.research, validate: V.validateResearch, order: "sort.asc", unique: "slug", noun: "research project" },
  workteams: { table: "working_teams", tag: CMS_TAGS.workteams, validate: V.validateWorkingTeam, order: "sort.asc", unique: "slug", noun: "working team" },
  activity: { table: "activity_items", tag: CMS_TAGS.activity, validate: V.validateActivity, order: "sort.asc", noun: "activity entry" },
};

const isContent = (name: string): name is ContentKey => (CONTENT_KEYS as readonly string[]).includes(name);

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

/** A human name for a row in audit entries. */
function labelOf(row: Row | undefined): string {
  if (!row) return "";
  const v = row.name ?? row.title ?? row.label ?? row.platform ?? row.slug ?? row.id;
  return typeof v === "string" ? v : String(v ?? "");
}

/**
 * Optimistic concurrency. The editor sends back the `updated_at` it loaded
 * as `_expected_updated_at`; a write only lands if the row still carries it.
 * Otherwise someone else saved in between, and the caller gets 409 "stale"
 * with the current row instead of silently overwriting it.
 */
function expectedVersion(input: unknown): string | null {
  const v = input && typeof input === "object" ? (input as Record<string, unknown>)._expected_updated_at : undefined;
  return typeof v === "string" && v.length <= 64 ? v : null;
}

async function stale(table: string, filter: string): Promise<never> {
  const [current] = await rest<Row[]>(`${table}?${filter}&select=*`);
  if (!current) throw new CmsError(404, "not_found");
  throw new CmsError(409, "stale", undefined, { current });
}

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

async function requireReady(name?: string) {
  const status = await cmsStatus();
  if (status === "missing") throw new CmsError(409, "tables_missing");
  if (status === "empty") throw new CmsError(409, "not_initialised");
  // Long-form content is edited only once its collection is in the
  // database; before that the public site serves the built-in copy, and an
  // edit would silently not show.
  if (name && isContent(name) && (await contentStatus())[name] !== "ready") {
    throw new CmsError(409, "content_not_loaded");
  }
}

/** Per collection: "missing" (admin.sql not run), "empty" (not loaded yet) or "ready". */
export async function contentStatus(): Promise<Record<ContentKey, "missing" | "empty" | "ready">> {
  let seeds: { entity: string }[] | null = null;
  try {
    seeds = await rest<{ entity: string }[]>("content_seeds?select=entity");
  } catch (error) {
    if (!(error instanceof StorageError && error.status === 404)) throw error;
  }
  return Object.fromEntries(
    CONTENT_KEYS.map((k) => [k, seeds === null ? "missing" : seeds.some((s) => s.entity === k) ? "ready" : "empty"]),
  ) as Record<ContentKey, "missing" | "empty" | "ready">;
}

/**
 * Copies the built-in long-form content into its tables, for every
 * collection not loaded yet. Leftovers from an interrupted load are cleared
 * first (writes are refused until a collection is loaded, so nothing an
 * admin made can be there). The content_seeds marker goes in last per
 * collection; its presence is what switches the public pages over.
 */
export async function seedContent(actor: string) {
  const status = await contentStatus();
  if (Object.values(status).every((v) => v === "missing")) throw new CmsError(409, "content_tables_missing");
  const loaded: string[] = [];
  for (const key of CONTENT_KEYS) {
    if (status[key] !== "empty") continue;
    const def = CONTENT[key] as unknown as { table: string; defaults: unknown[]; toRow: (i: unknown) => Row };
    await rest(`${def.table}?id=not.is.null`, { method: "DELETE" });
    // One row per request: items differ in which optional fields they set,
    // and a bulk insert needs every object to carry the same keys.
    for (const [sort, item] of def.defaults.entries()) {
      await rest(def.table, { method: "POST", body: JSON.stringify({ ...def.toRow(item), sort, published: true }) });
    }
    await rest("content_seeds", { method: "POST", body: JSON.stringify({ entity: key }) });
    revalidateTag(CMS_TAGS[key]);
    loaded.push(key);
  }
  if (loaded.length) {
    await audit({ actor, action: "initialise", entity: "content", summary: `Loaded built-in ${loaded.join(", ")} into the CMS` });
  }
  return { loaded };
}

/** What a link or reference may point at, read fresh for every write. */
async function context(): Promise<V.Ctx> {
  const [projects, roles, members] = await Promise.all([
    rest<{ slug: string }[]>(`projects?${q({ select: "slug", published: "eq.true" })}`),
    rest<{ id: string }[]>("roles?select=id"),
    rest<{ id: string }[]>("team_members?select=id"),
  ]);
  const [problems, research] = await Promise.all([getProblems(), getResearch()]);
  const slugs: KnownSlugs = {
    projects: projects.map((p) => p.slug),
    problems: problems.map((p) => p.slug),
    research: research.map((r) => r.slug),
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

export async function createRow(name: string, input: unknown, actor: string) {
  const r = resource(name);
  await requireReady(name);
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
    await audit({ actor, action: "create", entity: name, entity_id: created.id, summary: `Created ${r.noun} “${labelOf(created)}”` });
    return created;
  });
}

export async function updateRow(name: string, id: string, input: unknown, actor: string) {
  const r = resource(name);
  checkId(id);
  await requireReady(name);
  const { row, members } = validate(r, input, await context());
  const expected = expectedVersion(input);
  return guarded(r, async () => {
    const filter = q(expected ? { id: `eq.${id}`, updated_at: `eq.${expected}` } : { id: `eq.${id}` });
    const [updated] = await rest<Row[]>(`${r.table}?${filter}`, {
      method: "PATCH",
      body: JSON.stringify({ ...row, updated_at: new Date().toISOString() }),
      prefer: "return=representation",
    });
    if (!updated) return stale(r.table, q({ id: `eq.${id}` }));
    if (members) await replaceMembers(id, members);
    refresh(r.tag);
    const flag = "published" in row ? (row.published ? " (published)" : " (draft)") : "enabled" in row ? (row.enabled ? " (enabled)" : " (disabled)") : "";
    await audit({ actor, action: "update", entity: name, entity_id: id, summary: `Updated ${r.noun} “${labelOf(updated)}”${flag}` });
    return updated;
  });
}

export async function deleteRow(name: string, id: string, actor: string, opts: { reassignTo?: string | null } = {}) {
  const r = resource(name);
  checkId(id);
  await requireReady(name);

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
  await audit({
    actor,
    action: "delete",
    entity: name,
    entity_id: id,
    summary: `Deleted ${r.noun} “${labelOf(removed[0])}”${opts.reassignTo ? " after moving its members" : ""}`,
  });
}

export async function reorderRows(name: string, ids: unknown, actor: string) {
  const r = resource(name);
  if (!Array.isArray(ids) || ids.length > 500 || ids.some((i) => typeof i !== "string")) {
    throw new CmsError(400, "invalid_body");
  }
  (ids as string[]).forEach(checkId);
  await requireReady(name);
  await Promise.all(
    (ids as string[]).map((id, sort) =>
      rest(`${r.table}?${q({ id: `eq.${id}` })}`, { method: "PATCH", body: JSON.stringify({ sort }) }),
    ),
  );
  refresh(r.tag);
  await audit({ actor, action: "reorder", entity: name, summary: `Reordered ${r.noun}s` });
}

// ---------------------------------------------------------------------------
// Singletons: site settings and homepage sections
// ---------------------------------------------------------------------------

export async function readSettings() {
  const rows = await rest<Row[]>("site_settings?select=*&id=eq.1");
  return rows[0] ?? null;
}

export async function saveSettings(input: unknown, actor: string) {
  await requireReady();
  if (!input || typeof input !== "object") throw new CmsError(400, "invalid_body");
  const result = V.validateSettings(input as Record<string, unknown>, await context());
  if (!result.ok) throw new CmsError(422, "invalid", result.errors);
  const expected = expectedVersion(input);
  const filter = q(expected ? { id: "eq.1", updated_at: `eq.${expected}` } : { id: "eq.1" });
  const [row] = await rest<Row[]>(`site_settings?${filter}`, {
    method: "PATCH",
    body: JSON.stringify({ ...result.row, updated_at: new Date().toISOString() }),
    prefer: "return=representation",
  });
  if (!row) return stale("site_settings", "id=eq.1");
  // The name, logo and footer text appear on every page.
  refresh(CMS_TAGS.settings);
  await audit({ actor, action: "update", entity: "settings", entity_id: "1", summary: "Updated site settings" });
  return row;
}

export async function readSections() {
  const rows = await rest<Row[]>("page_sections?select=*");
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return D.defaultSections
    .map((d) => ({ ...d, ...(byKey.get(d.key) ?? {}) }))
    .sort((a, b) => (a.key === "hero" ? -1 : b.key === "hero" ? 1 : Number(a.sort) - Number(b.sort)));
}

/** Homepage sections and page headers together, for saving either. */
async function readAllSections() {
  const rows = await rest<Row[]>("page_sections?select=*");
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return [...D.defaultSections, ...D.defaultPages].map((d) => ({ ...d, ...(byKey.get(d.key) ?? {}) }));
}

/** Page headers for the Pages editor. */
export async function readPages() {
  return (await readAllSections()).filter((s) => String(s.key).startsWith("page_"));
}

export async function saveSection(key: string, input: unknown, actor: string) {
  await requireReady();
  if (!input || typeof input !== "object") throw new CmsError(400, "invalid_body");
  const result = V.validateSection(key, input as Record<string, unknown>, await context());
  if (!result.ok) throw new CmsError(422, "invalid", result.errors);
  const current = (await readAllSections()).find((s) => s.key === key) as (Row & { updated_at?: string }) | undefined;
  const expected = expectedVersion(input);
  if (expected && current?.updated_at && current.updated_at !== expected) {
    throw new CmsError(409, "stale", undefined, { current });
  }
  const [row] = await rest<Row[]>("page_sections?on_conflict=key", {
    method: "POST",
    body: JSON.stringify({ ...result.row, sort: current?.sort ?? 99, updated_at: new Date().toISOString() }),
    prefer: "return=representation,resolution=merge-duplicates",
  });
  refresh(CMS_TAGS.sections);
  await audit({
    actor,
    action: "update",
    entity: "section",
    entity_id: key,
    summary: `Updated section “${key}”${result.row.enabled ? "" : " (hidden)"}`,
  });
  return row;
}

export async function reorderSections(keys: unknown, actor: string) {
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
  await audit({ actor, action: "reorder", entity: "section", summary: "Reordered homepage sections" });
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
export async function initialiseCms(actor: string) {
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
  await audit({ actor, action: "initialise", entity: "cms", summary: "Loaded the built-in website content into the CMS" });
  // Fresh installs that already ran admin.sql get the long-form content too.
  if (Object.values(await contentStatus()).some((v) => v === "empty")) await seedContent(actor);
}
