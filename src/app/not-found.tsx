import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-field grid-mask opacity-50" aria-hidden />
      <div className="shell relative flex min-h-[70vh] flex-col justify-center py-32">
        <span className="meta text-acm">404 / Not found</span>
        <h1 className="mt-8 max-w-3xl text-display-md text-balance">
          This page doesn&rsquo;t exist. Several problems on campus still do.
        </h1>
        <p className="mt-8 max-w-prose text-[1.0625rem] leading-relaxed text-ink-muted">
          Either something moved, or the link was wrong. Either way, the Problem Lab is a better place to be.
        </p>
        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            href="/problems"
            className="group inline-flex h-14 items-center gap-3 bg-acm px-8 font-mono text-label uppercase text-white transition-colors duration-200 hover:bg-acm-bright"
          >
            Explore problems
            <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex h-14 items-center border border-line-strong px-8 font-mono text-label uppercase transition-colors duration-200 hover:border-acm hover:text-acm-bright"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
