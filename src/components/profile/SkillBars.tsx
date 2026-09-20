"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { viewportOnce } from "@/lib/motion";

const LEVEL_WORD = ["", "Learning", "Working", "Comfortable", "Strong", "Deep"];

/**
 * Five segments per skill. Self-assessed and labelled as such — a number
 * without a word beside it invites more confidence than it has earned.
 */
export function SkillBars({ skills }: { skills: { name: string; level: number }[] }) {
  const reduce = useReducedMotion();

  return (
    <div>
      <ul className="space-y-px bg-line">
        {skills.map((skill, i) => (
          <motion.li
            key={skill.name}
            className="grid items-center gap-4 bg-void py-5 sm:grid-cols-[1fr_auto_8rem] sm:gap-8"
            initial={reduce ? undefined : { opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.4, delay: i * 0.06 }}
          >
            <span className="text-[0.9375rem] font-medium tracking-[-0.01em]">{skill.name}</span>

            <span className="flex gap-1.5" aria-hidden>
              {Array.from({ length: 5 }, (_, seg) => (
                <motion.span
                  key={seg}
                  className={cn("h-1.5 w-8", seg < skill.level ? "bg-acm" : "bg-line-strong")}
                  initial={reduce ? undefined : { scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={viewportOnce}
                  transition={{ duration: 0.35, delay: 0.1 + i * 0.06 + seg * 0.04 }}
                  style={{ originX: 0 }}
                />
              ))}
            </span>

            <span className="font-mono text-micro uppercase text-ink-ghost sm:text-right">
              {LEVEL_WORD[skill.level]}
            </span>
          </motion.li>
        ))}
      </ul>
      <p className="mt-6 font-mono text-micro uppercase text-ink-ghost">
        Self-assessed. Useful for matching people to work, not for ranking them.
      </p>
    </div>
  );
}
