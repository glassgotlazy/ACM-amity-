import type { ActivityItem, Idea, Problem, ResearchProject, Team } from "./content-types";
import { defaultActivity } from "./defaults/activity";
import { defaultIdeas } from "./defaults/ideas";
import { defaultProblems } from "./defaults/problems";
import { defaultResearch } from "./defaults/research";
import { defaultWorkingTeams } from "./defaults/teams";

/**
 * The long-form content collections and how each maps between its public
 * shape (camelCase, nested as the components expect) and its table row
 * (snake_case columns; small fixed-shape object lists as jsonb). Every row
 * also carries id, sort, published and updated_at.
 */

export type Row = Record<string, unknown>;

export const CONTENT_KEYS = ["problems", "ideas", "research", "workteams", "activity"] as const;
export type ContentKey = (typeof CONTENT_KEYS)[number];

const snake = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const camel = (k: string) => k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
const META = new Set(["id", "sort", "published", "updated_at"]);

/** Public item → row columns (no meta). */
function toColumns(item: object, skip: string[] = []): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(item)) if (!skip.includes(k)) out[snake(k)] = v ?? null;
  return out;
}

/** Row → public item. Nulls become "absent" except where the type allows null. */
function fromColumns(row: Row, keepNull: string[] = []): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) {
    if (META.has(k)) continue;
    const key = camel(k);
    if (v === null && !keepNull.includes(key)) continue;
    out[key] = v;
  }
  return out;
}

type Def<T> = {
  table: string;
  noun: string;
  defaults: T[];
  unique?: string;
  toRow: (item: T) => Row;
  fromRow: (row: Row, position: number) => T;
};

export const CONTENT: { [K in ContentKey]: Def<ContentOf<K>> } = {
  problems: {
    table: "problems",
    noun: "problem statement",
    unique: "slug",
    defaults: defaultProblems,
    // The problem number is its position, so reordering renumbers.
    toRow: (p) => toColumns(p, ["index"]),
    fromRow: (row, i) => ({ ...fromColumns(row), index: i + 1 }) as unknown as Problem,
  },
  ideas: {
    table: "ideas",
    noun: "project idea",
    unique: "slug",
    defaults: defaultIdeas,
    toRow: (i) => toColumns(i),
    fromRow: (row) => fromColumns(row) as unknown as Idea,
  },
  research: {
    table: "research_projects",
    noun: "research project",
    unique: "slug",
    defaults: defaultResearch,
    toRow: (r) => toColumns(r),
    fromRow: (row) => fromColumns(row, ["analysis", "paper"]) as unknown as ResearchProject,
  },
  workteams: {
    table: "working_teams",
    noun: "working team",
    unique: "slug",
    defaults: defaultWorkingTeams,
    toRow: (t) => toColumns(t),
    fromRow: (row) => fromColumns(row) as unknown as Team,
  },
  activity: {
    table: "activity_items",
    noun: "activity entry",
    defaults: defaultActivity,
    toRow: (a) => ({
      kind: a.kind,
      text: a.text,
      actor: a.actor,
      target_label: a.target?.label ?? null,
      target_href: a.target?.href ?? null,
      when_label: a.when,
      day_label: a.day,
    }),
    fromRow: (row) =>
      ({
        id: String(row.id),
        kind: row.kind,
        text: row.text,
        actor: row.actor,
        target: row.target_label && row.target_href ? { label: row.target_label, href: row.target_href } : undefined,
        when: row.when_label,
        day: row.day_label,
      }) as ActivityItem,
  },
};

export type ContentOf<K extends ContentKey> = K extends "problems"
  ? Problem
  : K extends "ideas"
    ? Idea
    : K extends "research"
      ? ResearchProject
      : K extends "workteams"
        ? Team
        : ActivityItem;

/** Defaults as they are served before seeding, numbered like rows would be. */
export function defaultsOf<K extends ContentKey>(key: K): ContentOf<K>[] {
  const def = CONTENT[key] as Def<ContentOf<K>>;
  return def.defaults.map((item, i) => def.fromRow({ ...def.toRow(item), id: `default-${key}-${i}` }, i));
}
