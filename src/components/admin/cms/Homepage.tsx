"use client";

import { useCallback, useEffect, useState } from "react";
import type { SectionKey } from "@/lib/cms/types";
import { api, ApiError, explain } from "./api";
import { Btn, Drawer, ErrorState, LinkInput, ListField, LoadingRows, MoveButtons, Pill, TextArea, TextInput, useCms, useToast } from "./kit";
import { ImageField } from "./media";
import { list, s, type Draft, type Errors } from "./Collection";

type Field = "eyebrow" | "title" | "subtitle" | "body" | "note" | "primary" | "secondary" | "primary_label" | "image" | "hero_extra";

type SectionUi = {
  name: string;
  about: string;
  fields: Field[];
  labels?: Partial<Record<Field, string>>;
  hints?: Partial<Record<Field, string>>;
};

const HEADLINE_HINT = "Put each line of the headline on its own line.";

/** Which fields each section actually renders, and what they are called there. */
const SECTIONS: Record<SectionKey, SectionUi> = {
  hero: {
    name: "Hero",
    about: "The top of the homepage. Always shown. Leave any field empty to hide that element.",
    fields: ["eyebrow", "title", "subtitle", "body", "primary", "secondary", "hero_extra", "image"],
    labels: { title: "Main heading", subtitle: "Subtitle", body: "Description", image: "Hero image" },
    hints: { subtitle: "Short lines beside the description; one per line.", image: "Replaces the pipeline graphic when set." },
  },
  announcements: {
    name: "Announcements",
    about: "A notice strip under the hero. Items are managed under Announcements; hidden when none are published.",
    fields: ["eyebrow"],
    labels: { eyebrow: "Strip label" },
  },
  what_we_build: {
    name: "What we build",
    about: "Shows the projects marked Featured.",
    fields: ["eyebrow", "title", "body", "subtitle", "note", "primary"],
    labels: { body: "Description", subtitle: "Small print under the description", note: "Note box", primary: "Link" },
  },
  problem_lab: {
    name: "Problem Lab",
    about: "Introduces the problem statements. The last headline line is set in the accent colour.",
    fields: ["eyebrow", "title", "body", "subtitle", "primary", "note"],
    labels: { subtitle: "Emphasis line", primary: "Link", note: "Small print" },
  },
  problem_of_the_week: {
    name: "Problem of the week",
    about: "Picks a problem automatically each week.",
    fields: ["eyebrow", "subtitle", "primary_label"],
    labels: { subtitle: "Badge text", primary_label: "Button text" },
  },
  events: {
    name: "Events",
    about: "The next three events. Hidden automatically when nothing is coming up.",
    fields: ["eyebrow", "title", "body", "primary"],
    labels: { primary: "Link" },
  },
  difficulty: {
    name: "Difficulty system",
    about: "The four levels. Also shown on the Problem Lab page.",
    fields: ["eyebrow", "title", "body"],
  },
  ideas: { name: "Project ideas", about: "The first six project ideas.", fields: ["eyebrow", "title", "body", "primary"], labels: { primary: "Link" } },
  contribution: {
    name: "Contribution",
    about: "What a contribution record holds.",
    fields: ["eyebrow", "title", "body", "primary", "note"],
    labels: { primary: "Link", note: "Small print" },
  },
  recruit: {
    name: "Recruit",
    about: "Call to action. Also shown on the Projects and Project Ideas pages. The last headline line is set fainter.",
    fields: ["title", "body", "primary", "secondary"],
  },
  final_cta: {
    name: "Closing statement",
    about: "The end of the homepage. The words beneath it are the Pillars in Site Settings.",
    fields: ["title", "subtitle", "body"],
    labels: { title: "First headline", subtitle: "Second headline" },
    hints: { subtitle: `${HEADLINE_HINT} The last line is set in the accent colour.` },
  },
};

type Row = Draft & { key: SectionKey; enabled: boolean; sort: number };

