import { DOMAINS, ROLES as SKILL_ROLES, STATUSES } from "@/data/taxonomy";
import { publicMediaPrefix } from "./media";
import { checkHref, type KnownSlugs } from "./routes";
import {
  EVENT_STATUSES,
  FOOTER_GROUPS,
  MILESTONE_STATES,
  SECTION_KEYS,
  SOCIAL_PLATFORMS,
  type SectionKey,
} from "./types";

/**
 * Server-side validation for every CMS write. The admin UI validates too, but
 * only this runs on data that reaches the database. Each validator takes the
 * whole object (writes are full replacements) and returns either a clean row
 * or a map of field → message the editor shows next to the field.
 */

export type Result<T> = { ok: true; row: T } | { ok: false; errors: Record<string, string> };

export type Ctx = { slugs: KnownSlugs; roleIds: string[]; memberIds: string[] };

class Check {
  errors: Record<string, string> = {};
  constructor(
    private input: Record<string, unknown>,
    private ctx: Ctx,
  ) {}

  private raw(field: string) {
    return this.input[field];
  }

  fail(field: string, message: string) {
    if (!this.errors[field]) this.errors[field] = message;
  }

  text(field: string, { max = 200, required = false }: { max?: number; required?: boolean } = {}): string {
    const v = this.raw(field);
    const s = typeof v === "string" ? v.replace(/\r\n/g, "\n").trim() : v == null ? "" : null;
    if (s === null) return this.fail(field, "Must be text."), "";
    if (required && !s) this.fail(field, "Required.");
    if (s.length > max) this.fail(field, `Keep this under ${max} characters.`);
    return s;
  }

  optional(field: string, max = 200): string | null {
    return this.text(field, { max }) || null;
  }

  bool(field: string): boolean {
    return this.raw(field) === true;
  }

  int(field: string, min: number, max: number): number {
    const n = Number(this.raw(field) ?? 0);
    if (!Number.isInteger(n) || n < min || n > max) this.fail(field, `Whole number from ${min} to ${max}.`);
    return Number.isFinite(n) ? Math.round(n) : 0;
  }

  oneOf<T extends string>(field: string, options: readonly T[], { nullable = false } = {}): T | null {
    const v = this.raw(field);
    if (nullable && (v == null || v === "")) return null;
    if (typeof v !== "string" || !options.includes(v as T)) this.fail(field, "Pick one of the options.");
    return (v as T) ?? null;
  }

  slug(field: string): string {
    const s = this.text(field, { max: 80, required: true });
    if (s && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) this.fail(field, "Lowercase letters, numbers and dashes only.");
    return s;
  }

  href(field: string, { required = false } = {}): string {
    const s = this.text(field, { max: 500, required });
    if (s) {
      const problem = checkHref(s, this.ctx.slugs);
      if (problem) this.fail(field, problem);
    }
    return s;
  }

  /** External links only: http(s) web addresses. */
  url(field: string): string | null {
    const s = this.text(field, { max: 500 });
    if (!s) return null;
    if (!/^https?:\/\/[^\s/]+\.[^\s]+$/i.test(s)) this.fail(field, "Use a full address starting with https://");
    return s;
  }

  email(field: string): string | null {
    const s = this.text(field, { max: 200 });
    if (!s) return null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) this.fail(field, "That email address is not valid.");
    return s;
  }

  /** An uploaded image from the media library, or a file shipped with the site. */
  image(field: string): string | null {
    const s = this.text(field, { max: 500 });
    if (!s) return null;
    const prefix = publicMediaPrefix();
    const own = prefix !== null && s.startsWith(prefix) && !s.slice(prefix.length).includes("..");
    const bundled = /^\/[\w./-]+\.(svg|png|jpe?g|webp|ico)$/i.test(s) && !s.includes("..");
    if (!own && !bundled) this.fail(field, "Choose an image from the media library.");
    return s;
  }

  list(field: string, { maxItems = 20, max = 300 }: { maxItems?: number; max?: number } = {}): string[] {
    const v = this.raw(field) ?? [];
    if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) return this.fail(field, "Must be a list."), [];
    const items = (v as string[]).map((x) => x.trim()).filter(Boolean);
    if (items.length > maxItems) this.fail(field, `At most ${maxItems} items.`);
    if (items.some((x) => x.length > max)) this.fail(field, `Keep each item under ${max} characters.`);
    return items;
  }

  datetime(field: string, { required = false } = {}): string | null {
    const v = this.raw(field);
    if (v == null || v === "") {
      if (required) this.fail(field, "Required.");
      return null;
    }
    const d = new Date(String(v));
    if (Number.isNaN(d.getTime())) return this.fail(field, "Not a valid date."), null;
    return d.toISOString();
  }

  date(field: string): string {
    const s = this.text(field, { max: 10, required: true });
    if (s && !/^\d{4}-\d{2}-\d{2}$/.test(s)) this.fail(field, "Use a date like 2026-09-24.");
    return s;
  }

  done<T>(row: T): Result<T> {
    return Object.keys(this.errors).length ? { ok: false, errors: this.errors } : { ok: true, row };
  }
}

