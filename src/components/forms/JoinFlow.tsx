"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TextField, TextArea, ChipGroup } from "./Field";
import { Button } from "@/components/ui/Button";
import { MaskedHeadline } from "@/components/ui/MaskedHeadline";
import { DOMAINS } from "@/data/taxonomy";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Values = {
  name: string;
  course: string;
  year: string;
  interests: string[];
  skills: string;
  build: string;
  github: string;
  linkedin: string;
  why: string;
};

const EMPTY: Values = {
  name: "",
  course: "",
  year: "",
  interests: [],
  skills: "",
  build: "",
  github: "",
  linkedin: "",
  why: "",
};

type StepDef = {
  id: keyof Values | "links";
  label: string;
  title: string;
  hint: string;
};

const STEPS: StepDef[] = [
  { id: "name", label: "Name", title: "What should we call you?", hint: "Start with the easy one." },
  { id: "course", label: "Course", title: "What are you studying?", hint: "Course and year." },
  {
    id: "interests",
    label: "Interests",
    title: "What are you drawn to?",
    hint: "Pick anything that sounds interesting. This is not a commitment.",
  },
  { id: "skills", label: "Skills", title: "What can you already do?", hint: "Be honest — it makes the match better, and nothing here is a filter." },
  {
    id: "build",
    label: "Build",
    title: "What do you want to build?",
    hint: "A project, a problem, a vague direction — or say you have no idea. That is a valid answer.",
  },
  { id: "links", label: "Links", title: "Anywhere we can see your work?", hint: "Both optional. Not having one is normal." },
  { id: "why", label: "Why", title: "Why ACM?", hint: "One honest sentence beats three impressive ones." },
];

/**
 * Seven short steps rather than one long form. Each step asks one thing, which
 * keeps the whole application feeling like a conversation instead of an
 * administrative task.
 */
