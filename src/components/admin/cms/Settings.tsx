"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError, explain } from "./api";
import { Btn, ErrorState, ListField, LoadingRows, TextArea, TextInput, useCms, useToast } from "./kit";
import { ImageField } from "./media";
import { list, s, type Draft, type Errors } from "./Collection";

function Group({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 border-b border-line py-8 first:pt-0 lg:grid-cols-[16rem_1fr] lg:gap-10">
      <div>
        <h2 className="font-mono text-label uppercase text-ink">{title}</h2>
        {description ? <p className="mt-2 text-xs leading-relaxed text-ink-faint">{description}</p> : null}
      </div>
      <div className="max-w-2xl space-y-5">{children}</div>
    </section>
  );
}

/** One form for the whole site identity. Saving updates every page. */
export function SettingsEditor() {
  const toast = useToast();
  const { status } = useCms();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saved, setSaved] = useState<string>("");
  const [loadError, setLoadError] = useState<unknown>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const { row } = await api<{ row: Draft }>("/api/admin/cms/settings");
      setDraft(row);
      setSaved(JSON.stringify(row));
    } catch (e) {
      setLoadError(e);
    }
  }, []);

  useEffect(() => {
    if (status === "ready") load();
  }, [status, load]);

  if (loadError) return <ErrorState error={loadError} retry={load} />;
  if (!draft) return <LoadingRows rows={6} />;

  const set = (patch: Draft) => setDraft((d) => ({ ...d, ...patch }));
  const dirty = JSON.stringify(draft) !== saved;
  const text = (key: string, label: string, opts: { hint?: string; required?: boolean; max?: number } = {}) => (
    <TextInput
      label={label}
      value={s(draft[key])}
      onChange={(v) => set({ [key]: v })}
      error={errors[key]}
      hint={opts.hint}
      required={opts.required}
      maxLength={opts.max}
    />
  );

  async function save() {
    setSaving(true);
    setErrors({});
    try {
      const { row } = await api<{ row: Draft }>("/api/admin/cms/settings", { method: "PUT", json: draft });
      setDraft(row);
      setSaved(JSON.stringify(row));
      toast("ok", "Site settings are live on every page.");
    } catch (e) {
      if (e instanceof ApiError && e.code === "invalid") setErrors(e.errors);
      toast("error", explain(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <Group title="Identity" description="Shown in the browser tab, search results, share cards, header and footer.">
        {text("site_name", "Website name", { required: true, max: 80, hint: "e.g. ACM BuildHub" })}
        {text("short_name", "Short name", { required: true, max: 24, hint: "The large part of the wordmark, e.g. ACM" })}
        {text("organization", "Organisation", {
          required: true,
          max: 120,
          hint: "Full name, e.g. ACM @ Amity University. The wordmark shows the part after the short name.",
        })}
        {text("tagline", "Tagline", { max: 200 })}
        <TextArea
          label="Website description"
          hint="Used by search engines and link previews. One or two sentences."
          value={s(draft.description)}
          onChange={(v) => set({ description: v })}
          error={errors.description}
          maxLength={400}
        />
      </Group>

      <Group title="Logo & favicon" description="Without a logo, the typographic wordmark is used.">
        <ImageField label="Logo" use="logo" value={(draft.logo_url as string) ?? null} onChange={(v) => set({ logo_url: v })} error={errors.logo_url} />
        <ImageField
          label="Favicon"
          use="favicon"
          value={(draft.favicon_url as string) ?? null}
          onChange={(v) => set({ favicon_url: v })}
          error={errors.favicon_url}
        />
      </Group>

      <Group title="Contact" description="Each item appears in the footer only when it is filled in.">
        {text("contact_email", "Contact email", { max: 200 })}
        {text("contact_phone", "Contact phone", { max: 40 })}
        {text("location", "Location", { max: 160 })}
      </Group>

      <Group title="Registration" description="The chapter's official registration form, linked from the footer and the join flow.">
        {text("registration_url", "Registration form link", { hint: "Full https:// address" })}
        <ImageField
          label="Registration QR code"
          use="qr"
          value={(draft.registration_qr_url as string) ?? null}
          onChange={(v) => set({ registration_qr_url: v })}
          error={errors.registration_qr_url}
          hint="Upload a new QR whenever the form link changes — the QR is an image and does not update itself."
        />
      </Group>

      <Group title="Footer" description="Footer links are managed under Navigation.">
        <TextArea
          label="Footer text"
          value={s(draft.footer_text)}
          onChange={(v) => set({ footer_text: v })}
          error={errors.footer_text}
          maxLength={400}
        />
        <ListField
          label="Pillars"
          hint="The short words under the footer text and at the end of the homepage."
          items={list(draft.pillars)}
          onChange={(v) => set({ pillars: v })}
          error={errors.pillars}
          max={8}
        />
        {text("copyright_text", "Copyright text", { hint: "Shown after “© year”", max: 160 })}
        <TextArea
          label="Disclaimer"
          value={s(draft.disclaimer_text)}
          onChange={(v) => set({ disclaimer_text: v })}
          error={errors.disclaimer_text}
          maxLength={400}
        />
      </Group>

      <div className="sticky bottom-0 -mx-5 flex items-center justify-end gap-3 border-t border-line bg-void/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
        {dirty ? <span className="mr-auto font-mono text-micro uppercase text-acm-bright">Unsaved changes</span> : null}
        <Btn onClick={() => draft && setDraft(JSON.parse(saved))} disabled={!dirty || saving}>
          Discard
        </Btn>
        <Btn tone="primary" type="submit" disabled={!dirty || saving}>
          {saving ? "Saving…" : "Save settings"}
        </Btn>
      </div>
    </form>
  );
}
