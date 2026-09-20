import { cn } from "@/lib/utils";

/**
 * A figure with its label. Every number on this site is either structural
 * (a count of things on the page) or explicitly marked demo data — the `note`
 * slot exists so that qualification is never optional.
 */
export function Stat({
  value,
  label,
  note,
  className,
  accent,
}: {
  value: string | number;
  label: string;
  note?: string;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div className={cn("", className)}>
      <div className="meta">{label}</div>
      <div className={cn("mt-3 text-4xl tnum tracking-[-0.03em]", accent ? "text-acm" : "text-ink")}>{value}</div>
      {note ? <div className="mt-2 font-mono text-micro uppercase text-ink-ghost">{note}</div> : null}
    </div>
  );
}
