"use client";

import { useEffect, useState } from "react";
import {
  DOMAINS,
  LEVELS,
  ORIGINS,
  PROBLEM_CATEGORIES,
  ROLES,
  STATUSES,
} from "@/data/taxonomy";
import { ACTIVITY_KINDS, BANDS } from "@/lib/cms/content-types";
import { api, explain } from "./api";
import {
  Collection,
  b,
  list,
  s,
  type Draft,
  type FormProps,
} from "./Collection";
import {
  Checkboxes,
  LinkInput,
  ListField,
  Part,
  RowsEditor,
  Select,
  TextArea,
  TextInput,
  Btn,
  Toggle,
  firstError,
  rowControl,
  useToast,
} from "./kit";

/*
 * Editors for the long-form content: problem statements, project ideas,
 * research, working teams and the activity log. Field names match the
 * table columns; the server validates every one of them again.
 */

type Obj = Record<string, unknown>;
const objs = (v: unknown) => (Array.isArray(v) ? (v as Obj[]) : []);
const opts = (xs: readonly string[]) => xs.map((x) => ({ value: x, label: x }));

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

/** Title + slug pair where the slug follows the title until edited by hand. */
function TitleSlug({
  value,
  set,
  errors,
  field,
  label,
  path,
}: FormProps & { field: string; label: string; path: string }) {
  return (
    <>
      <TextInput
        label={label}
        required
        maxLength={160}
        value={s(value[field])}
        onChange={(v) =>
          set({
            [field]: v,
            ...(value._slugTouched ? {} : { slug: slugify(v) }),
          })
        }
        error={errors[field]}
      />
      <TextInput
        label="Slug"
        required
        hint={`${path}${s(value.slug) || "slug"}`}
        value={s(value.slug)}
        onChange={(v) => set({ slug: v, _slugTouched: true })}
        error={errors.slug}
      />
    </>
  );
}

const withTouched = (r: Obj) => ({ ...r, _slugTouched: true });
const dropTouched = ({ _slugTouched, ...d }: Draft) => d;

function useProblemOptions() {
  const [rows, setRows] = useState<{ slug: string; title: string }[]>([]);
  useEffect(() => {
    api<{ rows: { slug: string; title: string }[] }>(
      "/api/admin/cms/problem-options",
    )
      .then((b) => setRows(b.rows))
      .catch(() => {});
  }, []);
  return rows;
}

const levelOptions = LEVELS.map((l) => ({
  value: l.id,
  label: `${l.name} — ${l.summary}`,
}));

/* -------------------------------------------------------------------------- */

