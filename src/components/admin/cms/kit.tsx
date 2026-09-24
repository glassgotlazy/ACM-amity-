"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { api, ApiError, explain } from "./api";

/* -------------------------------------------------------------------------- */
/* Shared admin state: CMS setup status and valid link targets                */
/* -------------------------------------------------------------------------- */

type CmsStatus = "loading" | "missing" | "empty" | "ready" | "error";
export type ContentKey = "problems" | "ideas" | "research" | "workteams" | "activity";
type ContentState = Record<ContentKey, "missing" | "empty" | "ready">;

type CmsState = {
  status: CmsStatus;
  /** Per long-form collection: tables created (admin.sql) and content loaded. */
  content: ContentState | null;
  /** Whether the audit log table exists. */
  audit: boolean;
  /** Whether supabase/v3.sql has run (accounts, history, email templates). */
  v3: boolean;
  /** Whether RESEND_API_KEY is set, so applicant emails can be sent. */
  email: boolean;
  actor: string;
  role: string;
  /** Signed in with a personal account (can change its own password). */
  account: boolean;
  routes: string[];
  refresh: () => void;
};

const CmsContext = createContext<CmsState>({
  status: "loading",
  content: null,
  audit: false,
  v3: false,
  email: false,
  actor: "",
  role: "",
  account: false,
  routes: [],
  refresh: () => {},
});

