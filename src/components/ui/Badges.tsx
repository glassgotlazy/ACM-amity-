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
    <span className={cn("inline-flex items-center gap-2 font-mono text-micro uppercase", toneText[s.tone], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", toneDot[s.tone], s.tone !== "idle" && "animate-pulse-dot")} />
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
        "inline-flex items-center border border-line px-2.5 py-1 font-mono text-micro uppercase text-ink-faint",
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
        "inline-flex items-center border border-line px-2.5 py-1 font-mono text-micro uppercase text-ink-muted transition-colors duration-200 hover:border-line-strong hover:text-ink",
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
            className={cn("w-[3px]", l.ordinal <= current.ordinal ? "bg-acm" : "bg-line-strong")}
          />
        ))}
      </span>
      {showLabel ? (
        <span className="font-mono text-micro uppercase text-ink-muted">
          L{current.ordinal} {current.name}
        </span>
      ) : (
        <span className="sr-only">
          Level {current.ordinal}, {current.name}
        </span>
      )}
    </span>
  );
}