function ProblemForm({ value, set, errors }: FormProps) {
  const pp = (value.potential_project ?? {}) as Obj;
  const setPP = (p: Obj) => set({ potential_project: { ...pp, ...p } });
  return (
    <>
      <Part title="Statement">
        <TitleSlug
          value={value}
          set={set}
          errors={errors}
          field="title"
          label="Title"
          path="/problems/"
        />
        <TextInput
          label="Hook"
          hint="The one-line framing on cards."
          maxLength={300}
          value={s(value.hook)}
          onChange={(v) => set({ hook: v })}
          error={errors.hook}
        />
        <TextArea
          label="Question"
          required
          hint="Always a “How might we…” question."
          rows={2}
          maxLength={400}
          value={s(value.question)}
          onChange={(v) => set({ question: v })}
          error={errors.question}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Origin"
            value={s(value.origin) as keyof typeof ORIGINS}
            onChange={(v) => set({ origin: v })}
            options={(Object.keys(ORIGINS) as (keyof typeof ORIGINS)[]).map(
              (k) => ({ value: k, label: ORIGINS[k] }),
            )}
            error={errors.origin}
          />
          <Select
            label="Category"
            value={s(value.category) as (typeof PROBLEM_CATEGORIES)[number]}
            onChange={(v) => set({ category: v })}
            options={opts(PROBLEM_CATEGORIES)}
            error={errors.category}
          />
        </div>
        <Select
          label="Difficulty"
          value={s(value.level) as (typeof LEVELS)[number]["id"]}
          onChange={(v) => set({ level: v })}
          options={levelOptions}
          error={errors.level}
        />
        <Checkboxes
          label="Domains"
          options={DOMAINS}
          value={list(value.domains)}
          onChange={(v) => set({ domains: v })}
          error={errors.domains}
        />
        <Toggle
          label="Featured"
          checked={b(value.featured)}
          onChange={(v) => set({ featured: v })}
        />
        <Toggle
          label="Published"
          hint="Unpublished problems are hidden everywhere on the site."
          checked={b(value.published)}
          onChange={(v) => set({ published: v })}
        />
      </Part>
      <Part title="Background">
        <ListField
          label="Where students run into it"
          multiline
          items={list(value.context)}
          onChange={(v) => set({ context: v })}
          error={errors.context}
          max={12}
        />
        <ListField
          label="Why it matters"
          multiline
          items={list(value.why_it_matters)}
          onChange={(v) => set({ why_it_matters: v })}
          error={errors.why_it_matters}
          max={12}
        />
      </Part>
      <Part title="Directions">
        <RowsEditor
          label="Direction"
          rows={objs(value.directions)}
          onChange={(v) => set({ directions: v })}
          blank={() => ({ title: "", detail: "" })}
          error={firstError(errors, "directions")}
          max={12}
          render={(row, setRow, i) => (
            <>
              <input
                aria-label={`Direction ${i + 1} title`}
                placeholder="Title"
                value={s(row.title)}
                onChange={(e) => setRow({ title: e.target.value })}
                className={rowControl}
              />
              <input
                aria-label={`Direction ${i + 1} detail`}
                placeholder="Detail"
                value={s(row.detail)}
                onChange={(e) => setRow({ detail: e.target.value })}
                className={`${rowControl} sm:col-span-full`}
              />
            </>
          )}
        />
      </Part>
      <Part title="Potential project">
        <TextInput
          label="Project name"
          required
          value={s(pp.name)}
          onChange={(v) => setPP({ name: v })}
          error={errors["potential_project.name"]}
        />
        <TextArea
          label="Summary"
          rows={2}
          value={s(pp.summary)}
          onChange={(v) => setPP({ summary: v })}
          error={errors["potential_project.summary"]}
        />
        <TextInput
          label="Existing project slug"
          hint="Optional — if a project already works on this."
          value={s(pp.slug)}
          onChange={(v) => setPP({ slug: v })}
          error={errors["potential_project.slug"]}
        />
      </Part>
      <Part title="Skills and team">
        <ListField
          label="Technologies"
          items={list(value.technologies)}
          onChange={(v) => set({ technologies: v })}
          error={errors.technologies}
        />
        <ListField
          label="Skills"
          items={list(value.skills)}
          onChange={(v) => set({ skills: v })}
          error={errors.skills}
        />
        <Checkboxes
          label="Open roles"
          options={ROLES}
          value={list(value.open_roles)}
          onChange={(v) => set({ open_roles: v })}
          error={errors.open_roles}
        />
        <RowsEditor
          label="Team shape"
          rows={objs(value.team)}
          onChange={(v) => set({ team: v })}
          blank={() => ({ role: ROLES[0], count: 1, note: "" })}
          error={firstError(errors, "team")}
          max={12}
          render={(row, setRow, i) => (
            <>
              <select
                aria-label={`Team slot ${i + 1} role`}
                value={s(row.role)}
                onChange={(e) => setRow({ role: e.target.value })}
                className={rowControl}
              >
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <input
                aria-label={`Team slot ${i + 1} count`}
                type="number"
                min={1}
                max={20}
                value={s(row.count)}
                onChange={(e) => setRow({ count: Number(e.target.value) })}
                className={rowControl}
              />
              <input
                aria-label={`Team slot ${i + 1} note`}
                placeholder="Note"
                value={s(row.note)}
                onChange={(e) => setRow({ note: e.target.value })}
                className={`${rowControl} sm:col-span-full`}
              />
            </>
          )}
        />
      </Part>
      <Part title="Research and next steps">
        <ListField
          label="Research questions"
          multiline
          items={list(value.research_questions)}
          onChange={(v) => set({ research_questions: v })}
          error={errors.research_questions}
          max={12}
        />
        <ListField
          label="Next steps"
          multiline
          items={list(value.next_steps)}
          onChange={(v) => set({ next_steps: v })}
          error={errors.next_steps}
          max={12}
        />
      </Part>
    </>
  );
}