export function CmsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<CmsState, "refresh">>({ status: "loading", content: null, audit: false, v3: false, email: false, actor: "", role: "", account: false, routes: [] });

  const refresh = useCallback(async () => {
    try {
      const body = await api<Omit<CmsState, "refresh">>("/api/admin/cms/status");
      setState(body);
    } catch (e) {
      // An ended session sends the admin back to sign in rather than showing a broken page.
      if (e instanceof ApiError && e.status === 401) window.location.assign("/admin/login?expired=1");
      else setState((s) => ({ ...s, status: "error" }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <CmsContext.Provider value={{ ...state, refresh }}>{children}</CmsContext.Provider>;
}

export const useCms = () => useContext(CmsContext);

/* -------------------------------------------------------------------------- */
/* Toasts                                                                     */
/* -------------------------------------------------------------------------- */

type Toast = { id: number; tone: "ok" | "error"; text: string };
const ToastContext = createContext<(tone: Toast["tone"], text: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((tone: Toast["tone"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, tone, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === "error" ? 7000 : 3500);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[300] flex w-[min(24rem,calc(100vw-2.5rem))] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto border bg-surface-raised px-4 py-3 text-sm shadow-lg",
              t.tone === "ok" ? "border-signal-live/50 text-ink" : "border-acm text-ink",
            )}
          >
            <span className={cn("mr-2 font-mono text-micro uppercase", t.tone === "ok" ? "text-signal-live" : "text-acm-bright")}>
              {t.tone === "ok" ? "Saved" : "Error"}
            </span>
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/* -------------------------------------------------------------------------- */
/* Layout pieces                                                              */
/* -------------------------------------------------------------------------- */

export function AdminPage({
  title,
  description,
  actions,
  gate = true,
  content,
  children,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** CMS editors wait for setup; the dashboard and queues do not. */
  gate?: boolean;
  /** Long-form editors also need their collection loaded. */
  content?: ContentKey;
  children: ReactNode;
}) {
  return (
    <div className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="mt-8">
        {gate ? <SetupGate content={content}>{children}</SetupGate> : children}
      </div>
    </div>
  );
}

/** Editing needs the tables and the initial content; say so instead of failing on save. */
function SetupGate({ children, content: key }: { children: ReactNode; content?: ContentKey }) {
  const { status, content } = useCms();
  if (status === "ready" && key && content && content[key] !== "ready") {
    return (
      <Notice tone="warn" title={content[key] === "missing" ? "Run supabase/admin.sql first" : "Content not loaded yet"}>
        {content[key] === "missing" ? (
          <>This section needs the tables from <code className="font-mono text-ink">supabase/admin.sql</code>. Run it in the Supabase SQL editor, then reload.</>
        ) : (
          <>
            Open the <a href="/admin" className="text-acm-bright underline underline-offset-4">Dashboard</a> and choose “Load
            remaining content”. Until then the site shows its built-in copy.
          </>
        )}
      </Notice>
    );
  }
  if (status === "ready") return <>{children}</>;
  if (status === "loading") return <LoadingRows />;
  return (
    <Notice tone="warn" title={status === "missing" ? "Database tables missing" : status === "empty" ? "Content not loaded yet" : "Could not check the CMS"}>
      {status === "missing" ? (
        <>Run <code className="font-mono text-ink">supabase/cms.sql</code> in the Supabase SQL editor, then reload this page.</>
      ) : status === "empty" ? (
        <>
          Open the <a href="/admin" className="text-acm-bright underline underline-offset-4">Dashboard</a> and choose “Load
          current website content”. Until then the public site shows its built-in content.
        </>
      ) : (
        <>The server did not answer. Check that Supabase is connected, then reload.</>
      )}
    </Notice>
  );
}

export function Notice({ tone = "info", title, children }: { tone?: "info" | "warn" | "error"; title: string; children?: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={cn(
        "border px-5 py-4",
        tone === "info" ? "border-line bg-surface" : "border-acm/50 bg-acm-wash",
      )}
    >
      <div className={cn("font-mono text-label uppercase", tone === "info" ? "text-ink-muted" : "text-acm-bright")}>{title}</div>
      {children ? <div className="mt-2 text-sm leading-relaxed text-ink-muted">{children}</div> : null}
    </div>
  );
}

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-px">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-14 animate-pulse bg-surface" />
      ))}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="border border-dashed border-line-strong px-6 py-14 text-center">
      <div className="text-lg font-semibold tracking-[-0.02em]">{title}</div>
      {children ? <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted">{children}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <Notice tone="error" title="Could not load">
      {explain(error)}{" "}
      <button type="button" onClick={retry} className="text-acm-bright underline underline-offset-4">
        Try again
      </button>
    </Notice>
  );
}

/* -------------------------------------------------------------------------- */
/* Buttons                                                                    */
/* -------------------------------------------------------------------------- */

export function Btn({
  tone = "default",
  size = "md",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "primary" | "default" | "danger" | "ghost"; size?: "sm" | "md" }) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-mono uppercase transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        size === "md" ? "h-10 px-4 text-label" : "h-8 px-3 text-micro",
        tone === "primary" && "bg-acm-solid text-white hover:bg-acm-deep",
        tone === "default" && "border border-line-strong text-ink hover:border-ink-faint",
        tone === "danger" && "border border-acm/60 text-acm-bright hover:bg-acm-wash",
        tone === "ghost" && "text-ink-faint hover:text-ink",
        className,
      )}
    />
  );
}

export function MoveButtons({
  label,
  onUp,
  onDown,
  disabled,
}: {
  label: string;
  onUp?: () => void;
  onDown?: () => void;
  disabled?: boolean;
}) {
  return (
    <span className="inline-flex">
      <button
        type="button"
        onClick={onUp}
        disabled={disabled || !onUp}
        aria-label={`Move ${label} up`}
        className="flex h-8 w-8 items-center justify-center text-ink-faint hover:text-ink disabled:opacity-25"
      >
        ↑
      </button>
      <button
        type="button"
        onClick={onDown}
        disabled={disabled || !onDown}
        aria-label={`Move ${label} down`}
        className="flex h-8 w-8 items-center justify-center text-ink-faint hover:text-ink disabled:opacity-25"
      >
        ↓
      </button>
    </span>
  );
}

