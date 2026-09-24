"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DOMAINS, ROLES, STATUSES } from "@/data/taxonomy";
import { MILESTONE_STATES } from "@/lib/cms/types";
import { api } from "./api";
import { Checkboxes, Part, ListField, RowsEditor, Select, TextArea, TextInput, Toggle, firstError, rowControl } from "./kit";
import { ImageField } from "./media";
import { Collection, b, list, s, type FormProps } from "./Collection";

type Member = { id: string; name: string };
type ProblemOption = { slug: string; title: string };


const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);


export function ProjectsEditor() {
  const [members, setMembers] = useState<Member[]>([]);
  const [problems, setProblems] = useState<ProblemOption[]>([]);
  useEffect(() => {
    api<{ rows: Member[] }>("/api/admin/cms/team")
      .then((b) => setMembers(b.rows))
      .catch(() => {});
    api<{ rows: ProblemOption[] }>("/api/admin/cms/problem-options")
      .then((b) => setProblems(b.rows))
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
          <Checkboxes label="Domains" options={DOMAINS} value={domains} onChange={(v) => set({ domains: v })} error={errors.domains} />
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
            rows={(value.timeline as Record<string, unknown>[]) ?? []}
            onChange={(v) => set({ timeline: v })}
            blank={() => ({ phase: "", state: "next", detail: "" })}
            error={firstError(errors, "timeline")}
            max={12}
            render={(row, setRow, i) => (
              <>
                <input aria-label={`Milestone ${i + 1} phase`} placeholder="Phase" value={s(row.phase)} onChange={(e) => setRow({ phase: e.target.value })} className={rowControl} />
                <select aria-label={`Milestone ${i + 1} state`} value={s(row.state)} onChange={(e) => setRow({ state: e.target.value })} className={rowControl}>
                  {MILESTONE_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <input aria-label={`Milestone ${i + 1} detail`} placeholder="Detail" value={s(row.detail)} onChange={(e) => setRow({ detail: e.target.value })} className={`${rowControl} sm:col-span-full`} />
              </>
            )}
          />
        </Part>

        <Part title="Open roles">
          <RowsEditor
            label="Open role"
            rows={(value.open_roles as Record<string, unknown>[]) ?? []}
            onChange={(v) => set({ open_roles: v })}
            blank={() => ({ role: "Frontend", level: "Beginner", what: "" })}
            error={firstError(errors, "open_roles")}
            render={(row, setRow, i) => (
              <>
                <select aria-label={`Open role ${i + 1} skill`} value={s(row.role)} onChange={(e) => setRow({ role: e.target.value })} className={rowControl}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <input aria-label={`Open role ${i + 1} level`} placeholder="Level" value={s(row.level)} onChange={(e) => setRow({ level: e.target.value })} className={rowControl} />
                <input aria-label={`Open role ${i + 1} description`} placeholder="What the work is" value={s(row.what)} onChange={(e) => setRow({ what: e.target.value })} className={`${rowControl} sm:col-span-full`} />
              </>
            )}
          />
        </Part>

        <Part title="Team">
          <p className="-mt-2 text-xs text-ink-faint">Pick a listed team member, or type any name. Use “Open” for a role that still needs someone.</p>
          <RowsEditor
            label="Team member"
            rows={(value.members as Record<string, unknown>[]) ?? []}
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
                  className={rowControl}
                >
                  <option value="">Not a listed member</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <input aria-label={`Team member ${i + 1} name`} placeholder="Name" value={s(row.name)} onChange={(e) => setRow({ name: e.target.value })} className={rowControl} />
                <input aria-label={`Team member ${i + 1} role`} placeholder="Role on this project" value={s(row.role)} onChange={(e) => setRow({ role: e.target.value })} className={rowControl} />
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