export function ProblemsEditor() {
  return (
    <Collection
      resource="problems"
      previewPath={(r) => `/problems/${r.slug}`}
      noun="problem statement"
      sortable
      label={(r) => s(r.title)}
      searchText={(r) => `${s(r.title)} ${s(r.category)} ${s(r.hook)}`}
      toggle={{ key: "published", on: "Published", off: "Hidden" }}
      toDraft={withTouched}
      fromDraft={dropTouched}
      blank={() => ({
        title: "",
        slug: "",
        hook: "",
        question: "How might we ",
        origin: "exploration",
        category: PROBLEM_CATEGORIES[0],
        level: "build",
        domains: [],
        context: [],
        why_it_matters: [],
        directions: [],
        technologies: [],
        potential_project: { name: "", summary: "" },
        skills: [],
        open_roles: [],
        team: [],
        research_questions: [],
        next_steps: [],
        featured: false,
        published: false,
      })}
      Form={ProblemForm}
      emptyHint="Problem statements appear in the Problem Lab. Order here sets their numbers."
      columns={[
        {
          head: "Problem",
          cell: (r) => (
            <span className="font-medium text-ink">{s(r.title)}</span>
          ),
        },
        { head: "Category", cell: (r) => s(r.category) },
      ]}
    />
  );
}

/* -------------------------------------------------------------------------- */

export function IdeasEditor() {
  const problems = useProblemOptions();
  return (
    <Collection
      resource="ideas"
      previewPath={() => "/ideas"}
      noun="project idea"
      sortable
      label={(r) => s(r.name)}
      searchText={(r) => `${s(r.name)} ${s(r.tagline)} ${s(r.band)}`}
      toggle={{ key: "published", on: "Published", off: "Hidden" }}
      toDraft={withTouched}
      fromDraft={dropTouched}
      blank={() => ({
        name: "",
        slug: "",
        tagline: "",
        level: "build",
        band: "Beginner",
        domains: [],
        team_size: "2–3",
        technologies: [],
        skills: [],
        learn: [],
        problem_slug: null,
        published: false,
      })}
      Form={({ value, set, errors }) => (
        <>
          <TitleSlug
            value={value}
            set={set}
            errors={errors}
            field="name"
            label="Name"
            path="/ideas#"
          />
          <TextInput
            label="Tagline"
            maxLength={200}
            value={s(value.tagline)}
            onChange={(v) => set({ tagline: v })}
            error={errors.tagline}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Band"
              value={s(value.band) as (typeof BANDS)[number]}
              onChange={(v) => set({ band: v })}
              options={opts(BANDS)}
              error={errors.band}
            />
            <TextInput
              label="Team size"
              maxLength={20}
              value={s(value.team_size)}
              onChange={(v) => set({ team_size: v })}
              error={errors.team_size}
            />
          </div>
          <Select
            label="Difficulty"
            value={s(value.level) as (typeof LEVELS)[number]["id"]}
            onChange={(v) => set({ level: v })}
            options={levelOptions}
            error={errors.level}
          />
          <Checkboxes
            label="Domains"
            options={DOMAINS}
            value={list(value.domains)}
            onChange={(v) => set({ domains: v })}
            error={errors.domains}
          />
          <ListField
            label="Technologies"
            items={list(value.technologies)}
            onChange={(v) => set({ technologies: v })}
            error={errors.technologies}
          />
          <ListField
            label="Skills"
            items={list(value.skills)}
            onChange={(v) => set({ skills: v })}
            error={errors.skills}
          />
          <ListField
            label="What you learn"
            multiline
            items={list(value.learn)}
            onChange={(v) => set({ learn: v })}
            error={errors.learn}
            max={12}
          />
          <Select
            label="Linked problem"
            value={s(value.problem_slug)}
            onChange={(v) => set({ problem_slug: v || null })}
            options={problems.map((p) => ({ value: p.slug, label: p.title }))}
            placeholder="None"
            error={errors.problem_slug}
          />
          <Toggle
            label="Published"
            checked={b(value.published)}
            onChange={(v) => set({ published: v })}
          />
        </>
      )}
      emptyHint="Unclaimed starting points listed on /ideas and on the homepage."
      columns={[
        {
          head: "Idea",
          cell: (r) => (
            <span className="font-medium text-ink">{s(r.name)}</span>
          ),
        },
        { head: "Band", cell: (r) => s(r.band) },
      ]}
    />
  );
}

