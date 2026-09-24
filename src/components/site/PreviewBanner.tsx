"use client";

import { usePathname } from "next/navigation";

/** Shown to an admin viewing the site in preview, where drafts are visible. */
export function PreviewBanner() {
  const path = usePathname() ?? "/";
  if (path.startsWith("/admin")) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-[300] flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-signal-work/60 bg-void/95 px-4 py-2.5 text-sm backdrop-blur"
    >
      <span className="label-sm text-signal-work">Preview</span>
      <span className="text-ink-muted">Unpublished drafts are shown. Visitors do not see them.</span>
      <a href={`/api/preview-exit?path=${encodeURIComponent(path)}`} className="font-medium text-ink underline underline-offset-4 hover:text-acm-bright">
        Exit preview
      </a>
    </div>
  );
}
