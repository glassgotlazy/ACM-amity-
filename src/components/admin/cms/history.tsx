"use client";

import { useCallback, useEffect, useState } from "react";
import { api, explain } from "./api";
import { Btn, ConfirmDialog, Drawer, EmptyState, ErrorState, LoadingRows, Notice, useToast } from "./kit";

type Version = { id: number; at: string; actor: string; entity_id: string; action: "update" | "delete"; label: string | null };

const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function useVersions(open: boolean, query: string) {
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [ready, setReady] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const load = useCallback(async () => {
    setError(null);
    setVersions(null);
    try {
      const body = await api<{ ready: boolean; versions: Version[] }>(`/api/admin/cms/versions?${query}`);
      setReady(body.ready);
      setVersions(body.versions);
    } catch (e) {
      setError(e);
    }
  }, [query]);
  useEffect(() => {
    if (open) load();
  }, [open, load]);
  return { versions, ready, error, load };
}

/**
 * A panel listing earlier versions of one item (or deleted items of a
 * collection), each with a Restore button. Every save and delete keeps the
 * state before it, so any change can be taken back.
 */
function VersionsPanel({
  open,
  onClose,
  title,
  resource,
  query,
  onRestored,
  deleted,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  resource: string;
  query: string;
  onRestored: () => void;
  deleted?: boolean;
}) {
  const toast = useToast();
  const { versions, ready, error, load } = useVersions(open, query);
  const [chosen, setChosen] = useState<Version | null>(null);
  const [busy, setBusy] = useState(false);

  async function restore() {
    if (!chosen) return;
    setBusy(true);
    try {
      await api("/api/admin/cms/versions", { method: "POST", json: { resource, version_id: chosen.id } });
      toast("ok", deleted ? `“${chosen.label ?? "Item"}” is back.` : "Earlier version restored and live.");
      setChosen(null);
      onClose();
      onRestored();
    } catch (e) {
      toast("error", explain(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Drawer open={open} title={title} onClose={onClose} footer={<Btn onClick={onClose}>Close</Btn>}>
        {error ? (
          <ErrorState error={error} retry={load} />
        ) : !versions ? (
          <LoadingRows />
        ) : !ready ? (
          <Notice tone="warn" title="History is not switched on">
            Run supabase/v3.sql in Supabase. From then on every save and delete is kept here.
          </Notice>
        ) : versions.length === 0 ? (
          <EmptyState title={deleted ? "Nothing deleted" : "No earlier versions"}>
            {deleted ? "Deleted items appear here and can be brought back." : "Each time this is saved, the version before it is kept here."}
          </EmptyState>
        ) : (
          <ol className="divide-y divide-line border border-line">
            {versions.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm text-ink">{v.label || "Untitled"}</div>
                  <div className="mt-1 font-mono text-micro uppercase text-ink-faint">
                    {deleted ? "Deleted" : "Before an edit"} · {when(v.at)} · {v.actor}
                  </div>
                </div>
                <Btn size="sm" onClick={() => setChosen(v)} aria-label={`Restore ${v.label ?? "version"} from ${when(v.at)}`}>
                  Restore
                </Btn>
              </li>
            ))}
          </ol>
        )}
      </Drawer>
      <ConfirmDialog
        open={chosen !== null}
        title={deleted ? `Bring back “${chosen?.label ?? "this item"}”?` : "Restore this version?"}
        confirmLabel="Restore"
        busy={busy}
        onConfirm={restore}
        onClose={() => setChosen(null)}
      >
        {deleted
          ? "It is recreated as it was when deleted, and appears on the public site if it was published."
          : "The current content is replaced by this version and goes live straight away. The current version is kept in history too, so this can be undone."}
      </ConfirmDialog>
    </>
  );
}

/** "History" button for one item's editor. */
export function HistoryButton({ resource, id, onRestored }: { resource: string; id: string; onRestored: () => void }) {
  const [open, setOpen] = useState(false);
  const query = `resource=${encodeURIComponent(resource)}${resource === "settings" ? "" : `&id=${encodeURIComponent(id)}`}`;
  return (
    <>
      <Btn tone="ghost" onClick={() => setOpen(true)}>
        History
      </Btn>
      <VersionsPanel open={open} onClose={() => setOpen(false)} title="Earlier versions" resource={resource} query={query} onRestored={onRestored} />
    </>
  );
}

/** "Recently deleted" button for a collection. */
export function DeletedButton({ resource, noun, onRestored }: { resource: string; noun: string; onRestored: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn tone="ghost" onClick={() => setOpen(true)}>
        Recently deleted
      </Btn>
      <VersionsPanel
        open={open}
        onClose={() => setOpen(false)}
        title={`Deleted ${noun}s`}
        resource={resource}
        query={`resource=${encodeURIComponent(resource)}&deleted=1`}
        onRestored={onRestored}
        deleted
      />
    </>
  );
}
