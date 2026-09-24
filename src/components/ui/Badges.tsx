import { cn } from "@/lib/utils";
import { LEVELS, ORIGINS, STATUSES, type LevelId, type OriginId, type StatusId } from "@/data/taxonomy";

const toneDot: Record<string, string> = {
  live: "bg-signal-live",
  work: "bg-signal-work",
  idea: "bg-signal-idea",
  idle: "bg-ink-ghost",
};

const toneText: Record<string, string> = {
  live: "text-signal-live",
  work: "text-signal-work",
  idea: "text-signal-idea",
  idle: "text-ink-faint",
};

/** Status of a project or research effort. Always honest, never aspirational. */
export function StatusPill({ status, className }: { status: StatusId; className?: string }) {
  const s = STATUSES[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 label-sm", toneText[s.tone], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", toneDot[s.tone])} />
      {s.label}
    </span>
  );
}

/**
 * Provenance of a problem statement. This is a content-safety control as much
 * as a design element — it keeps unofficial problems visibly unofficial.
 */
export function OriginTag({ origin, className }: { origin: OriginId; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-line px-2.5 py-0.5 label-sm text-ink-faint",
        className,
      )}
    >
      {ORIGINS[origin]}
    </span>
  );
}

export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-surface-high/70 px-2.5 py-0.5 text-[0.8125rem] text-ink-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Four bars, filled to the level’s ordinal. Difficulty is about the shape of
 * the work, never about the person doing it.
 */
export function DifficultyMeter({
  level,
  showLabel = true,
  className,
}: {
  level: LevelId;
  showLabel?: boolean;
  className?: string;
}) {
  const current = LEVELS.find((l) => l.id === level)!;
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span className="flex items-end gap-[3px]" aria-hidden>
        {LEVELS.map((l) => (
          <span
            key={l.id}
            style={{ height: `${5 + l.ordinal * 3}px` }}
            className={cn("w-[3px] rounded-[1px]", l.ordinal <= current.ordinal ? "bg-acm" : "bg-line-strong")}
          />
        ))}
      </span>
      {showLabel ? (
        <span className="text-xs text-ink-muted">
          <span className="font-mono">L{current.ordinal}</span> {current.name}
        </span>
      ) : (
        <span className="sr-only">
          Level {current.ordinal}, {current.name}
        </span>
      )}
    </span>
  );
}
