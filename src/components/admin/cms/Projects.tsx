"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DOMAINS, ROLES, STATUSES } from "@/data/taxonomy";
import { problems } from "@/data/problems";
import { MILESTONE_STATES } from "@/lib/cms/types";
import { api } from "./api";
import { Btn, ListField, MoveButtons, Select, TextArea, TextInput, Toggle } from "./kit";
import { ImageField } from "./media";
import { Collection, b, list, s, type FormProps } from "./Collection";

type Member = { id: string; name: string };
type Obj = Record<string, unknown>;

const control =
  "w-full border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-ghost focus:border-acm focus:outline-none";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-5 border-t border-line pt-6 first:border-t-0 first:pt-0">
      <h3 className="font-mono text-label uppercase text-ink">{title}</h3>
      {children}
    </section>
  );
}

/** An ordered list of small records (timeline, open roles, team) with add/move/remove. */
function RowsEditor({
  label,
  rows,
  onChange,
  blank,
  render,
  error,
  max = 20,
}: {
  label: string;
  rows: Obj[];
  onChange: (rows: Obj[]) => void;
  blank: () => Obj;
  render: (row: Obj, set: (p: Obj) => void, i: number) => ReactNode;
  error?: string;
  max?: number;
}) {
  const move = (i: number, d: -1 | 1) => {
    const next = [...rows];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <fieldset>
      <legend className="sr-only">{label}</legend>
      <ul className="space-y-2">
        {rows.map((row, i) => (
          <li key={i} className="flex items-start gap-1 border border-line bg-surface/50 p-2">
            <div className="grid flex-1 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(8rem,1fr))]">
              {render(row, (p) => onChange(rows.map((r, j) => (j === i ? { ...r, ...p } : r))), i)}
            </div>
            <MoveButtons
              label={`${label} ${i + 1}`}
              onUp={i > 0 ? () => move(i, -1) : undefined}
              onDown={i < rows.length - 1 ? () => move(i, 1) : undefined}
            />
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, j) => j !== i))}
              aria-label={`Remove ${label} ${i + 1}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center text-ink-faint hover:text-acm-bright"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      {rows.length < max ? (
        <Btn size="sm" className="mt-2" onClick={() => onChange([...rows, blank()])}>
          + Add
        </Btn>
      ) : null}
      {error ? <p className="mt-1.5 text-xs font-medium text-acm-bright">{error}</p> : null}
    </fieldset>
  );
}

/** Nested errors come back keyed like "timeline.2.phase"; show the first per list. */
function firstError(errors: Record<string, string>, prefix: string) {
  const key = Object.keys(errors).find((k) => k === prefix || k.startsWith(`${prefix}.`));
  if (!key) return undefined;
  const m = key.match(/\.(\d+)\.(\w+)$/);
  return m ? `Row ${Number(m[1]) + 1}, ${m[2].replace("_", " ")}: ${errors[key]}` : errors[key];
}

export function ProjectsEditor() {
  const [members, setMembers] = useState<Member[]>([]);
  useEffect(() => {
    api<{ rows: Member[] }>("/api/admin/cms/team")
      .then((b) => setMembers(b.rows))
      .catch(() => {});
  }, []);

  function ProjectForm({ value, set, errors }: FormProps) {
    const domains = list(value.domains);
    return (
      <>
        <Part title="Basics">
          <TextInput
            label="Title"
            required
            maxLength={120}
            value={s(value.name)}
            onChange={(v) => set({ name: v, ...(value._slugTouched ? {} : { slug: slugify(v) }) })}
            error={errors.name}
          />
          <TextInput
            label="Slug"
            required
            hint={`Page address: /projects/${s(value.slug) || "slug"}`}
            value={s(value.slug)}
            onChange={(v) => set({ slug: v, _slugTouched: true })}
            error={errors.slug}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Category" maxLength={60} value={s(value.category)} onChange={(v) => set({ category: v })} error={errors.category} placeholder="AI / Software" />
            <Select
              label="Status"
              value={s(value.status) as keyof typeof STATUSES}
              onChange={(v) => set({ status: v })}
              options={(Object.keys(STATUSES) as (keyof typeof STATUSES)[]).map((k) => ({ value: k, label: STATUSES[k].label }))}
              error={errors.status}
            />
          </div>
          <TextArea label="Summary" required rows={3} maxLength={400} value={s(value.summary)} onChange={(v) => set({ summary: v })} error={errors.summary} hint="One or two sentences for cards and search." />
          <TextArea label="The problem" rows={4} maxLength={1500} value={s(value.problem)} onChange={(v) => set({ problem: v })} error={errors.problem} />
          <Select
            label="Linked problem statement"
            value={s(value.problem_slug)}
            onChange={(v) => set({ problem_slug: v || null })}
            options={problems.map((p) => ({ value: p.slug, label: p.title }))}
            placeholder="None"
            error={errors.problem_slug}
          />
          <ImageField label="Project image" use="cover" value={(value.image_url as string) ?? null} onChange={(v) => set({ image_url: v })} error={errors.image_url} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Live link" value={s(value.live_url)} onChange={(v) => set({ live_url: v })} error={errors.live_url} placeholder="https://…" />
            <TextInput label="Source code link" value={s(value.repo_url)} onChange={(v) => set({ repo_url: v })} error={errors.repo_url} placeholder="https://github.com/…" />
          </div>
          <TextInput label="Progress (%)" type="number" value={s(value.progress)} onChange={(v) => set({ progress: v === "" ? 0 : Number(v) })} error={errors.progress} />
          <Toggle label="Featured" hint="Featured projects appear in “What we build” on the homepage." checked={b(value.featured)} onChange={(v) => set({ featured: v })} />
          <Toggle label="Published" hint="Drafts are not shown anywhere on the public site." checked={b(value.published)} onChange={(v) => set({ published: v })} />
        </Part>

        <Part title="Domains & technologies">
          <fieldset>
            <legend className="font-mono text-label uppercase text-ink-muted">Domains</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {DOMAINS.map((d) => {
                const on = domains.includes(d);
                return (
                  <label key={d} className={`flex cursor-pointer items-center gap-2 border px-3 py-1.5 text-sm ${on ? "border-acm text-ink" : "border-line text-ink-muted"}`}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => set({ domains: on ? domains.filter((x) => x !== d) : [...domains, d] })}
                      className="accent-[rgb(var(--acm))]"
                    />
                    {d}
                  </label>
                );
              })}
            </div>
            {errors.domains ? <p className="mt-1.5 text-xs font-medium text-acm-bright">{errors.domains}</p> : null}
          </fieldset>
          <ListField label="Technologies" items={list(value.technologies)} onChange={(v) => set({ technologies: v })} error={errors.technologies} placeholder="e.g. Next.js" />
        </Part>

        <Part title="Detail page">
          <ListField label="What we’re building" multiline items={list(value.building)} onChange={(v) => set({ building: v })} error={errors.building} max={12} />
          <ListField label="What exists today" multiline items={list(value.exists_now)} onChange={(v) => set({ exists_now: v })} error={errors.exists_now} max={12} />
          <ListField label="What does not exist yet" multiline items={list(value.not_yet)} onChange={(v) => set({ not_yet: v })} error={errors.not_yet} max={12} />
          <ListField label="How to contribute" multiline items={list(value.contribute)} onChange={(v) => set({ contribute: v })} error={errors.contribute} max={12} />
        </Part>

        <Part title="Timeline">
          <RowsEditor
            label="Milestone"
            rows={(value.timeline as Obj[]) ?? []}
            onChange={(v) => set({ timeline: v })}
            blank={() => ({ phase: "", state: "next", detail: "" })}
            error={firstError(errors, "timeline")}
            max={12}
            render={(row, setRow, i) => (
              <>
                <input aria-label={`Milestone ${i + 1} phase`} placeholder="Phase" value={s(row.phase)} onChange={(e) => setRow({ phase: e.target.value })} className={`${control} h-9`} />
                <select aria-label={`Milestone ${i + 1} state`} value={s(row.state)} onChange={(e) => setRow({ state: e.target.value })} className={`${control} h-9`}>
                  {MILESTONE_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <input aria-label={`Milestone ${i + 1} detail`} placeholder="Detail" value={s(row.detail)} onChange={(e) => setRow({ detail: e.target.value })} className={`${control} h-9 sm:col-span-full`} />
              </>
            )}
          />
        </Part>

        <Part title="Open roles">
          <RowsEditor
            label="Open role"
            rows={(value.open_roles as Obj[]) ?? []}
            onChange={(v) => set({ open_roles: v })}
            blank={() => ({ role: "Frontend", level: "Beginner", what: "" })}
            error={firstError(errors, "open_roles")}
            render={(row, setRow, i) => (
              <>
                <select aria-label={`Open role ${i + 1} skill`} value={s(row.role)} onChange={(e) => setRow({ role: e.target.value })} className={`${control} h-9`}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <input aria-label={`Open role ${i + 1} level`} placeholder="Level" value={s(row.level)} onChange={(e) => setRow({ level: e.target.value })} className={`${control} h-9`} />
                <input aria-label={`Open role ${i + 1} description`} placeholder="What the work is" value={s(row.what)} onChange={(e) => setRow({ what: e.target.value })} className={`${control} h-9 sm:col-span-full`} />
              </>
            )}
          />
        </Part>

        <Part title="Team">
          <p className="-mt-2 text-xs text-ink-faint">Pick a listed team member, or type any name. Use “Open” for a role that still needs someone.</p>
          <RowsEditor
            label="Team member"
            rows={(value.members as Obj[]) ?? []}
            onChange={(v) => set({ members: v })}
            blank={() => ({ member_id: null, name: "", role: "" })}
            error={firstError(errors, "members")}
            max={30}
            render={(row, setRow, i) => (
              <>
                <select
                  aria-label={`Team member ${i + 1} link`}
                  value={s(row.member_id)}
                  onChange={(e) => {
                    const m = members.find((x) => x.id === e.target.value);
                    setRow({ member_id: m?.id ?? null, ...(m ? { name: m.name } : {}) });
                  }}
                  className={`${control} h-9`}
                >
                  <option value="">Not a listed member</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <input aria-label={`Team member ${i + 1} name`} placeholder="Name" value={s(row.name)} onChange={(e) => setRow({ name: e.target.value })} className={`${control} h-9`} />
                <input aria-label={`Team member ${i + 1} role`} placeholder="Role on this project" value={s(row.role)} onChange={(e) => setRow({ role: e.target.value })} className={`${control} h-9`} />
              </>
            )}
          />
        </Part>
      </>
    );
  }

  return (
    <Collection
      resource="projects"
      noun="project"
      sortable
      label={(r) => s(r.name)}
      searchText={(r) => `${s(r.name)} ${s(r.category)} ${list(r.domains).join(" ")}`}
      toggle={{ key: "published", on: "Published", off: "Draft" }}
      blank={() => ({
        name: "",
        slug: "",
        category: "",
        status: "proposed",
        summary: "",
        problem: "",
        problem_slug: null,
        image_url: null,
        repo_url: "",
        live_url: "",
        progress: 0,
        featured: false,
        published: false,
        domains: [],
        technologies: [],
        building: [],
        exists_now: [],
        not_yet: [],
        contribute: [],
        timeline: [],
        open_roles: [],
        members: [],
      })}
      toDraft={(r) => ({ ...r, _slugTouched: true })}
      fromDraft={({ _slugTouched, ...d }) => d}
      Form={ProjectForm}
      emptyHint="Published projects appear on /projects. Proposals from the public stay in Submissions until you publish a project here."
      columns={[
        { head: "Project", cell: (r) => <span className="font-medium text-ink">{s(r.name)}</span> },
        { head: "Status", cell: (r) => <span className="font-mono text-micro uppercase">{STATUSES[s(r.status) as keyof typeof STATUSES]?.label ?? s(r.status)}</span> },
        { head: "Featured", cell: (r) => (r.featured ? "Yes" : "—") },
      ]}
    />
  );
}