export function JoinFlow() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [values, setValues] = useState<Values>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const stepRef = useRef<HTMLDivElement>(null);

  const current = STEPS[step];

  /**
   * Move focus to the step's first field when the step changes — but never on
   * the initial render, where autofocusing would drop a keyboard or screen
   * reader user into the middle of the page, past the skip link and the
   * heading that explains what they are filling in.
   */
  useEffect(() => {
    if (step === 0) return;
    stepRef.current?.querySelector<HTMLElement>("input, textarea, button")?.focus();
  }, [step]);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setError(null);
  }

  function validate(): boolean {
    switch (current.id) {
      case "name":
        if (!values.name.trim()) return fail("Your name, please.");
        return true;
      case "course":
        if (!values.course.trim()) return fail("Course is required.");
        if (!values.year.trim()) return fail("Year is required.");
        return true;
      case "interests":
        if (values.interests.length === 0) return fail("Pick at least one — you can change your mind later.");
        return true;
      case "build":
        if (values.build.trim().length < 10) return fail("A sentence is enough. “I don't know yet” counts.");
        return true;
      case "why":
        if (values.why.trim().length < 10) return fail("One sentence.");
        return true;
      default:
        return true;
    }
  }

  function fail(message: string) {
    setError(message);
    return false;
  }

  function next() {
    if (!validate()) return;
    setDirection(1);
    if (step === STEPS.length - 1) setDone(true);
    else setStep((s) => s + 1);
  }

  function back() {
    setDirection(-1);
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  const variants = {
    enter: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * 28 }),
    center: reduce ? { opacity: 1 } : { opacity: 1, x: 0 },
    exit: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * -28 }),
  };

  if (done) {
    return (
      <motion.div
        className="shell py-24"
        initial={reduce ? undefined : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        role="status"
      >
        <div className="meta-accent">Application complete</div>
        <MaskedHeadline
          className="mt-8 text-display-lg"
          trigger="mount"
          delay={0.15}
          lines={[{ text: "WELCOME TO" }, { text: "THE BUILD.", className: "text-acm" }]}
        />

        <motion.div
          className="mt-14 grid gap-px bg-line lg:grid-cols-3"
          initial={reduce ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {[
            { t: "Read a problem", d: "Start where the work starts, not with a technology.", href: "/problems" },
            { t: "Pick a project", d: "Find one with an open role that sounds like you.", href: "/projects" },
            { t: "Or get matched", d: "Two questions and a shortlist, if you would rather not browse.", href: "/discover" },
          ].map((card, i) => (
            <Link key={card.t} href={card.href} className="group bg-void p-8 transition-colors hover:bg-surface/50">
              <span className="meta tnum text-acm">{String(i + 1).padStart(2, "0")}</span>
              <span className="mt-5 block text-xl font-semibold tracking-[-0.03em] transition-colors group-hover:text-acm-bright">
                {card.t}
              </span>
              <span className="mt-3 block text-sm leading-relaxed text-ink-muted">{card.d}</span>
            </Link>
          ))}
        </motion.div>

        <p className="mt-12 max-w-2xl border-t border-line pt-7 font-mono text-micro uppercase leading-relaxed text-ink-ghost">
          Demo notice · BuildHub has no backend yet, so nothing was transmitted or stored. This flow will be wired to a
          real endpoint before recruitment opens.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="shell py-16">
      {/* Step rail */}
      <div className="border-b border-line pb-5">
        <div className="flex items-center justify-between gap-4">
          <span className="meta tnum text-acm">
            Step {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
          </span>
          <span className="meta text-ink-ghost">{current.label}</span>
        </div>
        <div className="mt-4 flex gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s.id} className="h-0.5 flex-1 bg-line-strong">
              <motion.div
                className="h-0.5 origin-left bg-acm"
                initial={false}
                animate={{ scaleX: i <= step ? 1 : 0 }}
                transition={{ duration: reduce ? 0 : 0.4, ease }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="min-h-[22rem] py-14">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease }}
            ref={stepRef}
          >
            <h2 className="text-display-sm text-balance">{current.title}</h2>
            <p className="mt-4 max-w-prose text-[0.9375rem] leading-relaxed text-ink-muted">{current.hint}</p>

            <div className="mt-10 max-w-2xl">
              {current.id === "name" ? (
                <TextField
                  label="Name"
                  required
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && next()}
                  placeholder="Your full name"
                />
              ) : null}

              {current.id === "course" ? (
                <div className="grid gap-6 sm:grid-cols-[2fr_1fr]">
                  <TextField
                    label="Course"
                    required
                    value={values.course}
                    onChange={(e) => set("course", e.target.value)}
                    placeholder="B.Tech Computer Science"
                  />
                  <TextField
                    label="Year"
                    required
                    value={values.year}
                    onChange={(e) => set("year", e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && next()}
                    placeholder="2"
                  />
                </div>
              ) : null}

              {current.id === "interests" ? (
                <ChipGroup
                  label="Interests"
                  required
                  options={[...DOMAINS, "Leadership"]}
                  value={values.interests}
                  onToggle={(i) =>
                    set(
                      "interests",
                      values.interests.includes(i)
                        ? values.interests.filter((x) => x !== i)
                        : [...values.interests, i],
                    )
                  }
                />
              ) : null}

              {current.id === "skills" ? (
                <TextArea
                  label="Skills"
                  hint="Optional"
                  value={values.skills}
                  onChange={(e) => set("skills", e.target.value)}
                  placeholder="Python, a bit of React, I can read a paper without panicking…"
                />
              ) : null}

              {current.id === "build" ? (
                <TextArea
                  label="What do you want to build?"
                  required
                  value={values.build}
                  onChange={(e) => set("build", e.target.value)}
                  placeholder="Something with AI. Or: I genuinely don't know yet, I want to find out."
                />
              ) : null}

              {current.id === "links" ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  <TextField
                    label="GitHub"
                    hint="Optional"
                    value={values.github}
                    onChange={(e) => set("github", e.target.value)}
                    placeholder="github.com/username"
                  />
                  <TextField
                    label="LinkedIn"
                    hint="Optional"
                    value={values.linkedin}
                    onChange={(e) => set("linkedin", e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && next()}
                    placeholder="linkedin.com/in/username"
                  />
                </div>
              ) : null}

              {current.id === "why" ? (
                <TextArea
                  label="Why ACM?"
                  required
                  value={values.why}
                  onChange={(e) => set("why", e.target.value)}
                  placeholder="What made you open this page?"
                />
              ) : null}
            </div>

            <AnimatePresence>
              {error ? (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  role="alert"
                  className="mt-5 font-mono text-micro uppercase text-acm-bright"
                >
                  {error}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap items-center gap-5 border-t border-line pt-9">
        <Button size="lg" onClick={next} arrow>
          {step === STEPS.length - 1 ? "Finish" : "Continue"}
        </Button>
        <Button variant="ghost" onClick={back} className={cn(step === 0 && "pointer-events-none opacity-0")}>
          ← Back
        </Button>
        <span className="ml-auto font-mono text-micro uppercase text-ink-ghost">Demo form · nothing is sent</span>
      </div>
    </div>
  );
}
