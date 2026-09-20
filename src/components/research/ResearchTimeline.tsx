"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ResearchStage } from "@/data/research";
import { viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

const STATE_LABEL: Record<ResearchStage["state"], string> = {
  done: "Complete",
  active: "In progress",
  open: "Not started",
};

/**
 * IDEA → LITERATURE → EXPERIMENT → ANALYSIS → PAPER. The stages a research
 * project actually moves through, with the honest position marked. Most
 * student research lives in the first two, and pretending otherwise helps
 * nobody.
 */
/**
 * `variant` is the container's width, not the viewport's. The four-column grid
 * needs a full content column; in a sidebar it would squeeze the detail text
 * into a ragged 70-pixel ribbon, so a narrow context stacks instead.
 */
export function ResearchTimeline({
  stages,
  variant = "wide",
}: {
  stages: ResearchStage[];
  variant?: "wide" | "compact";
}) {
  const reduce = useReducedMotion();
  const compact = variant === "compact";

  return (
    <ol className="relative">
      {stages.map((stage, i) => (
        <motion.li
          key={stage.id}
          className={cn(
            "group relative border-b border-line py-6",
            compact ? "grid grid-cols-[1.25rem_1fr] gap-x-4 gap-y-2" : "grid gap-4 lg:grid-cols-[2rem_11rem_8rem_1fr] lg:items-baseline lg:gap-8",
          )}
          initial={reduce ? undefined : { opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.45, delay: i * 0.07 }}
        >
          <span className="flex items-center gap-3">
            <span
              className={cn(
                "block h-2.5 w-2.5",
                stage.state === "done" && "bg-acm",
                stage.state === "active" && "animate-pulse-dot bg-acm",
                stage.state === "open" && "border border-line-strong",
              )}
              aria-hidden
            />
          </span>

          {compact ? (
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className={cn("font-mono text-label uppercase", stage.state === "open" ? "text-ink-ghost" : "text-ink")}>
                {stage.name}
              </h3>
              <span
                className={cn(
                  "font-mono text-micro uppercase",
                  stage.state === "active" ? "text-acm-bright" : "text-ink-ghost",
                )}
              >
                {STATE_LABEL[stage.state]}
              </span>
            </div>
          ) : (
            <>
              <h3 className={cn("font-mono text-label uppercase", stage.state === "open" ? "text-ink-ghost" : "text-ink")}>
                {stage.name}
              </h3>
              <span
                className={cn(
                  "font-mono text-micro uppercase",
                  stage.state === "active" ? "text-acm-bright" : "text-ink-ghost",
                )}
              >
                {STATE_LABEL[stage.state]}
              </span>
            </>
          )}

          <p
            className={cn(
              "max-w-prose text-[0.9375rem] leading-relaxed text-pretty",
              compact && "col-start-2",
              stage.state === "open" ? "text-ink-faint" : "text-ink-muted",
            )}
          >
            {stage.detail}
          </p>
        </motion.li>
      ))}
    </ol>
  );
}
