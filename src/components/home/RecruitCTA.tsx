"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { MaskedHeadline } from "@/components/ui/MaskedHeadline";
import { viewportOnce } from "@/lib/motion";

export function RecruitCTA() {
  const reduce = useReducedMotion();

  return (
    <section className="shell py-section" aria-labelledby="recruit">
      <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:items-end">
        <MaskedHeadline
          id="recruit"
          className="text-display-md"
          lines={[
            { text: "YOUR NEXT PROJECT" },
            { text: "DOESN'T HAVE TO BE" },
            { text: "A COLLEGE ASSIGNMENT.", className: "text-ink-faint" },
          ]}
        />

        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p className="max-w-sm text-[1.0625rem] leading-relaxed text-ink-muted">
            Build something. Research something. Solve something.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/join"
              className="group inline-flex items-center gap-3 bg-acm px-7 py-4 font-mono text-label uppercase text-white transition-colors duration-200 hover:bg-acm-bright"
            >
              Join ACM
              <span aria-hidden className="transition-transform duration-300 ease-out group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href="/problems"
              className="group inline-flex items-center gap-3 border border-line-strong px-7 py-4 font-mono text-label uppercase transition-colors duration-200 hover:border-acm hover:text-acm-bright"
            >
              Explore problems
              <span aria-hidden className="transition-transform duration-300 ease-out group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
