"use client";

import { FOOTER_GROUPS, SOCIAL_PLATFORMS } from "@/lib/cms/types";
import { LinkInput, Select, TextInput, Toggle } from "./kit";
import { Collection, b, s, type FormProps } from "./Collection";

const GROUP_LABEL = Object.fromEntries(FOOTER_GROUPS.map((g) => [g.id, g.label])) as Record<string, string>;

function NavForm({ value, set, errors }: FormProps) {
  return (
    <>
      <TextInput label="Label" required maxLength={40} value={s(value.label)} onChange={(v) => set({ label: v })} error={errors.label} />
      <LinkInput
        label="Destination"
        required
        value={s(value.href)}
        onChange={(v) => set({ href: v })}
        error={errors.href}
        hint="A page on this site (start typing to see every page), or a full https:// address."
      />
      <Toggle
        label="Show in the header"
        hint="The main menu at the top of every page."
        checked={b(value.in_header)}
        onChange={(v) => set({ in_header: v })}
      />
      {errors.in_header ? <p className="text-xs font-medium text-acm-bright">{errors.in_header}</p> : null}
      <Select
        label="Footer column"
        value={s(value.footer_group) as (typeof FOOTER_GROUPS)[number]["id"] | ""}
        onChange={(v) => set({ footer_group: v || null })}
        options={FOOTER_GROUPS.map((g) => ({ value: g.id, label: g.label }))}
        placeholder="Not in the footer"
        error={errors.footer_group}
      />
      <Toggle label="Enabled" hint="Disabled links are kept here but hidden on the site." checked={b(value.enabled)} onChange={(v) => set({ enabled: v })} />
    </>
  );
}

function SocialForm({ value, set, errors }: FormProps) {
  return (
    <>
      <Select
        label="Platform"
        required
        value={s(value.platform) as (typeof SOCIAL_PLATFORMS)[number] | ""}
        onChange={(v) => set({ platform: v })}
        options={SOCIAL_PLATFORMS.map((p) => ({ value: p, label: p === "x" ? "X (Twitter)" : p[0].toUpperCase() + p.slice(1) }))}
        placeholder="Choose…"
        error={errors.platform}
      />
      <TextInput
        label="Link"
        required
        value={s(value.url)}
        onChange={(v) => set({ url: v })}
        error={errors.url}
        hint={value.platform === "email" ? "mailto:name@example.com" : "Full https:// address of the profile"}
      />
      <Toggle label="Enabled" checked={b(value.enabled)} onChange={(v) => set({ enabled: v })} />
    </>
  );
}

export function NavigationEditor() {
  return (
    <div className="space-y-14">
      <section aria-labelledby="nav-links">
        <h2 id="nav-links" className="font-mono text-label uppercase text-ink">
          Links
        </h2>
        <p className="mb-5 mt-2 max-w-2xl text-xs leading-relaxed text-ink-faint">
          One list feeds both the header and the footer. The order here is the order everywhere. Header links also
          open the mobile menu; footer-only browse links are added below them there.
        </p>
        <Collection
          resource="nav"
          noun="link"
          sortable
          label={(r) => s(r.label)}
          searchText={(r) => `${s(r.label)} ${s(r.href)}`}
          toggle={{ key: "enabled", on: "Enabled", off: "Disabled" }}
          blank={() => ({ label: "", href: "", in_header: true, footer_group: null, enabled: true })}
          Form={NavForm}
          columns={[
            { head: "Label", cell: (r) => <span className="font-medium text-ink">{s(r.label)}</span> },
            { head: "Destination", cell: (r) => <code className="font-mono text-xs">{s(r.href)}</code> },
            {
              head: "Shown in",
              cell: (r) =>
                [r.in_header ? "Header" : null, r.footer_group ? `Footer · ${GROUP_LABEL[s(r.footer_group)]}` : null]
                  .filter(Boolean)
                  .join(", "),
            },
          ]}
        />
      </section>

      <section aria-labelledby="social-links">
        <h2 id="social-links" className="font-mono text-label uppercase text-ink">
          Social links
        </h2>
        <p className="mb-5 mt-2 max-w-2xl text-xs leading-relaxed text-ink-faint">Shown in the footer, in this order.</p>
        <Collection
          resource="social"
          noun="social link"
          sortable
          label={(r) => s(r.platform)}
          toggle={{ key: "enabled", on: "Enabled", off: "Disabled" }}
          blank={() => ({ platform: "", url: "", enabled: true })}
          Form={SocialForm}
          emptyHint="Add Instagram, LinkedIn, GitHub and others when the chapter wants them in the footer."
          columns={[
            { head: "Platform", cell: (r) => <span className="font-medium capitalize text-ink">{s(r.platform)}</span> },
            { head: "Link", cell: (r) => <span className="break-all text-xs">{s(r.url)}</span> },
          ]}
        />
      </section>
    </div>
  );
}