type Input = Record<string, unknown>;

export function validateSettings(input: Input, ctx: Ctx) {
  const c = new Check(input, ctx);
  return c.done({
    site_name: c.text("site_name", { max: 80, required: true }),
    short_name: c.text("short_name", { max: 24, required: true }),
    organization: c.text("organization", { max: 120, required: true }),
    tagline: c.text("tagline", { max: 200 }),
    description: c.text("description", { max: 400 }),
    logo_url: c.image("logo_url"),
    favicon_url: c.image("favicon_url"),
    contact_email: c.email("contact_email"),
    contact_phone: c.optional("contact_phone", 40),
    location: c.optional("location", 160),
    registration_url: c.url("registration_url"),
    registration_qr_url: c.image("registration_qr_url"),
    footer_text: c.text("footer_text", { max: 400 }),
    pillars: c.list("pillars", { maxItems: 8, max: 24 }),
    copyright_text: c.text("copyright_text", { max: 160 }),
    disclaimer_text: c.text("disclaimer_text", { max: 400 }),
  });
}

export function validateNav(input: Input, ctx: Ctx) {
  const c = new Check(input, ctx);
  const row = {
    label: c.text("label", { max: 40, required: true }),
    href: c.href("href", { required: true }),
    in_header: c.bool("in_header"),
    footer_group: c.oneOf(
      "footer_group",
      FOOTER_GROUPS.map((g) => g.id),
      { nullable: true },
    ),
    enabled: c.bool("enabled"),
  };
  if (!row.in_header && !row.footer_group) c.fail("in_header", "Show it in the header, a footer column, or both.");
  return c.done(row);
}

export function validateSocial(input: Input, ctx: Ctx) {
  const c = new Check(input, ctx);
  const platform = c.oneOf("platform", SOCIAL_PLATFORMS);
  const url = platform === "email" ? c.href("url", { required: true }) : c.url("url");
  if (!url) c.fail("url", "Required.");
  return c.done({ platform, url, enabled: c.bool("enabled") });
}

/**
 * Which extra lists each section accepts. Anything else in `extra` is
 * rejected, so the column cannot turn into a dumping ground.
 */
export const SECTION_EXTRA: Partial<Record<SectionKey, Record<string, "text" | "href" | "list">>> = {
  hero: { badge: "text", tertiary_label: "text", tertiary_href: "href", focus: "list" },
};

export function validateSection(key: string, input: Input, ctx: Ctx) {
  const c = new Check(input, ctx);
  if (!(SECTION_KEYS as readonly string[]).includes(key)) c.fail("key", "Unknown section.");
  const allowed = SECTION_EXTRA[key as SectionKey] ?? {};
  const extraIn = (input.extra && typeof input.extra === "object" ? input.extra : {}) as Input;
  const e = new Check(extraIn, ctx);
  const extra: Record<string, string | string[]> = {};
  for (const [name, kind] of Object.entries(allowed)) {
    if (kind === "list") extra[name] = e.list(name, { maxItems: 12, max: 40 });
    else if (kind === "href") extra[name] = e.href(name);
    else extra[name] = e.text(name, { max: 60 });
  }
  for (const [f, m] of Object.entries(e.errors)) c.fail(`extra.${f}`, m);

  const row = {
    key,
    enabled: key === "hero" ? true : c.bool("enabled"),
    eyebrow: c.text("eyebrow", { max: 60 }),
    title: c.text("title", { max: 200 }),
    subtitle: c.text("subtitle", { max: 200 }),
    body: c.text("body", { max: 800 }),
    note: c.text("note", { max: 400 }),
    primary_label: c.text("primary_label", { max: 40 }),
    primary_href: c.href("primary_href"),
    secondary_label: c.text("secondary_label", { max: 40 }),
    secondary_href: c.href("secondary_href"),
    image_url: c.image("image_url"),
    extra,
  };
  if (row.primary_label && !row.primary_href && key !== "problem_of_the_week")
    c.fail("primary_href", "A button needs a link.");
  if (row.secondary_label && !row.secondary_href) c.fail("secondary_href", "A button needs a link.");
  return c.done(row);
}

export function validateRole(input: Input, ctx: Ctx) {
  const c = new Check(input, ctx);
  return c.done({ name: c.text("name", { max: 60, required: true }) });
}

export function validateMember(input: Input, ctx: Ctx) {
  const c = new Check(input, ctx);
  const role_id = c.text("role_id", { max: 64, required: true });
  if (role_id && !ctx.roleIds.includes(role_id)) c.fail("role_id", "Pick a role.");
  return c.done({
    name: c.text("name", { max: 80, required: true }),
    role_id,
    bio: c.text("bio", { max: 600 }),
    photo_url: c.image("photo_url"),
    linkedin_url: c.url("linkedin_url"),
    github_url: c.url("github_url"),
    website_url: c.url("website_url"),
    email: c.email("email"),
    published: c.bool("published"),
  });
}

