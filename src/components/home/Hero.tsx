"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ease } from "@/lib/motion";
import { PipelineGraph } from "./PipelineGraph";

const HEADLINE = ["BUILD SOMETHING", "WORTH SHOWING."];

const FOCUS = [
  "AI",
  "Software",
  "Research",
  "Quantum",
  "Cybersecurity",
  "Data",
  "Web",
  "Emerging Technology",
];

/** Each headline line wipes up from behind a clipping mask. */
function Line({ text, delay, accent }: { text: string; delay: number; accent?: boolean }) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <span className={`block ${accent ? "text-acm" : ""}`}>{text}</span>;
  }
  return (
    <span className="block overflow-hidden pb-[0.06em]">
      <motion.span
        className={`block ${accent ? "text-acm" : ""}`}
        initial={{ y: "110%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 0.95, delay, ease }}
      >
        {text}
      </motion.span>
    </span>
  );
}

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden rule-b">
      <div className="pointer-events-none absolute inset-0 grid-field grid-mask opacity-70" aria-hidden />

      <div className="shell relative pb-16 pt-32 sm:pt-40 lg:pb-20 lg:pt-44">
        <motion.div
          className="flex items-center gap-4"
          initial={reduce ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <span className="meta-accent">ACM @ Amity University</span>
          <span className="h-px w-10 bg-line-strong" aria-hidden />
          <span className="meta">BuildHub</span>
        </motion.div>

        {/* The headline runs the full width of the shell. Nothing sits beside
            it — the statement is the composition. */}
        <h1 className="mt-10 text-display-xl">
          <Line text={HEADLINE[0]} delay={0.12} />
          <Line text={HEADLINE[1]} delay={0.22} />
        </h1>

        <div className="mt-16 grid gap-14 border-t border-line pt-12 lg:grid-cols-[1.25fr_1fr] lg:gap-20">
          <div>
            <motion.div
              className="grid gap-8 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-12"
              initial={reduce ? undefined : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55, ease }}
            >
              <p className="max-w-[16rem] border-l border-acm pl-5 font-mono text-label uppercase leading-[1.9] text-ink">
                Real problems.
                <br />
                Real projects.
                <br />
                Real technical experience.
              </p>
              <p className="max-w-prose text-[1.0625rem] leading-relaxed text-ink-muted text-pretty">
                ACM @ Amity is a student-driven technical community where ideas become projects, projects become
                experience, and experience becomes something you can actually show.
              </p>
            </motion.div>

            <motion.div
              className="mt-12 flex flex-wrap items-center gap-3"
              initial={reduce ? undefined : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.68, ease }}
            >
              <Link
                href="/projects"
                className="group inline-flex h-14 items-center gap-3 bg-acm px-8 font-mono text-[0.75rem] uppercase tracking-[0.16em] text-white transition-colors duration-200 hover:bg-acm-bright"
              >
                Explore projects
                <span aria-hidden className="transition-transform duration-300 ease-out group-hover:translate-x-1">
                  →
                </span>
              </Link>
              <Link
                href="/problems"
                className="group inline-flex h-14 items-center gap-3 border border-line-strong px-8 font-mono text-[0.75rem] uppercase tracking-[0.16em] text-ink transition-colors duration-200 hover:border-acm hover:text-acm-bright"
              >
                Find a problem
                <span aria-hidden className="transition-transform duration-300 ease-out group-hover:translate-x-1">
                  →
                </span>
              </Link>
              <Link
                href="/join"
                className="inline-flex h-14 items-center px-4 font-mono text-[0.75rem] uppercase tracking-[0.16em] text-ink-muted underline decoration-line-strong underline-offset-8 transition-colors duration-200 hover:text-ink hover:decoration-acm"
              >
                Join ACM
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={reduce ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <PipelineGraph />
          </motion.div>
        </div>
      </div>

      {/* Focus areas as a hairline strip rather than a row of chips. */}
      <div className="relative border-t border-line">
        <div className="shell">
          <ul className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
            {FOCUS.map((item, i) => (
              <motion.li
                key={item}
                className="border-b border-line px-1 py-5 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:px-4 lg:py-6 [&:nth-child(2n)]:border-l sm:[&:nth-child(2n)]:border-l-0"
                initial={reduce ? undefined : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + i * 0.04 }}
              >
                <span className="block font-mono text-micro uppercase text-ink-ghost">{String(i + 1).padStart(2, "0")}</span>
                <span className="mt-2 block font-mono text-label uppercase text-ink-muted">{item}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
