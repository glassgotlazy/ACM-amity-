"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { api, ApiError, explain } from "./api";
import { DeletedButton, HistoryButton } from "./history";
import {
  Btn,
  ConfirmDialog,
  Drawer,
  EmptyState,
  ErrorState,
  LoadingRows,
  MoveButtons,
  Pill,
  useCms,
  useToast,
} from "./kit";

type Row = { id: string } & Record<string, unknown>;
export type Draft = Record<string, unknown>;
export type Errors = Record<string, string>;

export type FormProps = {
  value: Draft;
  set: (patch: Draft) => void;
  errors: Errors;
};

export type CollectionProps = {
  resource: string;
  /** Singular noun for buttons and messages: "event", "team member". */
  noun: string;
  columns: {
    head: string;
    cell: (row: Row) => ReactNode;
    className?: string;
  }[];
  /** Text the search box matches against. Omit to hide search. */
  searchText?: (row: Row) => string;
  blank: () => Draft;
  Form: (props: FormProps) => ReactNode;
  label: (row: Row) => string;
  sortable?: boolean;
  /** The boolean column the table toggles inline, with its on/off words. */
  toggle?: { key: string; on: string; off: string };
  /** Row → editable draft, and draft → request body (for date inputs etc.). */
  toDraft?: (row: Row) => Draft;
  fromDraft?: (draft: Draft) => Draft;
  /** Replaces the plain confirm-and-delete, e.g. for roles still in use. */
  onDelete?: (row: Row, done: () => void) => void;
  deleteWarning?: (row: Row) => ReactNode;
  emptyHint?: ReactNode;
  /** Lets a parent reload after its own mutation (role reassignment). */
  reloadKey?: number;
  onRows?: (rows: Row[]) => void;
  /** Public page for an item, so the editor can preview it (drafts included) before publishing. */
  previewPath?: (row: Row) => string | null;
};

/**
 * The list-and-edit screen shared by every CMS collection: search, table,
 * create/edit side panel, inline publish toggle, reorder and delete — each
 * with loading, empty and error states and a toast on success.
 */
