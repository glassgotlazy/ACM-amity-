"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { PROBLEM_CATEGORIES } from "@/data/taxonomy";
import { problems } from "@/data/problems";
import { ProblemCard } from "@/components/problems/ProblemCard";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { MaskedHeadline } from "@/components/ui/MaskedHeadline";
import { viewportOnce } from "@/lib/motion";

/**
 * The Problem Lab is the argument the whole site rests on, so it gets the
 * full-bleed treatment: its own dark field, its own numbering, and a headline
 * that is larger than anything else on the page apart from the hero.
 */
export function ProblemLabIntro() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const drift = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-14%"]);

  return (
    <section ref={ref} className="relative overflow-hidden border-y border-line bg-surface/30" aria-labelledby="problem-lab">
      <div className="pointer-events-none absolute inset-0 grid-field opacity-50" aria-hidden />

      <div className="shell relative py-section">
        <div className="flex items-baseline gap-4">
          <span className="meta text-acm-bright">02 /</span>
          <span className="meta">Problem Lab</span>
        </div>

        <MaskedHeadline
          className="mt-10 text-display-md"
          id="problem-lab"
          lines={[{ text: "DON'T START WITH AN IDEA." }, { text: "START WITH A PROBLEM.", className: "text-acm-bright" }]}
        />

        <div className="mt-14 grid gap-14 lg:grid-cols-[1.35fr_1fr] lg:gap-20">
          <div>
            <Reveal delay={0.1} className="max-w-prose space-y-5 text-[1.0625rem] leading-relaxed text-ink-muted text-pretty">
              <p>
                Universities are rapidly adopting AI, automation, digital platforms and data-driven systems. That
                creates new challenges that still need better solutions.
              </p>
              <p className="text-ink">Find a problem worth solving.</p>
            </Reveal>

            <Reveal delay={0.16} className="mt-9">
              <ArrowLink href="/problems" tone="accent">
                Enter the Problem Lab
              </ArrowLink>
            </Reveal>
          </div>

          <motion.div style={{ y: drift }} className="lg:pt-4">
            <div className="meta border-b border-line pb-3">Categories</div>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-3">
              {PROBLEM_CATEGORIES.map((category, i) => (
                <motion.li
                  key={category}
                  initial={reduce ? undefined : { opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewportOnce}
                  transition={{ duration: 0.4, delay: i * 0.035 }}
                >
                  <Link
                    href="/problems"
                    className="font-mono text-label uppercase text-ink-faint transition-colors duration-200 hover:text-acm-bright"
                  >
                    {category}
                  </Link>
                </motion.li>
              ))}
            </ul>

            <div className="mt-12 border-t border-line pt-6">
              <p className="font-mono text-micro uppercase leading-relaxed text-ink-ghost">
                These are student-written explorations. None of them is an official or confirmed university brief.
              </p>
            </div>
          </motion.div>
        </div>

        <div className="mt-20 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {problems.slice(0, 6).map((problem, i) => (
            <ProblemCard key={problem.slug} problem={problem} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
