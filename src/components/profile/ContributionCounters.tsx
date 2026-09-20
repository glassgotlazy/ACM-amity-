"use client";

import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Contribution } from "@/data/profile";
import { viewportOnce } from "@/lib/motion";

/** Counts up once when scrolled into view. Static under reduced motion. */
function Counter({ to }: { to: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [value, setValue] = useState(reduce ? to : 0);

  useEffect(() => {
    if (reduce || !inView) return;
    const controls = animate(0, to, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to, reduce]);

  return (
    <span ref={ref} className="tnum">
      {value}
    </span>
  );
}

export function ContributionCounters({ contributions }: { contributions: Contribution[] }) {
  const reduce = useReducedMotion();

  return (
    <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
      {contributions.map((c, i) => (
        <motion.div
          key={c.label}
          className="bg-void p-7"
          initial={reduce ? undefined : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.45, delay: i * 0.07 }}
        >
          <div className="meta">{c.label}</div>
          <div className="mt-5 flex items-baseline gap-2.5">
            <span className="text-5xl tracking-[-0.04em] text-ink">
              <Counter to={c.value} />
            </span>
            <span className="font-mono text-micro uppercase text-acm-bright">{c.unit}</span>
          </div>
          <p className="mt-4 font-mono text-micro uppercase text-ink-ghost">{c.note}</p>
        </motion.div>
      ))}
    </div>
  );
}