export function Pill({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-micro uppercase",
        on ? "text-signal-live" : "text-ink-ghost",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", on ? "bg-signal-live" : "bg-line-strong")} aria-hidden />
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Dialogs                                                                    */
/* -------------------------------------------------------------------------- */

function useDialogFocus(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const focusables = () =>
      Array.from(
        node?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? [],
      ).filter((el) => !el.hasAttribute("disabled"));
    (focusables().find((el) => el.dataset.autofocus !== undefined) ?? focusables()[0])?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab") {
        const els = focusables();
        if (!els.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, onClose]);
  return ref;
}

/** Side panel for create/edit forms: long forms scroll, the page stays put. */
export function Drawer({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  const ref = useDialogFocus(open, onClose);
  const id = useId();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className="relative flex h-full w-full max-w-2xl flex-col border-l border-line bg-void"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 id={id} className="text-lg font-semibold tracking-[-0.02em]">
            {title}
          </h2>
          <Btn tone="ghost" size="sm" onClick={onClose} aria-label="Close panel">
            ✕
          </Btn>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = "Delete",
  busy,
  disabled,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  busy?: boolean;
  /** Blocks confirming without showing the busy label (e.g. a choice is missing). */
  disabled?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const ref = useDialogFocus(open, onClose);
  const id = useId();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-5">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={id}
        className="relative w-full max-w-md border border-line-strong bg-void p-6"
      >
        <h2 id={id} className="text-lg font-semibold tracking-[-0.02em]">
          {title}
        </h2>
        {children ? <div className="mt-3 text-sm leading-relaxed text-ink-muted">{children}</div> : null}
        <div className="mt-6 flex justify-end gap-2">
          <Btn onClick={onClose} data-autofocus="">
            Cancel
          </Btn>
          <Btn tone="danger" onClick={onConfirm} disabled={busy || disabled}>
            {busy ? "Working…" : confirmLabel}
          </Btn>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Fields                                                                     */
/* -------------------------------------------------------------------------- */

const control =
  "w-full border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-ghost transition-colors " +
  "focus:border-acm focus:outline-none aria-[invalid=true]:border-acm";

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: (props: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const describedBy = [error ? `${id}-err` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="block font-mono text-label uppercase text-ink-muted">
        {label}
        {required ? <span className="ml-1 text-acm-bright">*</span> : null}
      </label>
      <div className="mt-2">{children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}</div>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs leading-relaxed text-ink-faint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-xs font-medium text-acm-bright">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type Common = { label: string; hint?: ReactNode; error?: string; required?: boolean; className?: string };

export function TextInput({
  value,
  onChange,
  type = "text",
  placeholder,
  maxLength,
  list,
  ...field
}: Common & {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  list?: string;
}) {
  return (
    <Field {...field}>
      {(p) => (
        <input
          {...p}
          type={type}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          list={list}
          onChange={(e) => onChange(e.target.value)}
          className={cn(control, "h-10")}
        />
      )}
    </Field>
  );
}

export function TextArea({
  value,
  onChange,
  rows = 3,
  maxLength,
  placeholder,
  ...field
}: Common & { value: string; onChange: (v: string) => void; rows?: number; maxLength?: number; placeholder?: string }) {
  return (
    <Field {...field}>
      {(p) => (
        <textarea
          {...p}
          rows={rows}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cn(control, "resize-y py-2.5 leading-relaxed")}
        />
      )}
    </Field>
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  ...field
}: Common & {
  value: T | "";
  onChange: (v: T) => void;
  options: readonly { value: T; label: string }[];
  placeholder?: string;
}) {
  return (
    <Field {...field}>
      {(p) => (
        <select {...p} value={value} onChange={(e) => onChange(e.target.value as T)} className={cn(control, "h-10")}>
          {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-5 w-9 shrink-0 border transition-colors",
          checked ? "border-acm bg-acm-solid" : "border-line-strong bg-surface",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-3.5 w-3.5 bg-white transition-transform",
            checked ? "translate-x-[1.1rem]" : "translate-x-0.5",
          )}
          aria-hidden
        />
      </button>
      <label htmlFor={id} className="cursor-pointer text-sm">
        <span className="text-ink">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-ink-faint">{hint}</span> : null}
      </label>
    </div>
  );
}

/** Internal links get a suggestion list of every page that exists. */
export function LinkInput(props: Common & { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const { routes } = useCms();
  const listId = useId();
  return (
    <>
      <TextInput {...props} list={listId} placeholder={props.placeholder ?? "/projects or https://…"} />
      <datalist id={listId}>
        {routes.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>
    </>
  );
}

/** An editable list of short strings, one input per item. */
export function ListField({
  label,
  hint,
  error,
  items,
  onChange,
  placeholder,
  multiline,
  max = 20,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  multiline?: boolean;
  max?: number;
}) {
  const set = (i: number, v: string) => onChange(items.map((x, j) => (j === i ? v : x)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...items];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <fieldset>
      <legend className="font-mono text-label uppercase text-ink-muted">{label}</legend>
      {hint ? <p className="mt-1 text-xs text-ink-faint">{hint}</p> : null}
      <ul className="mt-2 space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-1">
            {multiline ? (
              <textarea
                aria-label={`${label} ${i + 1}`}
                value={item}
                rows={2}
                placeholder={placeholder}
                onChange={(e) => set(i, e.target.value)}
                className={cn(control, "resize-y py-2 leading-relaxed")}
              />
            ) : (
              <input
                aria-label={`${label} ${i + 1}`}
                value={item}
                placeholder={placeholder}
                onChange={(e) => set(i, e.target.value)}
                className={cn(control, "h-9")}
              />
            )}
            <MoveButtons
              label={`item ${i + 1}`}
              onUp={i > 0 ? () => move(i, -1) : undefined}
              onDown={i < items.length - 1 ? () => move(i, 1) : undefined}
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              aria-label={`Remove ${label} ${i + 1}`}
              className="flex h-9 w-8 shrink-0 items-center justify-center text-ink-faint hover:text-acm-bright"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      {items.length < max ? (
        <Btn size="sm" className="mt-2" onClick={() => onChange([...items, ""])}>
          + Add
        </Btn>
      ) : null}
      {error ? <p className="mt-1.5 text-xs font-medium text-acm-bright">{error}</p> : null}
    </fieldset>
  );
}

/** A set of checkboxes over a fixed vocabulary (domains, roles…). */
export function Checkboxes({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
}) {
  return (
    <fieldset>
      <legend className="font-mono text-label uppercase text-ink-muted">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <label
              key={o}
              className={cn(
                "flex cursor-pointer items-center gap-2 border px-3 py-1.5 text-sm",
                on ? "border-acm text-ink" : "border-line text-ink-muted",
              )}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
                className="accent-[rgb(var(--acm))]"
              />
              {o}
            </label>
          );
        })}
      </div>
      {error ? <p className="mt-1.5 text-xs font-medium text-acm-bright">{error}</p> : null}
    </fieldset>
  );
}

type Obj = Record<string, unknown>;

/**
 * An ordered list of small records (milestones, directions, open roles…)
 * with add, move and remove. `render` draws one row's inputs.
 */
export function RowsEditor({
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
      <legend className="font-mono text-label uppercase text-ink-muted">{label}</legend>
      <ul className="mt-2 space-y-2">
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

/** Nested errors arrive keyed like "timeline.2.phase"; show the first per list. */
export function firstError(errors: Record<string, string>, prefix: string) {
  const key = Object.keys(errors).find((k) => k === prefix || k.startsWith(`${prefix}.`));
  if (!key) return undefined;
  const m = key.match(/\.(\d+)\.(\w+)$/);
  return m ? `Row ${Number(m[1]) + 1}, ${m[2].replace(/_/g, " ")}: ${errors[key]}` : errors[key];
}

/** Class for the small inputs inside a RowsEditor row. */
export const rowControl =
  "h-9 w-full border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-ghost focus:border-acm focus:outline-none";

/** A titled group inside a long form. */
export function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-5 border-t border-line pt-6 first:border-t-0 first:pt-0">
      <h3 className="font-mono text-label uppercase text-ink">{title}</h3>
      {children}
    </section>
  );
}
