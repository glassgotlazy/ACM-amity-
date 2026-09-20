"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { TextField, TextArea, SelectField, Checkbox } from "./Field";
import { Button } from "@/components/ui/Button";
import { PROBLEM_CATEGORIES } from "@/data/taxonomy";

type Values = {
  what: string;
  where: string;
  who: string;
  why: string;
  solution: string;
  technologies: string;
  area: string;
  name: string;
  email: string;
};

const EMPTY: Values = {
  what: "",
  where: "",
  who: "",
  why: "",
  solution: "",
  technologies: "",
  area: PROBLEM_CATEGORIES[0],
  name: "",
  email: "",
};

export function ProblemForm() {
  const reduce = useReducedMotion();
  const [values, setValues] = useState<Values>(EMPTY);
  const [anonymous, setAnonymous] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [sent, setSent] = useState(false);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: Partial<Record<keyof Values, string>> = {};
    if (values.what.trim().length < 15) next.what = "Describe it in a sentence or two";
    if (!values.where.trim()) next.where = "Required";
    if (!values.who.trim()) next.who = "Required";
    if (values.why.trim().length < 15) next.why = "Say what the consequence is";
    if (!anonymous && values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      next.email = "Enter a valid email";
    }
    setErrors(next);
    if (Object.keys(next).length === 0) setSent(true);
  }

  if (sent) {
    return (
      <motion.div
        initial={reduce ? undefined : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="border border-line-strong p-9 lg:p-12"
        role="status"
      >
        <div className="meta-accent">Submitted</div>
        <p className="mt-6 text-display-sm">Your problem has been submitted for review.</p>
        <p className="mt-7 max-w-prose text-[1.0625rem] leading-relaxed text-ink-muted text-pretty">
          Submissions are read before anything is published. If it is clear, specific and something a student team
          could actually work on, it gets written up as a problem statement and added to the Problem Lab.
        </p>
        <ul className="mt-9 space-y-3 border-t border-line pt-7">
          {[
            "Nothing is published automatically.",
            "A published statement is labelled as a student exploration, never as an official university brief.",
            anonymous
              ? "You submitted anonymously — no contact details were attached."
              : "If you left contact details, you may be asked to expand on it.",
          ].map((line) => (
            <li key={line} className="flex gap-4 text-sm leading-relaxed text-ink-muted">
              <span aria-hidden className="mt-2 h-px w-4 shrink-0 bg-acm" />
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-8 border-t border-line pt-6 font-mono text-micro uppercase leading-relaxed text-ink-ghost">
          Demo notice · BuildHub has no backend yet, so nothing was transmitted or stored.
        </p>
        <div className="mt-9">
          <Button variant="outline" onClick={() => { setValues(EMPTY); setSent(false); }}>
            Submit another
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-9">
      <TextArea
        label="What problem did you notice?"
        required
        value={values.what}
        error={errors.what}
        onChange={(e) => set("what", e.target.value)}
        placeholder="Describe what actually happens, not the solution you have in mind."
      />

      <div className="grid gap-7 sm:grid-cols-2">
        <TextField
          label="Where does it happen?"
          required
          value={values.where}
          error={errors.where}
          onChange={(e) => set("where", e.target.value)}
          placeholder="A portal, a building, a process, a form"
        />
        <TextField
          label="Who is affected?"
          required
          value={values.who}
          error={errors.who}
          onChange={(e) => set("who", e.target.value)}
          placeholder="First-year students, one department, everyone"
        />
      </div>

      <TextArea
        label="Why does it matter?"
        required
        hint="What is the consequence?"
        value={values.why}
        error={errors.why}
        onChange={(e) => set("why", e.target.value)}
        placeholder="What goes wrong, how often, and for whom."
      />

      <SelectField
        label="Closest area"
        options={PROBLEM_CATEGORIES}
        value={values.area}
        onChange={(e) => set("area", e.target.value)}
      />

      <TextArea
        label="Do you have a possible solution?"
        hint="Optional"
        value={values.solution}
        onChange={(e) => set("solution", e.target.value)}
        placeholder="It is completely fine to leave this blank. A well-described problem is the contribution."
      />

      <TextField
        label="What technologies might help?"
        hint="Optional"
        value={values.technologies}
        onChange={(e) => set("technologies", e.target.value)}
        placeholder="Search, automation, maps, NLP — a guess is fine"
      />

      <div className="border-t border-line pt-8">
        <Checkbox
          label="Submit anonymously"
          hint="No name or contact details will be attached to the submission"
          checked={anonymous}
          onChange={setAnonymous}
        />

        {!anonymous ? (
          <motion.div
            className="mt-7 grid gap-7 sm:grid-cols-2"
            initial={reduce ? undefined : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
          >
            <TextField
              label="Name"
              hint="Optional"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
            />
            <TextField
              label="Email"
              hint="Optional"
              type="email"
              value={values.email}
              error={errors.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </motion.div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-6 border-t border-line pt-8">
        <Button type="submit" size="lg" arrow>
          Submit problem
        </Button>
        <p className="max-w-sm font-mono text-micro uppercase leading-relaxed text-ink-ghost">
          Reviewed before publication · never published automatically · demo form, nothing is sent
        </p>
      </div>
    </form>
  );
}
