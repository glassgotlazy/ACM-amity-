"use client";

import { useCallback, useEffect, useState } from "react";
import { ROLE_LABEL } from "@/lib/admin-permissions";
import { api, ApiError, explain } from "./cms/api";
import { Btn, ConfirmDialog, Drawer, EmptyState, ErrorState, LoadingRows, Notice, Pill, Select, TextInput, useCms, useToast } from "./cms/kit";

type User = { id: string; name: string; email: string; role: keyof typeof ROLE_LABEL; active: boolean; last_login_at: string | null };

const ROLE_HELP: Record<User["role"], string> = {
  owner: "Everything, including admin accounts and backups.",
  editor: "All content, settings, media and the submissions inbox.",
  events: "Events, announcements and images only.",
  reviewer: "The submissions inbox only.",
};
const ROLES = (Object.keys(ROLE_LABEL) as User["role"][]).map((r) => ({ value: r, label: `${ROLE_LABEL[r]} — ${ROLE_HELP[r]}` }));

const when = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso)) : "Never";

/** Personal admin accounts. The shared ADMIN_PASSWORD always remains the owner's way in. */
export function Admins() {
  const toast = useToast();
  const { account } = useCms();
  const [data, setData] = useState<{ ready: boolean; rows: User[] } | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [editing, setEditing] = useState<(Partial<User> & { password?: string }) | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [doomed, setDoomed] = useState<User | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await api("/api/admin/users"));
    } catch (e) {
      setError(e);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!editing) return;
    setBusy(true);
    setErrors({});
    try {
      if (editing.id) {
        const body: Record<string, unknown> = { name: editing.name, role: editing.role };
        if (editing.password) body.password = editing.password;
        await api(`/api/admin/users/${editing.id}`, { method: "PUT", json: body });
        toast("ok", editing.password ? "Saved. Their new password works now; old sessions have ended." : "Saved.");
      } else {
        await api("/api/admin/users", { method: "POST", json: editing });
        toast("ok", `${editing.name} can now sign in with their email and the password you set.`);
      }
      setEditing(null);
      load();
    } catch (e) {
      if (e instanceof ApiError && (e.code === "invalid" || e.code === "conflict")) setErrors(e.errors);
      toast("error", explain(e));
    } finally {
      setBusy(false);
    }
  }

  async function act(user: User, body: Record<string, unknown>, done: string) {
    try {
      await api(`/api/admin/users/${user.id}`, { method: "PUT", json: body });
      toast("ok", done);
      load();
    } catch (e) {
      toast("error", e instanceof ApiError && e.errors.active ? e.errors.active : explain(e));
    }
  }

  async function remove() {
    if (!doomed) return;
    setBusy(true);
    try {
      await api(`/api/admin/users/${doomed.id}`, { method: "DELETE" });
      toast("ok", `${doomed.name} removed.`);
      setDoomed(null);
      load();
    } catch (e) {
      toast("error", e instanceof ApiError && e.errors.id ? e.errors.id : explain(e));
    } finally {
      setBusy(false);
    }
  }

  if (error) return <ErrorState error={error} retry={load} />;
  if (!data) return <LoadingRows rows={4} />;
  if (!data.ready) {
    return (
      <Notice tone="warn" title="Run supabase/v3.sql first">
        Personal admin accounts need the tables from <code className="font-mono text-ink">supabase/v3.sql</code>. Until then, sign in with the shared
        owner password.
      </Notice>
    );
  }

  return (
    <div className="space-y-6">
      <Notice title="How accounts work">
        Each person signs in with their own email and password, and only sees what their role allows. The shared ADMIN_PASSWORD keeps
        working as the owner’s way in, so nobody can be locked out. {account ? "" : "You are signed in with the shared owner password."}
      </Notice>
      <div className="flex justify-end">
        <Btn
          tone="primary"
          onClick={() => {
            setErrors({});
            setEditing({ name: "", email: "", role: "editor", password: "" });
          }}
        >
          + New admin
        </Btn>
      </div>
      {data.rows.length === 0 ? (
        <EmptyState title="No personal accounts yet">Add the core team so each change in the audit log shows who made it.</EmptyState>
      ) : (
        <div className="relative overflow-x-auto border border-line">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-line bg-surface">
              <tr>
                {["Name", "Email", "Role", "Last sign-in", "Status", ""].map((h) => (
                  <th key={h || "a"} scope="col" className="px-3 py-3 font-mono text-micro font-normal uppercase text-ink-faint">
                    {h || <span className="sr-only">Actions</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-b-0">
                  <td className="px-3 py-3 font-medium text-ink">{u.name}</td>
                  <td className="px-3 py-3 text-ink-muted">{u.email}</td>
                  <td className="px-3 py-3 text-ink-muted">{ROLE_LABEL[u.role]}</td>
                  <td className="px-3 py-3 text-xs text-ink-faint">{when(u.last_login_at)}</td>
                  <td className="px-3 py-3">
                    <Pill on={u.active}>{u.active ? "Active" : "Deactivated"}</Pill>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <Btn size="sm" tone="ghost" onClick={() => { setErrors({}); setEditing({ ...u, password: "" }); }} aria-label={`Edit ${u.name}`}>
                      Edit
                    </Btn>
                    <Btn size="sm" tone="ghost" onClick={() => act(u, { sign_out: true }, `${u.name} is signed out everywhere.`)} aria-label={`Sign ${u.name} out everywhere`}>
                      Sign out
                    </Btn>
                    <Btn
                      size="sm"
                      tone="ghost"
                      onClick={() => act(u, { active: !u.active }, u.active ? `${u.name} is deactivated and signed out.` : `${u.name} can sign in again.`)}
                      aria-label={`${u.active ? "Deactivate" : "Reactivate"} ${u.name}`}
                    >
                      {u.active ? "Deactivate" : "Reactivate"}
                    </Btn>
                    <Btn size="sm" tone="ghost" className="hover:text-acm-bright" onClick={() => setDoomed(u)} aria-label={`Remove ${u.name}`}>
                      Remove
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer
        open={editing !== null}
        title={editing?.id ? `Edit ${editing.name}` : "New admin"}
        onClose={() => setEditing(null)}
        footer={
          <>
            <Btn onClick={() => setEditing(null)}>Cancel</Btn>
            <Btn tone="primary" onClick={save} disabled={busy}>
              {busy ? "Saving…" : editing?.id ? "Save changes" : "Create account"}
            </Btn>
          </>
        }
      >
        {editing ? (
          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); save(); }}>
            <TextInput label="Name" required value={editing.name ?? ""} onChange={(v) => setEditing({ ...editing, name: v })} error={errors.name} maxLength={60} />
            {editing.id ? (
              <p className="text-sm text-ink-muted">Email: {editing.email}</p>
            ) : (
              <TextInput label="Email" type="email" required value={editing.email ?? ""} onChange={(v) => setEditing({ ...editing, email: v })} error={errors.email} />
            )}
            <Select label="Role" value={editing.role ?? "editor"} onChange={(v) => setEditing({ ...editing, role: v })} options={ROLES} error={errors.role} />
            <TextInput
              label={editing.id ? "New password (optional)" : "First password"}
              type="password"
              required={!editing.id}
              hint="At least 10 characters, mixing letters with numbers or symbols. Share it privately; they can change it under My account."
              value={editing.password ?? ""}
              onChange={(v) => setEditing({ ...editing, password: v })}
              error={errors.password}
            />
            {editing.id ? <p className="text-xs text-ink-faint">Changing the role or password signs them out of every device.</p> : null}
          </form>
        ) : null}
      </Drawer>

      <ConfirmDialog open={doomed !== null} title={doomed ? `Remove ${doomed.name}?` : ""} busy={busy} confirmLabel="Remove" onConfirm={remove} onClose={() => setDoomed(null)}>
        Their account is deleted and they are signed out at once. Their past actions stay in the audit log.
      </ConfirmDialog>
    </div>
  );
}

/** Change your own password (personal accounts only). */
export function MyAccount() {
  const toast = useToast();
  const { actor, role, account } = useCms();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  if (!account) {
    return <Notice title="Shared owner password">You signed in with the shared owner password. It is changed in Vercel (ADMIN_PASSWORD), not here.</Notice>;
  }

  async function save() {
    setBusy(true);
    setErrors({});
    try {
      await api("/api/admin/account", { method: "PUT", json: { current, next } });
      setCurrent("");
      setNext("");
      toast("ok", "Password changed. Your other devices have been signed out.");
    } catch (e) {
      if (e instanceof ApiError && e.code === "invalid") setErrors(e.errors);
      toast("error", explain(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="max-w-md space-y-5" onSubmit={(e) => { e.preventDefault(); save(); }}>
      <p className="text-sm text-ink-muted">
        Signed in as <strong className="text-ink">{actor}</strong> ({ROLE_LABEL[role as keyof typeof ROLE_LABEL] ?? role}).
      </p>
      <TextInput label="Current password" type="password" required value={current} onChange={setCurrent} error={errors.current} />
      <TextInput label="New password" type="password" required hint="At least 10 characters, mixing letters with numbers or symbols." value={next} onChange={setNext} error={errors.next} />
      <Btn tone="primary" type="submit" disabled={busy || !current || !next}>
        {busy ? "Saving…" : "Change password"}
      </Btn>
    </form>
  );
}
