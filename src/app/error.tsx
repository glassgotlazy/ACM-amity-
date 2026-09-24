"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Route-level boundary. Catches render errors below the root layout, so the
 * navbar, footer and theme stay up and the person can recover in place.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Server logs carry the digest; the browser console gets the full error.
    console.error(error);
  }, [error]);

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-field grid-mask opacity-50" aria-hidden />
      <div className="shell relative flex min-h-[70vh] flex-col justify-center py-32">
        <span className="meta text-acm-bright">Error</span>
        <h1 className="mt-8 max-w-3xl text-display-md text-balance">
          Something broke on this page. Not the kind of problem we meant.
        </h1>
        <p className="mt-8 max-w-prose text-[1.0625rem] leading-relaxed text-ink-muted">
          Retrying usually clears it. If it keeps happening, the rest of the site still works.
        </p>
        {error.digest ? (
          <p className="mt-4 label-sm text-ink-ghost">Reference {error.digest}</p>
        ) : null}
        <div className="mt-12 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="group inline-flex h-14 items-center gap-3 bg-acm-solid px-8 label text-white transition-colors duration-200 hover:bg-acm-deep"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-14 items-center border border-line-strong px-8 label transition-colors duration-200 hover:border-acm hover:text-acm-bright"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
