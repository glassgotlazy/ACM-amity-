"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { api, ApiError, explain } from "./api";
import { Btn, ConfirmDialog, Drawer, EmptyState, ErrorState, LoadingRows, useToast } from "./kit";

export type MediaUse = "logo" | "favicon" | "avatar" | "cover" | "qr";

type MediaFile = { path: string; url: string; size: number | null; created_at: string | null };

/** Mirrors MEDIA_USES on the server, for the hint under each upload button. */
export const USE_HINT: Record<MediaUse, string> = {
  logo: "PNG, WebP or JPEG · up to 1 MB · 32–2000 px",
  favicon: "Square PNG or ICO · up to 256 KB · 16–512 px",
  avatar: "JPEG, PNG or WebP · up to 2 MB · at least 160×160 px",
  cover: "JPEG, PNG or WebP · up to 2 MB · at least 480×240 px",
  qr: "Square PNG or WebP · up to 500 KB · at least 200 px",
};

const USE_LABEL: Record<MediaUse, string> = {
  logo: "Logo",
  favicon: "Favicon",
  avatar: "Team photo",
  cover: "Cover image",
  qr: "QR code",
};

async function upload(file: File, use: MediaUse): Promise<MediaFile> {
  const form = new FormData();
  form.set("file", file);
  form.set("use", use);
  const body = await api<{ file: MediaFile }>("/api/admin/media", { method: "POST", body: form });
  return body.file;
}

function uploadError(error: unknown) {
  return error instanceof ApiError && error.errors.file ? error.errors.file : explain(error);
}

function useMediaList(enabled: boolean) {
  const [files, setFiles] = useState<MediaFile[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const load = useCallback(async () => {
    setError(null);
    try {
      setFiles((await api<{ files: MediaFile[] }>("/api/admin/media")).files);
    } catch (e) {
      setError(e);
    }
  }, []);
  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);
  return { files, setFiles, error, load };
}

/**
 * Image picker used by every CMS form: shows the current image, uploads a
 * new one (validated on the server), or picks one already in the library.
 */
export function ImageField({
  label,
  value,
  onChange,
  use,
  error,
  hint,
  savesItself,
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  use: MediaUse;
  error?: string;
  hint?: string;
  /** The form saves this field on change itself; skip the "not saved" warning. */
  savesItself?: boolean;
}) {
  const toast = useToast();
  // What the field held when the form opened: a different value means the
  // new image is not on the site until the form is saved.
  const initial = useRef(value);
  const unsaved = !savesItself && value !== initial.current;
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const id = useId();

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setProblem(null);
    try {
      const uploaded = await upload(file, use);
      onChange(uploaded.url);
      toast("ok", savesItself ? `${USE_LABEL[use]} uploaded.` : `${USE_LABEL[use]} uploaded — click Save to put it on the site.`);
    } catch (e) {
      setProblem(uploadError(e));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <div id={id} className="font-mono text-label uppercase text-ink-muted">
        {label}
      </div>
      <div className="mt-2 flex items-start gap-4">
        <div
          className={cn(
            "flex shrink-0 items-center justify-center overflow-hidden border border-line bg-surface",
            use === "cover" ? "h-20 w-32" : "h-20 w-20",
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={`Current ${label.toLowerCase()}`} className="h-full w-full object-contain" />
          ) : (
            <span className="font-mono text-micro uppercase text-ink-ghost">None</span>
          )}
        </div>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Btn size="sm" onClick={() => input.current?.click()} disabled={busy} aria-describedby={id}>
              {busy ? "Uploading…" : "Upload"}
            </Btn>
            <Btn size="sm" onClick={() => setPicking(true)} disabled={busy}>
              Library
            </Btn>
            {value ? (
              <Btn size="sm" tone="ghost" onClick={() => onChange(null)} disabled={busy}>
                Remove
              </Btn>
            ) : null}
          </div>
          <p className="text-xs text-ink-faint">{hint ?? USE_HINT[use]}</p>
          {unsaved ? (
            <p role="status" className="text-xs font-medium text-signal-work">
              Not on the site yet — click Save below to apply this image.
            </p>
          ) : null}
          {problem || error ? (
            <p role="alert" className="text-xs font-medium text-acm-bright">
              {problem ?? error}
            </p>
          ) : null}
        </div>
        <input
          ref={input}
          type="file"
          accept={use === "favicon" ? "image/png,image/x-icon,.ico" : "image/png,image/jpeg,image/webp"}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>
      <LibraryPicker
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(url) => {
          onChange(url);
          setPicking(false);
        }}
      />
    </div>
  );
}

/**
 * Several photos in order (an event's gallery): add by upload or from the
 * library, move, remove. Saved with the rest of the form.
 */
