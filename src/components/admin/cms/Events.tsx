"use client";

import { EVENT_STATUSES } from "@/lib/cms/types";
import { eventWhen, noticeDate } from "@/lib/cms/format";
import { LinkInput, Select, TextArea, TextInput, Toggle } from "./kit";
import { ImageField } from "./media";
import { Collection, b, s, type Draft, type FormProps } from "./Collection";

/** ISO timestamp ↔ the browser's datetime-local value, in the editor's own clock. */
function toLocal(iso: unknown): string {
  if (typeof iso !== "string" || !iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocal(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

function EventForm({ value, set, errors }: FormProps) {
  return (
    <>
      <TextInput
        label="Title"
        required
        maxLength={120}
        value={s(value.title)}
        onChange={(v) => set({ title: v, ...(value._slugTouched ? {} : { slug: slugify(v) }) })}
        error={errors.title}
      />
      <TextInput
        label="Slug"
        required
        hint="Used in the page anchor: /events#slug. Lowercase, numbers and dashes."
        value={s(value.slug)}
        onChange={(v) => set({ slug: v, _slugTouched: true })}
        error={errors.slug}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Starts" required type="datetime-local" value={s(value.starts_local)} onChange={(v) => set({ starts_local: v })} error={errors.starts_at} />
        <TextInput label="Ends" type="datetime-local" value={s(value.ends_local)} onChange={(v) => set({ ends_local: v })} error={errors.ends_at} hint="Optional" />
      </div>
      <p className="-mt-2 text-xs text-ink-faint">Times are entered in your computer’s clock and shown to visitors in India Standard Time.</p>
      <TextInput label="Location" maxLength={160} value={s(value.location)} onChange={(v) => set({ location: v })} error={errors.location} placeholder="Room, building or online" />
      <TextArea label="Description" rows={5} maxLength={2000} value={s(value.description)} onChange={(v) => set({ description: v })} error={errors.description} />
      <TextInput label="Registration link" value={s(value.registration_url)} onChange={(v) => set({ registration_url: v })} error={errors.registration_url} placeholder="https://…" hint="Shown as a Register button while the event is upcoming or ongoing." />
      <Select
        label="Status"
        value={s(value.status) as (typeof EVENT_STATUSES)[number]}
        onChange={(v) => set({ status: v })}
        options={EVENT_STATUSES.map((st) => ({ value: st, label: st[0].toUpperCase() + st.slice(1) }))}
        error={errors.status}
      />
      <ImageField label="Event image" use="cover" value={(value.image_url as string) ?? null} onChange={(v) => set({ image_url: v })} error={errors.image_url} />
      <Toggle label="Published" hint="Drafts stay here and are not shown on the site." checked={b(value.published)} onChange={(v) => set({ published: v })} />
    </>
  );
}

export function EventsEditor() {
  return (
    <Collection
      resource="events"
      noun="event"
      sortable
      label={(r) => s(r.title)}
      searchText={(r) => `${s(r.title)} ${s(r.location)} ${s(r.status)}`}
      toggle={{ key: "published", on: "Published", off: "Draft" }}
      blank={() => ({
        title: "",
        slug: "",
        starts_local: "",
        ends_local: "",
        location: "",
        description: "",
        registration_url: "",
        image_url: null,
        status: "upcoming",
        published: false,
      })}
      toDraft={(r) => ({ ...r, starts_local: toLocal(r.starts_at), ends_local: toLocal(r.ends_at), _slugTouched: true })}
      fromDraft={(d: Draft) => {
        const { starts_local, ends_local, _slugTouched, ...rest } = d;
        return { ...rest, starts_at: fromLocal(starts_local), ends_at: fromLocal(ends_local) };
      }}
      Form={EventForm}
      emptyHint="Events appear on /events and, while upcoming, on the homepage."
      columns={[
        { head: "Event", cell: (r) => <span className="font-medium text-ink">{s(r.title)}</span> },
        { head: "When", cell: (r) => <span className="text-xs">{eventWhen(s(r.starts_at), (r.ends_at as string) ?? null)}</span> },
        { head: "State", cell: (r) => <span className="font-mono text-micro uppercase">{s(r.status)}</span> },
      ]}
    />
  );
}

function AnnouncementForm({ value, set, errors }: FormProps) {
  return (
    <>
      <TextInput label="Title" required maxLength={140} value={s(value.title)} onChange={(v) => set({ title: v })} error={errors.title} />
      <TextArea label="Details" rows={3} maxLength={400} value={s(value.body)} onChange={(v) => set({ body: v })} error={errors.body} hint="Optional. One short sentence." />
      <LinkInput label="Link" value={s(value.link_url)} onChange={(v) => set({ link_url: v })} error={errors.link_url} hint="Optional. A page on this site or a full https:// address." />
      <TextInput label="Date" type="date" required value={s(value.date)} onChange={(v) => set({ date: v })} error={errors.date} />
      <Toggle label="Published" hint="Published notices show in a strip under the homepage hero." checked={b(value.published)} onChange={(v) => set({ published: v })} />
    </>
  );
}

export function AnnouncementsEditor() {
  return (
    <Collection
      resource="announcements"
      noun="announcement"
      sortable
      label={(r) => s(r.title)}
      searchText={(r) => `${s(r.title)} ${s(r.body)}`}
      toggle={{ key: "published", on: "Published", off: "Draft" }}
      blank={() => ({ title: "", body: "", link_url: "", date: new Date().toISOString().slice(0, 10), published: false })}
      Form={AnnouncementForm}
      emptyHint="Short notices — registrations opening, a deadline, a result. Up to five published ones show on the homepage."
      columns={[
        { head: "Announcement", cell: (r) => <span className="font-medium text-ink">{s(r.title)}</span> },
        { head: "Date", cell: (r) => <span className="text-xs">{noticeDate(s(r.date))}</span> },
      ]}
    />
  );
}
