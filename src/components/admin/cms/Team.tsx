"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError, explain } from "./api";
import { Btn, ConfirmDialog, Select, TextArea, TextInput, Toggle, useToast } from "./kit";
import { ImageField } from "./media";
import { Collection, b, s, type FormProps } from "./Collection";

type Role = { id: string; name: string };
type Member = { id: string; name: string; role_id: string };

function useRows<T>(resource: string) {
  const [rows, setRows] = useState<T[]>([]);
  const load = useCallback(async () => {
    try {
      setRows((await api<{ rows: T[] }>(`/api/admin/cms/${resource}`)).rows);
    } catch {
      /* the Collection on the same page shows the error */
    }
  }, [resource]);
  useEffect(() => {
    load();
  }, [load]);
  return { rows, load, setRows };
}

export function TeamEditor() {
  const { rows: roles } = useRows<Role>("roles");
  const roleName = (id: unknown) => roles.find((r) => r.id === id)?.name ?? "—";

  function MemberForm({ value, set, errors }: FormProps) {
    return (
      <>
        <TextInput label="Name" required maxLength={80} value={s(value.name)} onChange={(v) => set({ name: v })} error={errors.name} />
        <Select
          label="Role"
          required
          value={s(value.role_id)}
          onChange={(v) => set({ role_id: v })}
          options={roles.map((r) => ({ value: r.id, label: r.name }))}
          placeholder={roles.length ? "Choose a role…" : "Create a role under Roles first"}
          error={errors.role_id}
        />
        <TextArea
          label="Bio"
          hint="What the role covers, in a sentence or two."
          rows={3}
          maxLength={600}
          value={s(value.bio)}
          onChange={(v) => set({ bio: v })}
          error={errors.bio}
        />
        <ImageField label="Profile photo" use="avatar" value={(value.photo_url as string) ?? null} onChange={(v) => set({ photo_url: v })} error={errors.photo_url} />
        <fieldset className="space-y-4">
          <legend className="font-mono text-label uppercase text-ink-muted">Social links</legend>
          <TextInput label="LinkedIn" value={s(value.linkedin_url)} onChange={(v) => set({ linkedin_url: v })} error={errors.linkedin_url} placeholder="https://linkedin.com/in/…" />
          <TextInput label="GitHub" value={s(value.github_url)} onChange={(v) => set({ github_url: v })} error={errors.github_url} placeholder="https://github.com/…" />
          <TextInput label="Website" value={s(value.website_url)} onChange={(v) => set({ website_url: v })} error={errors.website_url} placeholder="https://…" />
          <TextInput label="Email" type="email" value={s(value.email)} onChange={(v) => set({ email: v })} error={errors.email} />
        </fieldset>
        <Toggle label="Published" hint="Unpublished members are kept here but hidden on the site." checked={b(value.published)} onChange={(v) => set({ published: v })} />
      </>
    );
  }

  return (
    <Collection
      resource="team"
      noun="team member"
      sortable
      label={(r) => s(r.name)}
      searchText={(r) => `${s(r.name)} ${roleName(r.role_id)}`}
      toggle={{ key: "published", on: "Published", off: "Hidden" }}
      blank={() => ({
        name: "",
        role_id: roles[0]?.id ?? "",
        bio: "",
        photo_url: null,
        linkedin_url: "",
        github_url: "",
        website_url: "",
        email: "",
        published: true,
      })}
      Form={MemberForm}
      emptyHint="Office bearers appear on the Teams page and in the footer."
      columns={[
        {
          head: "Member",
          cell: (r) => (
            <span className="flex items-center gap-3">
              {r.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s(r.photo_url)} alt="" className="h-8 w-8 border border-line object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center border border-line font-mono text-micro text-ink-ghost" aria-hidden>
                  {s(r.name).slice(0, 1)}
                </span>
              )}
              <span className="font-medium text-ink">{s(r.name)}</span>
            </span>
          ),
        },
        { head: "Role", cell: (r) => roleName(r.role_id) },
      ]}
    />
  );
}