export function validateEvent(input: Input, ctx: Ctx) {
  const c = new Check(input, ctx);
  const starts_at = c.datetime("starts_at", { required: true });
  const ends_at = c.datetime("ends_at");
  if (starts_at && ends_at && ends_at < starts_at) c.fail("ends_at", "Ends before it starts.");
  return c.done({
    slug: c.slug("slug"),
    title: c.text("title", { max: 120, required: true }),
    description: c.text("description", { max: 2000 }),
    starts_at,
    ends_at,
    location: c.text("location", { max: 160 }),
    registration_url: c.url("registration_url"),
    image_url: c.image("image_url"),
    status: c.oneOf("status", EVENT_STATUSES),
    published: c.bool("published"),
  });
}

export function validateAnnouncement(input: Input, ctx: Ctx) {
  const c = new Check(input, ctx);
  const link = c.text("link_url", { max: 500 });
  if (link) {
    const problem = checkHref(link, ctx.slugs);
    if (problem) c.fail("link_url", problem);
  }
  return c.done({
    title: c.text("title", { max: 140, required: true }),
    body: c.text("body", { max: 400 }),
    link_url: link || null,
    date: c.date("date"),
    published: c.bool("published"),
  });
}

export function validateProject(input: Input, ctx: Ctx) {
  const c = new Check(input, ctx);
  const problem_slug = c.optional("problem_slug", 80);
  if (problem_slug && !ctx.slugs.problems.includes(problem_slug)) c.fail("problem_slug", "No such problem.");

  const domains = c.list("domains", { maxItems: DOMAINS.length, max: 40 });
  if (domains.some((d) => !(DOMAINS as readonly string[]).includes(d))) c.fail("domains", "Unknown domain.");

  const timelineIn = Array.isArray(input.timeline) ? (input.timeline as Input[]) : [];
  const timeline = timelineIn.map((m, i) => {
    const t = new Check(m ?? {}, ctx);
    const out = {
      phase: t.text("phase", { max: 40, required: true }),
      state: t.oneOf("state", MILESTONE_STATES) ?? "later",
      detail: t.text("detail", { max: 300 }),
    };
    for (const [f, msg] of Object.entries(t.errors)) c.fail(`timeline.${i}.${f}`, msg);
    return out;
  });
  if (timeline.length > 12) c.fail("timeline", "At most 12 milestones.");

  const rolesIn = Array.isArray(input.open_roles) ? (input.open_roles as Input[]) : [];
  const open_roles = rolesIn.map((r, i) => {
    const t = new Check(r ?? {}, ctx);
    const out = {
      role: t.oneOf("role", SKILL_ROLES) ?? "Frontend",
      level: t.text("level", { max: 30, required: true }),
      what: t.text("what", { max: 300 }),
    };
    for (const [f, msg] of Object.entries(t.errors)) c.fail(`open_roles.${i}.${f}`, msg);
    return out;
  });
  if (open_roles.length > 20) c.fail("open_roles", "At most 20 open roles.");

  const membersIn = Array.isArray(input.members) ? (input.members as Input[]) : [];
  const members = membersIn.map((m, i) => {
    const t = new Check(m ?? {}, ctx);
    const member_id = t.optional("member_id", 64);
    if (member_id && !ctx.memberIds.includes(member_id)) t.fail("member_id", "Unknown team member.");
    const out = {
      member_id,
      name: t.text("name", { max: 80, required: true }),
      role: t.text("role", { max: 80 }),
      sort: i,
    };
    for (const [f, msg] of Object.entries(t.errors)) c.fail(`members.${i}.${f}`, msg);
    return out;
  });
  if (members.length > 30) c.fail("members", "At most 30 people.");

  const row = {
    slug: c.slug("slug"),
    name: c.text("name", { max: 120, required: true }),
    category: c.text("category", { max: 60 }),
    status: c.oneOf("status", Object.keys(STATUSES) as (keyof typeof STATUSES)[]),
    summary: c.text("summary", { max: 400, required: true }),
    problem: c.text("problem", { max: 1500 }),
    problem_slug,
    image_url: c.image("image_url"),
    repo_url: c.url("repo_url"),
    live_url: c.url("live_url"),
    progress: c.int("progress", 0, 100),
    featured: c.bool("featured"),
    published: c.bool("published"),
    domains,
    technologies: c.list("technologies", { maxItems: 20, max: 40 }),
    building: c.list("building", { maxItems: 12 }),
    exists_now: c.list("exists_now", { maxItems: 12 }),
    not_yet: c.list("not_yet", { maxItems: 12 }),
    contribute: c.list("contribute", { maxItems: 12 }),
    timeline,
    open_roles,
  };
  const result = c.done(row);
  return result.ok ? { ok: true as const, row: result.row, members } : result;
}
