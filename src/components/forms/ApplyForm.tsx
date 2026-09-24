"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { TextField, TextArea, SelectField } from "./Field";
import { Button } from "@/components/ui/Button";
import { ease } from "@/lib/motion";
import { submitForm, trapProps, type SubmissionResult } from "@/lib/submissions";
import { useTurnstile } from "@/components/forms/Turnstile";
import { DeliveryNotice, DeliveryError } from "./DeliveryNotice";

type Values = {
  name: string;
  email: string;
  course: string;
  role: string;
  experience: string;
  github: string;
  why: string;
  skills: string;
};

const EMPTY: Values = {
  name: "",
  email: "",
  course: "",
  role: "",
  experience: "Some — I have built a few things",
  github: "",
  why: "",
  skills: "",
};

const EXPERIENCE = [
  "None yet — I want to learn",
  "Some — I have built a few things",
  "Comfortable — I ship regularly",
  "Deep — I want the hard parts",
] as const;

/**
 * Applies to a specific role on a specific project. Nothing is transmitted —
 * there is no backend yet, and the confirmation says so rather than implying
 * an application was filed somewhere.
 */
export function ApplyForm({ projectName, roles }: { projectName: string; roles: string[] }) {
  const reduce = useReducedMotion();
  const [values, setValues] = useState<Values>({ ...EMPTY, role: roles[0] ?? "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [trap, setTrap] = useState("");
  const turnstile = useTurnstile();

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: Partial<Record<keyof Values, string>> = {};
    if (!values.name.trim()) next.name = "Required";
    if (!values.email.trim()) next.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = "Enter a valid email";
    if (!values.course.trim()) next.course = "Required";
    if (values.why.trim().length < 20) next.why = "A sentence or two, please";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSending(true);
    const outcome = await submitForm("project-application", { ...values, project: projectName }, trap, turnstile.token);
    if (outcome.status === "failed") turnstile.reset();
    setSending(false);

    // A failed delivery keeps the student on the form with their answers
    // intact, rather than showing a confirmation for something that did not
    // arrive.
    if (outcome.status === "failed") {
      setResult(outcome);
      return;
    }
    setResult(outcome);
  }

  if (result && result.status !== "failed") {
    return (
      <motion.div
        initial={reduce ? undefined : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
        className="py-6"
        role="status"
      >
        <div className="meta-accent">Application recorded</div>
        <p className="mt-5 text-2xl font-semibold tracking-[-0.03em]">
          Thanks — your interest in {projectName} has been noted.
        </p>
        <p className="mt-5 max-w-prose text-sm leading-relaxed text-ink-muted">
          The project lead reviews applications before anyone is added to a team. Expect a conversation about what you
          want to work on rather than an interview.
        </p>
        <DeliveryNotice result={result} />
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-7">
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          label="Name"
          required
          value={values.name}
          error={errors.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Your full name"
        />
        <TextField
          label="Email"
          type="email"
          required
          value={values.email}
          error={errors.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="you@example.com"
        />
        <TextField
          label="Course / Year"
          required
          value={values.course}
          error={errors.course}
          onChange={(e) => set("course", e.target.value)}
          placeholder="B.Tech CSE, Year 2"
        />
        <SelectField
          label="Role"
          options={roles}
          value={values.role}
          onChange={(e) => set("role", e.target.value)}
        />
      </div>

      <SelectField
        label="Experience"
        hint="Honest answers get better matches"
        options={EXPERIENCE}
        value={values.experience}
        onChange={(e) => set("experience", e.target.value)}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          label="GitHub"
          hint="Optional"
          value={values.github}
          onChange={(e) => set("github", e.target.value)}
          placeholder="github.com/username"
        />
        <TextField
          label="Relevant skills"
          hint="Optional"
          value={values.skills}
          onChange={(e) => set("skills", e.target.value)}
          placeholder="Python, APIs, testing"
        />
      </div>

      <TextArea
        label="Why do you want to contribute?"
        required
        value={values.why}
        error={errors.why}
        onChange={(e) => set("why", e.target.value)}
        placeholder="What about this project interests you, and what would you want to work on first?"
      />

      <input
        {...trapProps}
        value={trap}
        onChange={(e) => setTrap(e.target.value)}
        aria-label="Leave this field empty"
      />

      <AnimatePresence>
        {result?.status === "failed" ? (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <DeliveryError message={result.message} />
          </motion.div>
        ) : null}
        {Object.keys(errors).length > 0 ? (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="font-mono text-micro uppercase text-acm-bright"
            role="alert"
          >
            Some fields need attention.
          </motion.p>
        ) : null}
      </AnimatePresence>

      {turnstile.element}

      <div className="flex flex-wrap items-center gap-5 border-t border-line pt-7">
        <Button type="submit" size="lg" arrow disabled={sending || !turnstile.ready}>
          {sending ? "Sending…" : "Apply"}
        </Button>
      </div>
    </form>
  );
}