export function Collection(props: CollectionProps) {
  const {
    resource,
    noun,
    columns,
    searchText,
    blank,
    Form,
    label,
    sortable,
    toggle,
  } = props;
  const toDraft = props.toDraft ?? ((r: Row) => ({ ...r }));
  const fromDraft = props.fromDraft ?? ((d: Draft) => d);
  const toast = useToast();
  const cms = useCms();

  const [rows, setRows] = useState<Row[] | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [query, setQuery] = useState("");
  /**
   * `version` is the row's updated_at when the editor opened; saving sends it
   * back so the server can refuse a stale write. `stale` holds the newer row
   * when that happens, so the admin chooses what to keep.
   */
  const [editing, setEditing] = useState<{
    id: string | null;
    draft: Draft;
    version?: string;
    stale?: Row;
  } | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [doomed, setDoomed] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyRow, setBusyRow] = useState<string | null>(null);

  const { onRows } = props;
  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const body = await api<{ rows: Row[] }>(`/api/admin/cms/${resource}`);
      setRows(body.rows);
      onRows?.(body.rows);
    } catch (e) {
      setLoadError(e);
    }
  }, [resource, onRows]);

  useEffect(() => {
    load();
  }, [load, props.reloadKey]);

  const shown = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    return q && searchText
      ? rows.filter((r) => searchText(r).toLowerCase().includes(q))
      : rows;
  }, [rows, query, searchText]);

  const open = (row: Row) => {
    setErrors({});
    setEditing({
      id: row.id,
      draft: toDraft(row),
      version: typeof row.updated_at === "string" ? row.updated_at : undefined,
    });
  };

  async function save(overwrite = false) {
    if (!editing) return;
    setSaving(true);
    setErrors({});
    try {
      const body = {
        ...fromDraft(editing.draft),
        _expected_updated_at: overwrite ? undefined : editing.version,
      };
      if (editing.id)
        await api(`/api/admin/cms/${resource}/${editing.id}`, {
          method: "PUT",
          json: body,
        });
      else
        await api(`/api/admin/cms/${resource}`, { method: "POST", json: body });
      toast(
        "ok",
        editing.id
          ? `Changes to the ${noun} are live.`
          : `New ${noun} created.`,
      );
      setEditing(null);
      await load();
      // New slugs become valid link targets.
      cms.refresh();
    } catch (e) {
      if (
        e instanceof ApiError &&
        (e.code === "invalid" || e.code === "conflict")
      )
        setErrors(e.errors);
      if (e instanceof ApiError && e.code === "stale") {
        setEditing((ed) =>
          ed ? { ...ed, stale: e.extra.current as Row } : ed,
        );
      }
      toast("error", explain(e));
    } finally {
      setSaving(false);
    }
  }

  async function flip(row: Row) {
    if (!toggle) return;
    setBusyRow(row.id);
    try {
      const draft = { ...toDraft(row), [toggle.key]: !row[toggle.key] };
      const { row: saved } = await api<{ row: Row }>(
        `/api/admin/cms/${resource}/${row.id}`,
        {
          method: "PUT",
          json: { ...fromDraft(draft), _expected_updated_at: row.updated_at },
        },
      );
      // Keep the returned row (with its new updated_at) so the next edit is not seen as stale.
      setRows(
        (rs) =>
          rs?.map((r) => (r.id === row.id ? { ...r, ...saved } : r)) ?? null,
      );
      toast(
        "ok",
        `${label(row)} is now ${!row[toggle.key] ? toggle.on.toLowerCase() : toggle.off.toLowerCase()}.`,
      );
    } catch (e) {
      if (e instanceof ApiError && e.code === "stale") load();
      toast(
        "error",
        e instanceof ApiError && e.code === "invalid"
          ? "Open the item and fix its fields first."
          : explain(e),
      );
    } finally {
      setBusyRow(null);
    }
  }

  async function move(index: number, delta: -1 | 1) {
    if (!rows) return;
    const next = [...rows];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    const previous = rows;
    setRows(next);
    try {
      await api(`/api/admin/cms/${resource}/reorder`, {
        method: "POST",
        json: { ids: next.map((r) => r.id) },
      });
    } catch (e) {
      setRows(previous);
      toast("error", explain(e));
    }
  }

  async function remove() {
    if (!doomed) return;
    setDeleting(true);
    try {
      await api(`/api/admin/cms/${resource}/${doomed.id}`, {
        method: "DELETE",
      });
      toast("ok", `${label(doomed)} deleted.`);
      setDoomed(null);
      await load();
      cms.refresh();
    } catch (e) {
      toast("error", explain(e));
    } finally {
      setDeleting(false);
    }
  }

  function afterRestore() {
    setEditing(null);
    load();
    cms.refresh();
  }

  const current = editing?.id
    ? rows?.find((r) => r.id === editing.id)
    : undefined;
  const preview =
    current && props.previewPath ? props.previewPath(current) : null;

  const reorderable = sortable && !query.trim();

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {searchText ? (
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${noun}s…`}
            aria-label={`Search ${noun}s`}
            className="h-10 w-full border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-ghost focus:border-acm focus:outline-none sm:max-w-xs"
          />
        ) : (
          <span />
        )}
        <div className="flex flex-wrap gap-2">
          {cms.v3 ? (
            <DeletedButton
              resource={resource}
              noun={noun}
              onRestored={afterRestore}
            />
          ) : null}
          <Btn
            tone="primary"
            onClick={() => {
              setErrors({});
              setEditing({ id: null, draft: blank() });
            }}
          >
            + New {noun}
          </Btn>
        </div>
      </div>

      <div className="mt-5">
        {loadError ? (
          <ErrorState error={loadError} retry={load} />
        ) : !rows ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState
            title={`No ${noun}s yet`}
            action={
              <Btn
                tone="primary"
                onClick={() => setEditing({ id: null, draft: blank() })}
              >
                + New {noun}
              </Btn>
            }
          >
            {props.emptyHint}
          </EmptyState>
        ) : shown.length === 0 ? (
          <EmptyState title="Nothing matches">
            Try a different search.
          </EmptyState>
        ) : (
          <div className="relative overflow-x-auto border border-line">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-line bg-surface">
                <tr>
                  {reorderable ? (
                    <th className="w-20 px-3 py-3 font-mono text-micro font-normal uppercase text-ink-faint">
                      Order
                    </th>
                  ) : null}
                  {columns.map((c) => (
                    <th
                      key={c.head}
                      className={cn(
                        "px-3 py-3 font-mono text-micro font-normal uppercase text-ink-faint",
                        c.className,
                      )}
                    >
                      {c.head}
                    </th>
                  ))}
                  {toggle ? (
                    <th className="px-3 py-3 font-mono text-micro font-normal uppercase text-ink-faint">
                      Status
                    </th>
                  ) : null}
                  <th className="px-3 py-3 text-right font-mono text-micro font-normal uppercase text-ink-faint">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((row, i) => (
                  <tr
                    key={row.id}
                    className="border-b border-line last:border-b-0 hover:bg-surface/60"
                  >
                    {reorderable ? (
                      <td className="px-1 py-2">
                        <MoveButtons
                          label={label(row)}
                          onUp={i > 0 ? () => move(i, -1) : undefined}
                          onDown={
                            i < shown.length - 1 ? () => move(i, 1) : undefined
                          }
                        />
                      </td>
                    ) : null}
                    {columns.map((c) => (
                      <td
                        key={c.head}
                        className={cn(
                          "px-3 py-3 align-middle text-ink-muted",
                          c.className,
                        )}
                      >
                        {c.cell(row)}
                      </td>
                    ))}
                    {toggle ? (
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => flip(row)}
                          disabled={busyRow === row.id}
                          className="disabled:opacity-50"
                          aria-label={`${row[toggle.key] ? toggle.on : toggle.off} — switch ${label(row)} to ${row[toggle.key] ? toggle.off : toggle.on}`}
                        >
                          <Pill on={Boolean(row[toggle.key])}>
                            {row[toggle.key] ? toggle.on : toggle.off}
                          </Pill>
                        </button>
                      </td>
                    ) : null}
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      <Btn
                        size="sm"
                        tone="ghost"
                        onClick={() => open(row)}
                        aria-label={`Edit ${label(row)}`}
                      >
                        Edit
                      </Btn>
                      <Btn
                        size="sm"
                        tone="ghost"
                        className="hover:text-acm-bright"
                        onClick={() =>
                          props.onDelete
                            ? props.onDelete(row, load)
                            : setDoomed(row)
                        }
                        aria-label={`Delete ${label(row)}`}
                      >
                        Delete
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer
        open={editing !== null}
        title={editing?.id ? `Edit ${noun}` : `New ${noun}`}
        onClose={() => setEditing(null)}
        footer={
          <>
            {Object.keys(errors).length ? (
              <span
                role="alert"
                className="mr-auto text-xs font-medium text-acm-bright"
              >
                Fix the highlighted fields.
              </span>
            ) : null}
            {editing?.id && cms.v3 ? (
              <HistoryButton
                resource={resource}
                id={editing.id}
                onRestored={afterRestore}
              />
            ) : null}
            {preview ? (
              <a
                href={`/api/admin/preview?path=${encodeURIComponent(preview)}`}
                target="_blank"
                rel="noopener"
                title="Opens the page with drafts shown, as last saved"
                className="inline-flex h-10 items-center px-3 text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
              >
                Preview
              </a>
            ) : null}
            <Btn onClick={() => setEditing(null)}>Cancel</Btn>
            <Btn tone="primary" onClick={() => save()} disabled={saving}>
              {saving
                ? "Saving…"
                : editing?.id
                  ? "Save changes"
                  : `Create ${noun}`}
            </Btn>
          </>
        }
      >
        {editing?.stale ? (
          <div
            role="alert"
            className="mb-6 border border-acm/60 bg-acm-wash px-4 py-3 text-sm text-ink-muted"
          >
            <p className="font-medium text-ink">
              Someone else saved this {noun} after you opened it.
            </p>
            <p className="mt-1">
              Saving now would overwrite their changes. Choose which version to
              keep.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Btn
                size="sm"
                onClick={() => {
                  const current = editing.stale!;
                  setErrors({});
                  setEditing({
                    id: current.id,
                    draft: toDraft(current),
                    version: current.updated_at as string | undefined,
                  });
                  load();
                }}
              >
                Load their version
              </Btn>
              <Btn
                size="sm"
                tone="danger"
                onClick={() => save(true)}
                disabled={saving}
              >
                Keep mine and overwrite
              </Btn>
            </div>
          </div>
        ) : null}
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            className="space-y-5"
          >
            {/* Called, not mounted: a form defined inside a page component
                would otherwise remount (and drop focus) on every render. */}
            {Form({
              value: editing.draft,
              set: (patch) =>
                setEditing((ed) =>
                  ed ? { ...ed, draft: { ...ed.draft, ...patch } } : ed,
                ),
              errors,
            })}
            <button type="submit" className="sr-only" tabIndex={-1}>
              Save
            </button>
          </form>
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={doomed !== null}
        title={doomed ? `Delete “${label(doomed)}”?` : ""}
        busy={deleting}
        onConfirm={remove}
        onClose={() => setDoomed(null)}
      >
        {doomed && props.deleteWarning
          ? props.deleteWarning(doomed)
          : cms.v3
            ? "It disappears from the public site straight away. You can bring it back from Recently deleted."
            : "It disappears from the public site straight away. This cannot be undone."}
      </ConfirmDialog>
    </div>
  );
}

/** Typed accessors for the loosely-typed draft inside forms. */
export const s = (v: unknown) =>
  typeof v === "string" ? v : v == null ? "" : String(v);
export const b = (v: unknown) => v === true;
export const list = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);
