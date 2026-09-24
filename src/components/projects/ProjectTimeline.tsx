"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Milestone } from "@/lib/cms/types";
import { cn } from "@/lib/utils";
import { viewportOnce } from "@/lib/motion";

const STATE_LABEL: Record<Milestone["state"], string> = {
  done: "Complete",
  active: "In progress",
  next: "Next",
  later: "Later",
};

/**
 * A horizontal rail on desktop, vertical on mobile. The connecting line draws
 * only as far as the work has actually got — the shape of the line is the
 * status report.
 */
export function ProjectTimeline({ milestones }: { milestones: Milestone[] }) {
  const reduce = useReducedMotion();
  const lastDone = milestones.reduce((acc, m, i) => (m.state === "done" || m.state === "active" ? i : acc), 0);
  // Markers sit at the START of their grid column, so marker i is at
  // i / count of the rail — not i / (count - 1). The extra 7px carries the
  // line to the centre of the 15px marker instead of stopping at its edge.
  const fill = `calc(${(lastDone / milestones.length) * 100}% + 7px)`;

  return (
    <div className="relative">
      {/* Desktop rail */}
      <div className="relative hidden lg:block">
        <div className="absolute left-0 right-0 top-[7px] h-px bg-line-strong" aria-hidden />
        <motion.div
          className="absolute left-0 top-[7px] h-px origin-left bg-acm"
          style={{ width: fill }}
          initial={reduce ? undefined : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        />

        <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${milestones.length}, minmax(0, 1fr))` }}>
          {milestones.map((m, i) => (
            <motion.li
              key={m.phase}
              className="pr-8"
              initial={reduce ? undefined : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.45, delay: 0.15 + i * 0.09 }}
            >
              <span
                className={cn(
                  "block h-[15px] w-[15px] border",
                  m.state === "done" && "border-acm bg-acm",
                  m.state === "active" && "animate-pulse-dot border-acm bg-void",
                  (m.state === "next" || m.state === "later") && "border-line-strong bg-void",
                )}
                aria-hidden
              />
              <h3 className="mt-5 text-base font-semibold tracking-[-0.02em]">{m.phase}</h3>
              <p
                className={cn(
                  "mt-1.5 font-mono text-micro uppercase",
                  m.state === "active" ? "text-acm-bright" : "text-ink-ghost",
                )}
              >
                {STATE_LABEL[m.state]}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{m.detail}</p>
            </motion.li>
          ))}
        </ol>
      </div>

      {/* Mobile rail */}
      <ol className="relative space-y-8 border-l border-line-strong pl-7 lg:hidden">
        {milestones.map((m, i) => (
          <motion.li
            key={m.phase}
            className="relative"
            initial={reduce ? undefined : { opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.4, delay: i * 0.06 }}
          >
            <span
              className={cn(
                "absolute -left-[35px] top-1 block h-[13px] w-[13px] border",
                m.state === "done" && "border-acm bg-acm",
                m.state === "active" && "border-acm bg-void",
                (m.state === "next" || m.state === "later") && "border-line-strong bg-void",
              )}
              aria-hidden
            />
            <h3 className="text-base font-semibold tracking-[-0.02em]">{m.phase}</h3>
            <p
              className={cn(
                "mt-1 font-mono text-micro uppercase",
                m.state === "active" ? "text-acm-bright" : "text-ink-ghost",
              )}
            >
              {STATE_LABEL[m.state]}
            </p>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">{m.detail}</p>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