export function HomepageEditor() {
  const toast = useToast();
  const { status } = useCms();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setRows((await api<{ rows: Row[] }>("/api/admin/cms/sections")).rows);
    } catch (e) {
      setLoadError(e);
    }
  }, []);

  useEffect(() => {
    if (status === "ready") load();
  }, [status, load]);

  const [stale, setStale] = useState<Row | null>(null);

  // `updated_at` travels back as the expected version, so a section someone
  // else saved in the meantime is not silently overwritten.
  async function put(row: Row, overwrite = false) {
    return api<{ row: Row }>(`/api/admin/cms/sections/${row.key}`, {
      method: "PUT",
      json: { ...row, _expected_updated_at: overwrite ? undefined : row.updated_at },
    });
  }

  async function save(overwrite = false) {
    if (!editing) return;
    setSaving(true);
    setErrors({});
    try {
      await put(editing, overwrite);
      setStale(null);
      toast("ok", `${SECTIONS[editing.key].name} is updated on the homepage.`);
      setEditing(null);
      await load();
    } catch (e) {
      if (e instanceof ApiError && e.code === "invalid") setErrors(e.errors);
      if (e instanceof ApiError && e.code === "stale") setStale(e.extra.current as Row);
      toast("error", explain(e));
    } finally {
      setSaving(false);
    }
  }

  async function flip(row: Row) {
    setBusy(row.key);
    try {
      const { row: saved } = await put({ ...row, enabled: !row.enabled });
      setRows((rs) => rs?.map((r) => (r.key === row.key ? { ...r, ...saved } : r)) ?? null);
      toast("ok", `${SECTIONS[row.key].name} is now ${row.enabled ? "hidden" : "shown"}.`);
    } catch (e) {
      if (e instanceof ApiError && e.code === "stale") load();
      toast("error", explain(e));
    } finally {
      setBusy(null);
    }
  }

  async function move(index: number, delta: -1 | 1) {
    if (!rows) return;
    const next = [...rows];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    const previous = rows;
    setRows(next);
    try {
      await api("/api/admin/cms/sections/reorder", { method: "POST", json: { keys: next.map((r) => r.key) } });
    } catch (e) {
      setRows(previous);
      toast("error", explain(e));
    }
  }

  if (loadError) return <ErrorState error={loadError} retry={load} />;
  if (!rows) return <LoadingRows rows={8} />;

  return (
    <>
      <ol className="border border-line">
        {rows.map((row, i) => {
          const ui = SECTIONS[row.key];
          const pinned = row.key === "hero";
          return (
            <li key={row.key} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-3 py-3 last:border-b-0">
              <span className="w-16">
                {pinned ? (
                  <span className="px-2 font-mono text-micro uppercase text-ink-ghost">First</span>
                ) : (
                  <MoveButtons
                    label={ui.name}
                    onUp={i > 1 ? () => move(i, -1) : undefined}
                    onDown={i < rows.length - 1 ? () => move(i, 1) : undefined}
                  />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-ink">{ui.name}</span>
                <span className="block truncate text-xs text-ink-faint">{s(row.title).split("\n")[0] || ui.about}</span>
              </span>
              {pinned ? (
                <Pill on>Always shown</Pill>
              ) : (
                <button
                  type="button"
                  onClick={() => flip(row)}
                  disabled={busy === row.key}
                  aria-label={`${row.enabled ? "Shown" : "Hidden"} — ${row.enabled ? "hide" : "show"} ${ui.name}`}
                  className="disabled:opacity-50"
                >
                  <Pill on={row.enabled}>{row.enabled ? "Shown" : "Hidden"}</Pill>
                </button>
              )}
              <Btn
                size="sm"
                tone="ghost"
                onClick={() => {
                  setErrors({});
                  setStale(null);
                  setEditing(row);
                }}
                aria-label={`Edit ${ui.name}`}
              >
                Edit
              </Btn>
            </li>
          );
        })}
      </ol>

      <Drawer
        open={editing !== null}
        title={editing ? `Edit section · ${SECTIONS[editing.key].name}` : ""}
        onClose={() => setEditing(null)}
        footer={
          <>
            <Btn onClick={() => setEditing(null)}>Cancel</Btn>
            <Btn tone="primary" onClick={() => save()} disabled={saving}>
              {saving ? "Saving…" : "Save section"}
            </Btn>
          </>
        }
      >
        {editing ? (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            {stale ? (
              <StaleNotice
                onLoad={() => {
                  setEditing(stale);
                  setStale(null);
                  load();
                }}
                onOverwrite={() => save(true)}
                busy={saving}
              />
            ) : null}
            <p className="text-sm text-ink-muted">{SECTIONS[editing.key].about}</p>
            <SectionFields ui={SECTIONS[editing.key]} value={editing} set={(p) => setEditing((r) => (r ? ({ ...r, ...p } as Row) : r))} errors={errors} />
          </form>
        ) : null}
      </Drawer>
    </>
  );
}

function SectionFields({ ui, value, set, errors }: { ui: SectionUi; value: Row; set: (p: Draft) => void; errors: Errors }) {
  const has = (f: Field) => ui.fields.includes(f);
  const label = (f: Field, fallback: string) => ui.labels?.[f] ?? fallback;
  const extra = (value.extra ?? {}) as Record<string, unknown>;
  const setExtra = (p: Record<string, unknown>) => set({ extra: { ...extra, ...p } });

  return (
    <>
      {has("eyebrow") ? (
        <TextInput label={label("eyebrow", "Eyebrow")} hint="Small label above the headline." value={s(value.eyebrow)} onChange={(v) => set({ eyebrow: v })} error={errors.eyebrow} maxLength={60} />
      ) : null}
      {has("hero_extra") ? (
        <TextInput label="Badge" hint="Small text after the eyebrow." value={s(extra.badge)} onChange={(v) => setExtra({ badge: v })} error={errors["extra.badge"]} maxLength={60} />
      ) : null}
      {has("title") ? (
        <TextArea label={label("title", "Title")} hint={ui.hints?.title ?? HEADLINE_HINT} rows={3} value={s(value.title)} onChange={(v) => set({ title: v })} error={errors.title} maxLength={200} />
      ) : null}
      {has("subtitle") ? (
        <TextArea label={label("subtitle", "Subtitle")} hint={ui.hints?.subtitle} rows={2} value={s(value.subtitle)} onChange={(v) => set({ subtitle: v })} error={errors.subtitle} maxLength={200} />
      ) : null}
      {has("body") ? (
        <TextArea label={label("body", "Description")} rows={4} value={s(value.body)} onChange={(v) => set({ body: v })} error={errors.body} maxLength={800} />
      ) : null}
      {has("note") ? (
        <TextArea label={label("note", "Note")} rows={3} value={s(value.note)} onChange={(v) => set({ note: v })} error={errors.note} maxLength={400} />
      ) : null}
      {has("primary_label") ? (
        <TextInput label={label("primary_label", "Button text")} value={s(value.primary_label)} onChange={(v) => set({ primary_label: v })} error={errors.primary_label} maxLength={40} />
      ) : null}
      {has("primary") ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label={`${label("primary", "Primary button")} text`} value={s(value.primary_label)} onChange={(v) => set({ primary_label: v })} error={errors.primary_label} maxLength={40} />
          <LinkInput label={`${label("primary", "Primary button")} link`} value={s(value.primary_href)} onChange={(v) => set({ primary_href: v })} error={errors.primary_href} />
        </div>
      ) : null}
      {has("secondary") ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Secondary button text" value={s(value.secondary_label)} onChange={(v) => set({ secondary_label: v })} error={errors.secondary_label} maxLength={40} />
          <LinkInput label="Secondary button link" value={s(value.secondary_href)} onChange={(v) => set({ secondary_href: v })} error={errors.secondary_href} />
        </div>
      ) : null}
      {has("hero_extra") ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Text link" hint="The underlined third link." value={s(extra.tertiary_label)} onChange={(v) => setExtra({ tertiary_label: v })} error={errors["extra.tertiary_label"]} maxLength={60} />
            <LinkInput label="Text link destination" value={s(extra.tertiary_href)} onChange={(v) => setExtra({ tertiary_href: v })} error={errors["extra.tertiary_href"]} />
          </div>
          <ListField label="Focus areas" hint="The strip along the bottom of the hero. Up to 8 read best." items={list(extra.focus)} onChange={(v) => setExtra({ focus: v })} error={errors["extra.focus"]} max={12} />
        </>
      ) : null}
      {has("image") ? (
        <ImageField label={label("image", "Image")} use="cover" value={(value.image_url as string) ?? null} onChange={(v) => set({ image_url: v })} error={errors.image_url} hint={ui.hints?.image} />
      ) : null}
    </>
  );
}

