"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { CONTRIBUTION_MODEL, TRACKED } from "@/data/profile";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowLink } from "@/components/ui/ArrowLink";

export function ContributionPitch() {
  const reduce = useReducedMotion();

  return (
    <section className="border-y border-line bg-surface/30" aria-labelledby="contribution">
      <div className="shell py-section">
        <SectionHeading
          index="05"
          eyebrow="Contribution"
          title={
            <span id="contribution">
              YOUR MEMBERSHIP SAYS YOU JOINED.
              <br />
              YOUR CONTRIBUTIONS SHOW WHAT YOU DID.
            </span>
          }
          lede="Every project you touch through ACM leaves a trace — a commit, a review, a write-up, a deployed service. This platform exists to keep that record, so you leave with evidence rather than a line on a list."
          align="wide"
          action={<ArrowLink href="/profile">See a profile</ArrowLink>}
        />

        <div className="mt-14 grid gap-px bg-line lg:grid-cols-2">
          {CONTRIBUTION_MODEL.map((entry, i) => (
            <motion.div
              key={entry.kind}
              className="relative bg-void p-9 lg:p-12"
              initial={reduce ? undefined : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
            >
              {entry.tone === "accent" ? (
                <span aria-hidden className="absolute left-0 top-0 h-full w-px bg-acm" />
              ) : null}
              <div className={entry.tone === "accent" ? "meta-accent" : "meta"}>{entry.kind}</div>
              <p
                className={`mt-6 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl ${
                  entry.tone === "accent" ? "text-ink" : "text-ink-faint"
                }`}
              >
                “{entry.claim}”
              </p>
              <p className="mt-6 max-w-prose text-sm leading-relaxed text-ink-muted">{entry.evidence}</p>
            </motion.div>
          ))}
        </div>

        <Reveal className="mt-14">
          <div className="meta border-b border-line pb-3">What a contribution record can hold</div>
          <ul className="mt-6 grid gap-x-10 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
            {TRACKED.map((item, i) => (
              <motion.li
                key={item}
                className="flex items-baseline gap-3 border-b border-line-faint py-2.5 text-sm text-ink-muted"
                initial={reduce ? undefined : { opacity: 0, x: -6 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
              >
                <span className="meta tnum text-ink-ghost">{String(i + 1).padStart(2, "0")}</span>
                {item}
              </motion.li>
            ))}
          </ul>
          <p className="mt-6 font-mono text-micro uppercase text-ink-ghost">
            Contribution tracking is not wired to a live source yet — the profile you can view is demo content.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