export function GalleryField({
  label,
  value,
  onChange,
  error,
  max = 24,
}: {
  label: string;
  value: string[];
  onChange: (urls: string[]) => void;
  error?: string;
  max?: number;
}) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const id = useId();
  const full = value.length >= max;

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setProblem(null);
    const added: string[] = [];
    try {
      for (const file of Array.from(files).slice(0, max - value.length)) {
        added.push((await upload(file, "cover")).url);
      }
      toast("ok", `${added.length} photo${added.length === 1 ? "" : "s"} added — click Save to put them on the site.`);
    } catch (e) {
      setProblem(uploadError(e));
    } finally {
      if (added.length) onChange([...value, ...added]);
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };

  return (
    <div>
      <div id={id} className="font-mono text-label uppercase text-ink-muted">
        {label}
      </div>
      {value.length ? (
        <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((url, i) => (
            <li key={`${url}-${i}`} className="border border-line bg-surface p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Photo ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
              <div className="mt-1 flex justify-between">
                <span className="flex">
                  <Btn size="sm" tone="ghost" className="px-2" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move photo ${i + 1} earlier`}>
                    ←
                  </Btn>
                  <Btn size="sm" tone="ghost" className="px-2" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label={`Move photo ${i + 1} later`}>
                    →
                  </Btn>
                </span>
                <Btn size="sm" tone="ghost" className="px-2 hover:text-acm-bright" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove photo ${i + 1}`}>
                  ✕
                </Btn>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-ink-faint">No photos yet.</p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        <Btn size="sm" onClick={() => input.current?.click()} disabled={busy || full} aria-describedby={id}>
          {busy ? "Uploading…" : "Upload photos"}
        </Btn>
        <Btn size="sm" onClick={() => setPicking(true)} disabled={busy || full}>
          Add from library
        </Btn>
      </div>
      <p className="mt-2 text-xs text-ink-faint">
        {USE_HINT.cover} · up to {max} photos
      </p>
      {problem || error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-acm-bright">
          {problem ?? error}
        </p>
      ) : null}
      <input
        ref={input}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => onFiles(e.target.files)}
      />
      <LibraryPicker
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(url) => {
          onChange([...value, url]);
          setPicking(false);
        }}
      />
    </div>
  );
}

function LibraryPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (url: string) => void }) {
  const { files, error, load } = useMediaList(open);
  return (
    <Drawer open={open} title="Choose from media library" onClose={onClose} footer={<Btn onClick={onClose}>Cancel</Btn>}>
      {error ? (
        <ErrorState error={error} retry={load} />
      ) : !files ? (
        <LoadingRows />
      ) : files.length === 0 ? (
        <EmptyState title="The library is empty">Upload an image from any image field, or from Media.</EmptyState>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {files.map((f) => (
            <li key={f.path}>
              <button
                type="button"
                onClick={() => onPick(f.url)}
                className="group block w-full border border-line bg-surface p-2 text-left hover:border-acm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt="" loading="lazy" className="aspect-square w-full object-contain" />
                <span className="mt-2 block truncate font-mono text-micro uppercase text-ink-faint group-hover:text-ink">
                  {f.path}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}

/** The Media page: every uploaded file, upload by purpose, copy link, delete. */
export function MediaLibrary() {
  const toast = useToast();
  const { files, setFiles, error, load } = useMediaList(true);
  const [use, setUse] = useState<MediaUse>("cover");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [doomed, setDoomed] = useState<MediaFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setProblem(null);
    try {
      const uploaded = await upload(file, use);
      setFiles((f) => [uploaded, ...(f ?? [])]);
      toast("ok", "Image uploaded.");
    } catch (e) {
      setProblem(uploadError(e));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove() {
    if (!doomed) return;
    setDeleting(true);
    try {
      await api(`/api/admin/media?path=${encodeURIComponent(doomed.path)}`, { method: "DELETE" });
      setFiles((f) => (f ?? []).filter((x) => x.path !== doomed.path));
      toast("ok", "Image deleted.");
      setDoomed(null);
    } catch (e) {
      toast("error", explain(e));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end gap-3 border border-line bg-surface p-5">
        <label className="block">
          <span className="block font-mono text-label uppercase text-ink-muted">Upload as</span>
          <select
            value={use}
            onChange={(e) => setUse(e.target.value as MediaUse)}
            className="mt-2 h-10 border border-line bg-void px-3 text-sm text-ink focus:border-acm focus:outline-none"
          >
            {(Object.keys(USE_LABEL) as MediaUse[]).map((u) => (
              <option key={u} value={u}>
                {USE_LABEL[u]}
              </option>
            ))}
          </select>
        </label>
        <Btn tone="primary" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? "Uploading…" : "Upload image"}
        </Btn>
        <p className="basis-full text-xs text-ink-faint">{USE_HINT[use]}</p>
        {problem ? (
          <p role="alert" className="basis-full text-xs font-medium text-acm-bright">
            {problem}
          </p>
        ) : null}
        <input
          ref={input}
          type="file"
          accept={use === "favicon" ? "image/png,image/x-icon,.ico" : "image/png,image/jpeg,image/webp"}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>

      {error ? (
        <ErrorState error={error} retry={load} />
      ) : !files ? (
        <LoadingRows />
      ) : files.length === 0 ? (
        <EmptyState title="No images yet">Uploaded logos, photos and cover images appear here.</EmptyState>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {files.map((f) => (
            <li key={f.path} className="border border-line bg-surface p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt="" loading="lazy" className="aspect-square w-full bg-void object-contain" />
              <div className="mt-3 truncate font-mono text-micro uppercase text-ink-faint" title={f.path}>
                {f.path}
              </div>
              <div className="mt-1 text-xs text-ink-ghost">
                {f.size ? `${Math.max(1, Math.round(f.size / 1000))} KB` : ""}
              </div>
              <div className="mt-3 flex gap-2">
                <Btn
                  size="sm"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(f.url);
                      toast("ok", "Link copied.");
                    } catch {
                      toast("error", "Could not copy. Select the link from the file name instead.");
                    }
                  }}
                >
                  Copy link
                </Btn>
                <Btn size="sm" tone="danger" onClick={() => setDoomed(f)} aria-label={`Delete ${f.path}`}>
                  Delete
                </Btn>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={doomed !== null}
        title="Delete this image?"
        busy={deleting}
        onConfirm={remove}
        onClose={() => setDoomed(null)}
      >
        Anything still using it on the site will show no image. This cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