function StaleNotice({ onLoad, onOverwrite, busy }: { onLoad: () => void; onOverwrite: () => void; busy: boolean }) {
  return (
    <div role="alert" className="border border-acm/60 bg-acm-wash px-4 py-3 text-sm text-ink-muted">
      <p className="font-medium text-ink">Someone else saved this after you opened it.</p>
      <p className="mt-1">Saving now would overwrite their changes. Choose which version to keep.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Btn size="sm" onClick={onLoad}>
          Load their version
        </Btn>
        <Btn size="sm" tone="danger" onClick={onOverwrite} disabled={busy}>
          Keep mine and overwrite
        </Btn>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page headers                                                                */
/* -------------------------------------------------------------------------- */

const PAGES: Record<string, { name: string; path: string; note?: string; accent?: boolean }> = {
  page_projects: { name: "Projects", path: "/projects" },
  page_problems: { name: "Problem Lab", path: "/problems", accent: true },
  page_submit: { name: "Submit a problem", path: "/problems/submit" },
  page_ideas: { name: "Project ideas", path: "/ideas" },
  page_research: { name: "Research", path: "/research" },
  page_teams: { name: "Teams", path: "/teams" },
  page_teams_core: { name: "Teams · core team block", path: "/teams" },
  page_activity: { name: "Activity", path: "/activity", note: "Small print under the header" },
  page_events: { name: "Events", path: "/events" },
  page_join: { name: "Join", path: "/join" },
  page_discover: { name: "Find your project", path: "/discover" },
};

/** The header (eyebrow, headline, lede) of every other public page. */
export function PagesEditor() {
  const toast = useToast();
  const { status } = useCms();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [stale, setStale] = useState<Row | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setRows((await api<{ rows: Row[] }>("/api/admin/cms/sections?pages=1")).rows);
    } catch (e) {
      setLoadError(e);
    }
  }, []);

  useEffect(() => {
    if (status === "ready") load();
  }, [status, load]);

  async function save(overwrite = false) {
    if (!editing) return;
    setSaving(true);
    setErrors({});
    try {
      await api(`/api/admin/cms/sections/${editing.key}`, {
        method: "PUT",
        json: { ...editing, _expected_updated_at: overwrite ? undefined : editing.updated_at },
      });
      toast("ok", `The ${PAGES[editing.key]?.name ?? "page"} header is live.`);
      setEditing(null);
      setStale(null);
      await load();
    } catch (e) {
      if (e instanceof ApiError && e.code === "invalid") setErrors(e.errors);
      if (e instanceof ApiError && e.code === "stale") setStale(e.extra.current as Row);
      toast("error", explain(e));
    } finally {
      setSaving(false);
    }
  }

  if (loadError) return <ErrorState error={loadError} retry={load} />;
  if (!rows) return <LoadingRows rows={8} />;

  const ui = editing ? PAGES[editing.key] : undefined;

  return (
    <>
      <ul className="border border-line">
        {rows.map((row) => {
          const meta = PAGES[row.key] ?? { name: row.key, path: "" };
          return (
            <li key={row.key} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-4 py-3 last:border-b-0">
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-ink">{meta.name}</span>
                <span className="block truncate text-xs text-ink-faint">
                  <code className="font-mono">{meta.path}</code> · {s(row.title).split("\n")[0]}
                </span>
              </span>
              <Btn
                size="sm"
                tone="ghost"
                onClick={() => {
                  setErrors({});
                  setStale(null);
                  setEditing(row);
                }}
                aria-label={`Edit ${meta.name} header`}
              >
                Edit
              </Btn>
            </li>
          );
        })}
      </ul>

      <Drawer
        open={editing !== null}
        title={ui ? `Edit page · ${ui.name}` : ""}
        onClose={() => setEditing(null)}
        footer={
          <>
            <Btn onClick={() => setEditing(null)}>Cancel</Btn>
            <Btn tone="primary" onClick={() => save()} disabled={saving}>
              {saving ? "Saving…" : "Save header"}
            </Btn>
          </>
        }
      >
        {editing ? (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            {stale ? (
              <StaleNotice
                onLoad={() => {
                  setEditing(stale);
                  setStale(null);
                  load();
                }}
                onOverwrite={() => save(true)}
                busy={saving}
              />
            ) : null}
            <TextInput label="Eyebrow" value={s(editing.eyebrow)} onChange={(v) => setEditing({ ...editing, eyebrow: v })} error={errors.eyebrow} maxLength={60} />
            <TextArea
              label="Headline"
              hint={ui?.accent ? `${HEADLINE_HINT} The last line is set in the accent colour.` : HEADLINE_HINT}
              rows={3}
              value={s(editing.title)}
              onChange={(v) => setEditing({ ...editing, title: v })}
              error={errors.title}
              maxLength={200}
            />
            <TextArea label="Introduction" rows={4} value={s(editing.body)} onChange={(v) => setEditing({ ...editing, body: v })} error={errors.body} maxLength={800} />
            {ui?.note ? (
              <TextArea label={ui.note} rows={3} value={s(editing.note)} onChange={(v) => setEditing({ ...editing, note: v })} error={errors.note} maxLength={400} />
            ) : null}
          </form>
        ) : null}
      </Drawer>
    </>
  );
}
