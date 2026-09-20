"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ResearchStage } from "@/data/research";
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
export function ResearchTimeline({ stages }: { stages: ResearchStage[] }) {
  const reduce = useReducedMotion();

  return (
    <ol className="relative">
      {stages.map((stage, i) => (
        <motion.li
          key={stage.id}
          className="group relative grid gap-4 border-b border-line py-7 lg:grid-cols-[2rem_11rem_8rem_1fr] lg:items-baseline lg:gap-8"
          initial={reduce ? undefined : { opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.5 }}
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

          <h3
            className={cn(
              "font-mono text-label uppercase",
              stage.state === "open" ? "text-ink-ghost" : "text-ink",
            )}
          >
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

          <p
            className={cn(
              "max-w-prose text-[0.9375rem] leading-relaxed text-pretty",
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
