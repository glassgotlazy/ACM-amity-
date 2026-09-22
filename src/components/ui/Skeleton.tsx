import { cn } from "@/lib/utils";

/**
 * Loading placeholder in the site's own geometry — hairline rows, not grey
 * pills. Static under reduced motion because the shimmer is an animation.
 */
export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div aria-hidden style={style} className={cn("relative overflow-hidden bg-surface-raised", className)}>
      <span
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-line-strong to-transparent motion-safe:animate-sweep"
        aria-hidden
      />
    </div>
  );
}

/** Mirrors PageHeader's shape so the swap to real content does not jump. */
export function PageHeaderSkeleton({ meta = 4 }: { meta?: number }) {
  return (
    <header className="rule-b">
      <div className="shell pb-16 pt-32 sm:pt-40">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-8 h-14 w-full max-w-3xl sm:h-20" />
        <Skeleton className="mt-4 h-14 w-2/3 max-w-2xl sm:h-20" />
        <Skeleton className="mt-8 h-5 w-full max-w-2xl" />
        <Skeleton className="mt-3 h-5 w-3/4 max-w-xl" />
        <div className="mt-14 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
          {Array.from({ length: meta }, (_, i) => (
            <div key={i} className="bg-void px-5 py-5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-3 h-6 w-10" />
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}

/** A filter bar plus N list rows, matching the index pages. */
export function IndexSkeleton({ rows = 5, cards = false }: { rows?: number; cards?: boolean }) {
  return (
    <section className="shell py-14" aria-busy="true" aria-label="Loading">
      <div className="flex flex-wrap gap-2 border-b border-line pb-4">
        {[64, 112, 96, 80, 128, 72, 88].map((width, i) => (
          <Skeleton key={i} className="h-8" style={{ width }} />
        ))}
      </div>
      <div className={cn("mt-10", cards ? "grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3" : "space-y-px")}>
        {Array.from({ length: rows }, (_, i) =>
          cards ? (
            <div key={i} className="bg-void p-6">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-5 h-6 w-3/4" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-5/6" />
              <Skeleton className="mt-6 h-3 w-1/2" />
            </div>
          ) : (
            <div key={i} className="border-b border-line py-8">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="mt-4 h-7 w-1/2" />
              <Skeleton className="mt-3 h-4 w-3/4" />
            </div>
          ),
        )}
      </div>
    </section>
  );
}