/* -------------------------------------------------------------------------- */

function ResearchForm({ value, set, errors }: FormProps) {
  return (
    <>
      <Part title="Project">
        <TitleSlug
          value={value}
          set={set}
          errors={errors}
          field="title"
          label="Title"
          path="/research/"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Status"
            value={s(value.status) as keyof typeof STATUSES}
            onChange={(v) => set({ status: v })}
            options={(Object.keys(STATUSES) as (keyof typeof STATUSES)[]).map(
              (k) => ({ value: k, label: STATUSES[k].label }),
            )}
            error={errors.status}
          />
          <TextInput
            label="Field"
            maxLength={120}
            value={s(value.field)}
            onChange={(v) => set({ field: v })}
            error={errors.field}
          />
        </div>
        <TextArea
          label="Research question"
          required
          rows={3}
          maxLength={600}
          value={s(value.question)}
          onChange={(v) => set({ question: v })}
          error={errors.question}
        />
        <Toggle
          label="Published"
          checked={b(value.published)}
          onChange={(v) => set({ published: v })}
        />
      </Part>
      <Part title="Background and exploration">
        <ListField
          label="Background paragraphs"
          multiline
          items={list(value.background)}
          onChange={(v) => set({ background: v })}
          error={errors.background}
          max={12}
        />
        <ListField
          label="Exploration"
          multiline
          items={list(value.exploration)}
          onChange={(v) => set({ exploration: v })}
          error={errors.exploration}
          max={12}
        />
        <ListField
          label="Open to"
          items={list(value.open_to)}
          onChange={(v) => set({ open_to: v })}
          error={errors.open_to}
          max={12}
        />
      </Part>
      <Part title="Literature">
        <RowsEditor
          label="Reading theme"
          rows={objs(value.literature)}
          onChange={(v) => set({ literature: v })}
          blank={() => ({ theme: "", note: "" })}
          error={firstError(errors, "literature")}
          render={(row, setRow, i) => (
            <>
              <input
                aria-label={`Theme ${i + 1}`}
                placeholder="Theme"
                value={s(row.theme)}
                onChange={(e) => setRow({ theme: e.target.value })}
                className={rowControl}
              />
              <input
                aria-label={`Theme ${i + 1} note`}
                placeholder="Note"
                value={s(row.note)}
                onChange={(e) => setRow({ note: e.target.value })}
                className={`${rowControl} sm:col-span-full`}
              />
            </>
          )}
        />
      </Part>
      <Part title="Experiments">
        <RowsEditor
          label="Experiment"
          rows={objs(value.experiments)}
          onChange={(v) => set({ experiments: v })}
          blank={() => ({ title: "", state: "planned", note: "" })}
          error={firstError(errors, "experiments")}
          render={(row, setRow, i) => (
            <>
              <input
                aria-label={`Experiment ${i + 1} title`}
                placeholder="Title"
                value={s(row.title)}
                onChange={(e) => setRow({ title: e.target.value })}
                className={rowControl}
              />
              <select
                aria-label={`Experiment ${i + 1} state`}
                value={s(row.state)}
                onChange={(e) => setRow({ state: e.target.value })}
                className={rowControl}
              >
                <option value="planned">planned</option>
                <option value="running">running</option>
                <option value="blocked">blocked</option>
              </select>
              <input
                aria-label={`Experiment ${i + 1} note`}
                placeholder="Note"
                value={s(row.note)}
                onChange={(e) => setRow({ note: e.target.value })}
                className={`${rowControl} sm:col-span-full`}
              />
            </>
          )}
        />
      </Part>
      <Part title="Stages">
        <RowsEditor
          label="Stage"
          rows={objs(value.stages)}
          onChange={(v) => set({ stages: v })}
          blank={() => ({
            id: `stage-${Date.now().toString(36)}`,
            name: "",
            state: "open",
            detail: "",
          })}
          error={firstError(errors, "stages")}
          max={12}
          render={(row, setRow, i) => (
            <>
              <input
                aria-label={`Stage ${i + 1} name`}
                placeholder="Name"
                value={s(row.name)}
                onChange={(e) => setRow({ name: e.target.value })}
                className={rowControl}
              />
              <select
                aria-label={`Stage ${i + 1} state`}
                value={s(row.state)}
                onChange={(e) => setRow({ state: e.target.value })}
                className={rowControl}
              >
                <option value="done">done</option>
                <option value="active">active</option>
                <option value="open">open</option>
              </select>
              <input
                aria-label={`Stage ${i + 1} detail`}
                placeholder="Detail"
                value={s(row.detail)}
                onChange={(e) => setRow({ detail: e.target.value })}
                className={`${rowControl} sm:col-span-full`}
              />
            </>
          )}
        />
      </Part>
      <Part title="Results">
        <TextArea
          label="Analysis"
          hint="Leave empty until there is one — the page says so."
          rows={3}
          maxLength={2000}
          value={s(value.analysis)}
          onChange={(v) => set({ analysis: v || null })}
          error={errors.analysis}
        />
        <TextArea
          label="Paper"
          hint="Leave empty until one exists."
          rows={2}
          maxLength={600}
          value={s(value.paper)}
          onChange={(v) => set({ paper: v || null })}
          error={errors.paper}
        />
      </Part>
    </>
  );
}