export function RolesEditor() {
  const toast = useToast();
  const { rows: members, load: loadMembers } = useRows<Member>("team");
  const [reload, setReload] = useState(0);
  const [roles, setRoles] = useState<Role[]>([]);
  const [pending, setPending] = useState<{ role: Role; holders: string[]; done: () => void } | null>(null);
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [plain, setPlain] = useState<{ role: Role; done: () => void } | null>(null);

  const onRoles = useCallback((rows: Record<string, unknown>[]) => setRoles(rows as unknown as Role[]), []);
  const count = (id: string) => members.filter((m) => m.role_id === id).length;

  async function destroy(role: Role, reassignTo?: string) {
    const q = reassignTo ? `?reassign_to=${encodeURIComponent(reassignTo)}` : "";
    await api(`/api/admin/cms/roles/${role.id}${q}`, { method: "DELETE" });
  }

  function onDelete(row: Record<string, unknown>, done: () => void) {
    const role = { id: String(row.id), name: String(row.name) };
    const holders = members.filter((m) => m.role_id === role.id).map((m) => m.name);
    if (holders.length) {
      setTarget("");
      setPending({ role, holders, done });
    } else setPlain({ role, done });
  }

  async function confirmPlain() {
    if (!plain) return;
    setBusy(true);
    try {
      await destroy(plain.role);
      toast("ok", `Role “${plain.role.name}” deleted.`);
      plain.done();
      setPlain(null);
    } catch (e) {
      // Someone was given this role since the page loaded.
      if (e instanceof ApiError && e.code === "role_in_use") {
        setPending({ role: plain.role, holders: (e.extra.members as string[]) ?? [], done: plain.done });
        setPlain(null);
      } else toast("error", explain(e));
    } finally {
      setBusy(false);
    }
  }

  async function confirmReassign() {
    if (!pending || !target) return;
    setBusy(true);
    try {
      await destroy(pending.role, target);
      const to = roles.find((r) => r.id === target)?.name ?? "the new role";
      toast("ok", `${pending.holders.length} member(s) moved to ${to}; “${pending.role.name}” deleted.`);
      pending.done();
      setPending(null);
      await loadMembers();
      setReload((n) => n + 1);
    } catch (e) {
      toast("error", explain(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Collection
        resource="roles"
        noun="role"
        sortable
        reloadKey={reload}
        onRows={onRoles}
        label={(r) => s(r.name)}
        searchText={(r) => s(r.name)}
        blank={() => ({ name: "" })}
        Form={({ value, set, errors }) => (
          <TextInput
            label="Role name"
            required
            maxLength={60}
            hint="Renaming a role updates every member who holds it."
            value={s(value.name)}
            onChange={(v) => set({ name: v })}
            error={errors.name}
          />
        )}
        onDelete={onDelete}
        emptyHint="Roles are the titles team members hold: Chair, Technical Head, Design Lead…"
        columns={[
          { head: "Role", cell: (r) => <span className="font-medium text-ink">{s(r.name)}</span> },
          { head: "Members", cell: (r) => <span className="tnum">{count(String(r.id))}</span> },
        ]}
      />

      <ConfirmDialog
        open={plain !== null}
        title={plain ? `Delete role “${plain.role.name}”?` : ""}
        busy={busy}
        onConfirm={confirmPlain}
        onClose={() => setPlain(null)}
      >
        No one holds this role. This cannot be undone.
      </ConfirmDialog>

      <ConfirmDialog
        open={pending !== null}
        title={pending ? `“${pending.role.name}” is still in use` : ""}
        confirmLabel="Move members and delete"
        busy={busy}
        disabled={!target}
        onConfirm={confirmReassign}
        onClose={() => setPending(null)}
      >
        {pending ? (
          <>
            <p>
              {pending.holders.join(", ")} {pending.holders.length === 1 ? "holds" : "hold"} this role. Choose the role
              they move to before it is deleted.
            </p>
            <label className="mt-4 block">
              <span className="block font-mono text-label uppercase text-ink-muted">Move members to</span>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="mt-2 h-10 w-full border border-line bg-surface px-3 text-sm text-ink focus:border-acm focus:outline-none"
              >
                <option value="">Choose a role…</option>
                {roles
                  .filter((r) => r.id !== pending.role.id)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </label>
            {roles.length < 2 ? (
              <p className="mt-3 text-xs text-acm-bright">Create another role first — there is nowhere to move them yet.</p>
            ) : null}
          </>
        ) : null}
      </ConfirmDialog>
      <div className="mt-4 flex justify-end">
        <Btn size="sm" tone="ghost" onClick={() => { loadMembers(); setReload((n) => n + 1); }}>
          Refresh counts
        </Btn>
      </div>
    </>
  );
}
