"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { MaskedHeadline } from "@/components/ui/MaskedHeadline";

export function FinalCTA() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const shift = useTransform(scrollYProgress, [0, 1], ["6%", reduce ? "6%" : "-6%"]);

  return (
    <section ref={ref} className="relative overflow-hidden border-t border-line bg-surface/40" aria-labelledby="final">
      <div className="pointer-events-none absolute inset-0 grid-field opacity-40" aria-hidden />

      <div className="shell relative py-section">
        <MaskedHeadline
          id="final"
          as="h2"
          className="text-display-lg"
          lines={[
            { text: "DON’T JUST ADD ACM", className: "text-ink-faint" },
            { text: "TO YOUR RESUME.", className: "text-ink-faint" },
          ]}
        />

        <MaskedHeadline
          as="h3"
          className="mt-8 text-display-lg"
          delay={0.12}
          lines={[{ text: "ADD WHAT YOU BUILT" }, { text: "THROUGH ACM.", className: "text-acm-bright" }]}
        />

        <motion.div
          style={{ x: shift }}
          className="mt-20 flex flex-wrap items-baseline gap-x-10 gap-y-4 border-t border-line pt-10"
        >
          {["Build", "Research", "Learn", "Collaborate"].map((word) => (
            <span key={word} className="font-mono text-label uppercase text-ink-ghost">
              {word}
            </span>
          ))}
        </motion.div>

        <p className="mt-10 max-w-xl text-[1.0625rem] leading-relaxed text-ink-muted text-pretty">
          You don’t need to know everything. You just need a problem worth caring about and the willingness to
          build.
        </p>
      </div>
    </section>
  );
}
