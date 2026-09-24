"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

type Props = {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  /** Optional counts shown beside each option. */
  counts?: Record<string, number>;
  layoutId?: string;
  className?: string;
};

/**
 * A row of filters with a shared sliding indicator rather than per-item
 * backgrounds — quieter than pill buttons, and it makes the active state
 * feel continuous as it moves.
 */
export function FilterBar({ options, value, onChange, label, counts, layoutId = "filter", className }: Props) {
  const reduce = useReducedMotion();

  return (
    <div className={cn("flex flex-wrap items-center gap-x-1 gap-y-2", className)} role="group" aria-label={label}>
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={active}
            className={cn(
              "relative px-3 py-2 label transition-colors duration-200",
              active ? "text-ink" : "text-ink-faint hover:text-ink-muted",
            )}
          >
            {active && !reduce ? (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 border border-line-strong bg-surface-raised"
                transition={{ type: "spring", stiffness: 500, damping: 42 }}
              />
            ) : null}
            {active && reduce ? <span className="absolute inset-0 border border-line-strong bg-surface-raised" /> : null}
            <span className="relative z-10">{option}</span>
            {counts?.[option] !== undefined ? (
              <span className={cn("relative z-10 ml-2 tnum", active ? "text-acm-bright" : "text-ink-ghost")}>
                {counts[option]}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
