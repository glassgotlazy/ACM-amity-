"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ease } from "@/lib/motion";

export function FinalCTA() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const shift = useTransform(scrollYProgress, [0, 1], ["6%", reduce ? "6%" : "-6%"]);

  return (
    <section ref={ref} className="relative overflow-hidden border-t border-line bg-surface/40" aria-labelledby="final">
      <div className="pointer-events-none absolute inset-0 grid-field opacity-40" aria-hidden />

      <div className="shell relative py-section">
        <h2 id="final" className="text-display-lg">
          {[
            { text: "DON'T JUST ADD ACM", accent: false },
            { text: "TO YOUR RESUME.", accent: false },
          ].map((line, i) => (
            <span key={line.text} className="block overflow-hidden pb-[0.06em]">
              <motion.span
                className="block text-ink-faint"
                initial={reduce ? undefined : { y: "110%" }}
                whileInView={{ y: "0%" }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.85, delay: i * 0.07, ease }}
              >
                {line.text}
              </motion.span>
            </span>
          ))}
          <span className="mt-6 block" />
          {["ADD WHAT YOU BUILT", "THROUGH ACM."].map((line, i) => (
            <span key={line} className="block overflow-hidden pb-[0.06em]">
              <motion.span
                className={`block ${i === 1 ? "text-acm" : ""}`}
                initial={reduce ? undefined : { y: "110%" }}
                whileInView={{ y: "0%" }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.85, delay: 0.16 + i * 0.07, ease }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h2>

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
          You don&rsquo;t need to know everything. You just need a problem worth caring about and the willingness to
          build.
        </p>
      </div>
    </section>
  );
}