export function ResearchEditor() {
  return (
    <Collection
      resource="research"
      previewPath={(r) => `/research/${r.slug}`}
      noun="research project"
      sortable
      label={(r) => s(r.title)}
      searchText={(r) => `${s(r.title)} ${s(r.field)}`}
      toggle={{ key: "published", on: "Published", off: "Hidden" }}
      toDraft={withTouched}
      fromDraft={dropTouched}
      blank={() => ({
        title: "",
        slug: "",
        status: "exploring",
        field: "",
        question: "",
        background: [],
        literature: [],
        exploration: [],
        experiments: [],
        analysis: null,
        paper: null,
        stages: [],
        open_to: [],
        published: false,
      })}
      Form={ResearchForm}
      emptyHint="The first research project is featured at the top of /research."
      columns={[
        {
          head: "Project",
          cell: (r) => (
            <span className="font-medium text-ink">{s(r.title)}</span>
          ),
        },
        { head: "Field", cell: (r) => s(r.field) },
      ]}
    />
  );
}

/* -------------------------------------------------------------------------- */

export function WorkingTeamsEditor() {
  return (
    <Collection
      resource="workteams"
      previewPath={() => "/teams"}
      noun="working team"
      sortable
      label={(r) => s(r.name)}
      searchText={(r) => `${s(r.name)} ${s(r.focus)}`}
      toggle={{ key: "published", on: "Published", off: "Hidden" }}
      toDraft={withTouched}
      fromDraft={dropTouched}
      blank={() => ({
        name: "",
        slug: "",
        focus: "",
        charter: "",
        domains: [],
        works: [],
        projects: [],
        open_positions: [],
        meets: "",
        size: 0,
        published: false,
      })}
      Form={({ value, set, errors }) => (
        <>
          <TitleSlug
            value={value}
            set={set}
            errors={errors}
            field="name"
            label="Name"
            path="/teams#"
          />
          <TextArea
            label="Focus"
            hint="One sentence on what the team is for."
            rows={2}
            maxLength={300}
            value={s(value.focus)}
            onChange={(v) => set({ focus: v })}
            error={errors.focus}
          />
          <TextArea
            label="Charter"
            rows={4}
            maxLength={1500}
            value={s(value.charter)}
            onChange={(v) => set({ charter: v })}
            error={errors.charter}
          />
          <Checkboxes
            label="Domains"
            options={DOMAINS}
            value={list(value.domains)}
            onChange={(v) => set({ domains: v })}
            error={errors.domains}
          />
          <ListField
            label="Works on"
            items={list(value.works)}
            onChange={(v) => set({ works: v })}
            error={errors.works}
            max={12}
          />
          <RowsEditor
            label="Project"
            rows={objs(value.projects)}
            onChange={(v) => set({ projects: v })}
            blank={() => ({ name: "", slug: "" })}
            error={firstError(errors, "projects")}
            max={12}
            render={(row, setRow, i) => (
              <>
                <input
                  aria-label={`Project ${i + 1} name`}
                  placeholder="Name"
                  value={s(row.name)}
                  onChange={(e) => setRow({ name: e.target.value })}
                  className={rowControl}
                />
                <input
                  aria-label={`Project ${i + 1} slug`}
                  placeholder="Project slug"
                  value={s(row.slug)}
                  onChange={(e) => setRow({ slug: e.target.value })}
                  className={rowControl}
                />
              </>
            )}
          />
          <RowsEditor
            label="Open position"
            rows={objs(value.open_positions)}
            onChange={(v) => set({ open_positions: v })}
            blank={() => ({ role: ROLES[0], level: "Beginner", note: "" })}
            error={firstError(errors, "open_positions")}
            render={(row, setRow, i) => (
              <>
                <select
                  aria-label={`Position ${i + 1} role`}
                  value={s(row.role)}
                  onChange={(e) => setRow({ role: e.target.value })}
                  className={rowControl}
                >
                  {ROLES.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
                <input
                  aria-label={`Position ${i + 1} level`}
                  placeholder="Level"
                  value={s(row.level)}
                  onChange={(e) => setRow({ level: e.target.value })}
                  className={rowControl}
                />
                <input
                  aria-label={`Position ${i + 1} note`}
                  placeholder="Note"
                  value={s(row.note)}
                  onChange={(e) => setRow({ note: e.target.value })}
                  className={`${rowControl} sm:col-span-full`}
                />
              </>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Meets"
              maxLength={120}
              value={s(value.meets)}
              onChange={(v) => set({ meets: v })}
              error={errors.meets}
            />
            <TextInput
              label="Members (demo figure)"
              type="number"
              value={s(value.size)}
              onChange={(v) => set({ size: v === "" ? 0 : Number(v) })}
              error={errors.size}
            />
          </div>
          <Toggle
            label="Published"
            checked={b(value.published)}
            onChange={(v) => set({ published: v })}
          />
        </>
      )}
      emptyHint="The working teams listed on /teams under the core team."
      columns={[
        {
          head: "Team",
          cell: (r) => (
            <span className="font-medium text-ink">{s(r.name)}</span>
          ),
        },
        {
          head: "Open positions",
          cell: (r) => (
            <span className="tnum">{objs(r.open_positions).length}</span>
          ),
        },
      ]}
    />
  );
}

/* -------------------------------------------------------------------------- */

const KIND_OPTIONS = (
  Object.keys(ACTIVITY_KINDS) as (keyof typeof ACTIVITY_KINDS)[]
).map((k) => ({ value: k, label: ACTIVITY_KINDS[k] }));

const IMPORT_PROBLEM: Record<string, string> = {
  not_configured: "Set GITHUB_REPOS in Vercel to switch the import on.",
  v3_missing: "Run supabase/v3.sql in Supabase first.",
  content_not_loaded:
    "Load the activity log into the database from the Dashboard first.",
  github_failed:
    "GitHub did not answer. Check GITHUB_REPOS (and GITHUB_TOKEN for private repositories).",
};

/** Pulls recent commits from the club's repositories into the log. */
function GithubImport({ onImported }: { onImported: () => void }) {
  const toast = useToast();
  const [info, setInfo] = useState<{
    repos: string[];
    autoPublish: boolean;
    scheduled: boolean;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<{ repos: string[]; autoPublish: boolean; scheduled: boolean }>(
      "/api/admin/github-import",
    )
      .then(setInfo)
      .catch(() => setInfo(null));
  }, []);
  if (!info) return null;

  async function run() {
    setBusy(true);
    try {
      const r = await api<{
        ok: boolean;
        added?: number;
        reason?: string;
        detail?: string;
      }>("/api/admin/github-import", { method: "POST" });
      if (!r.ok)
        toast(
          "error",
          IMPORT_PROBLEM[r.reason ?? ""] ?? "The import did not run.",
        );
      else {
        toast(
          "ok",
          r.added
            ? `${r.added} new commit${r.added === 1 ? "" : "s"} imported${info!.autoPublish ? "" : " as hidden drafts — publish the ones worth showing"}.`
            : "Nothing new on GitHub.",
        );
        if (r.added) onImported();
      }
    } catch (e) {
      toast("error", explain(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-line bg-surface px-5 py-4">
      <div className="min-w-0 text-sm">
        <div className="font-medium text-ink">GitHub import</div>
        <p className="mt-1 text-ink-muted">
          {info.repos.length
            ? `Commits from ${info.repos.join(", ")} are added here${info.scheduled ? " every day" : " when you click Import"}${info.autoPublish ? " and shown straight away" : " as hidden drafts"}.`
            : IMPORT_PROBLEM.not_configured}
        </p>
      </div>
      {info.repos.length ? (
        <Btn onClick={run} disabled={busy}>
          {busy ? "Importing…" : "Import now"}
        </Btn>
      ) : null}
    </div>
  );
}

export function ActivityEditor() {
  const [reloadKey, setReloadKey] = useState(0);
  return (
    <>
      <GithubImport onImported={() => setReloadKey((k) => k + 1)} />
      <Collection
        reloadKey={reloadKey}
        resource="activity"
        previewPath={() => "/activity"}
        noun="activity entry"
        sortable
        label={(r) => s(r.text).slice(0, 60)}
        searchText={(r) => `${s(r.text)} ${s(r.actor)} ${s(r.kind)}`}
        toggle={{ key: "published", on: "Published", off: "Hidden" }}
        blank={() => ({
          kind: "build",
          text: "",
          actor: "",
          target_label: "",
          target_href: "",
          when_label: "Latest",
          day_label: "This week",
          published: true,
        })}
        Form={({ value, set, errors }) => (
          <>
            <Select
              label="Type"
              value={s(value.kind) as keyof typeof ACTIVITY_KINDS}
              onChange={(v) => set({ kind: v })}
              options={KIND_OPTIONS}
              error={errors.kind}
            />
            <TextArea
              label="What happened"
              required
              rows={3}
              maxLength={400}
              value={s(value.text)}
              onChange={(v) => set({ text: v })}
              error={errors.text}
            />
            <TextInput
              label="Who"
              hint="A team or project, e.g. Web Team."
              maxLength={80}
              value={s(value.actor)}
              onChange={(v) => set({ actor: v })}
              error={errors.actor}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Link label"
                maxLength={80}
                value={s(value.target_label)}
                onChange={(v) => set({ target_label: v })}
                error={errors.target_label}
              />
              <LinkInput
                label="Link destination"
                value={s(value.target_href)}
                onChange={(v) => set({ target_href: v })}
                error={errors.target_href}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="When"
                hint="Shown on the entry, e.g. Latest."
                maxLength={40}
                value={s(value.when_label)}
                onChange={(v) => set({ when_label: v })}
                error={errors.when_label}
              />
              <TextInput
                label="Group"
                hint="Entries are grouped by this, e.g. This week."
                maxLength={40}
                value={s(value.day_label)}
                onChange={(v) => set({ day_label: v })}
                error={errors.day_label}
              />
            </div>
            <Toggle
              label="Published"
              checked={b(value.published)}
              onChange={(v) => set({ published: v })}
            />
          </>
        )}
        emptyHint="Milestones shown on /activity, newest first in the order listed here."
        columns={[
          {
            head: "Type",
            cell: (r) => (
              <span className="font-mono text-micro uppercase">
                {ACTIVITY_KINDS[s(r.kind) as keyof typeof ACTIVITY_KINDS] ??
                  s(r.kind)}
              </span>
            ),
          },
          {
            head: "Entry",
            cell: (r) => (
              <span className="line-clamp-2 text-ink">{s(r.text)}</span>
            ),
          },
          { head: "Group", cell: (r) => s(r.day_label) },
        ]}
      />
    </>
  );
}
