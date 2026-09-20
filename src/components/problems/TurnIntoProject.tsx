"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextField, TextArea, SelectField, ChipGroup } from "@/components/forms/Field";
import { ROLES } from "@/data/taxonomy";
import { ease } from "@/lib/motion";

const STAGES = ["PROBLEM", "DEFINE", "RESEARCH", "DESIGN", "BUILD", "TEST", "DEPLOY"] as const;

/**
 * The conversion moment: a problem becomes a project. The stage sequence plays
 * once as a short animation before the proposal form appears, so the student
 * sees the shape of the commitment they are making before they start typing.
 */
export function TurnIntoProject({ problemTitle, suggestedName }: { problemTitle: string; suggestedName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)} arrow>
        Turn this into a project
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={problemTitle} eyebrow="Problem → Project" wide>
        <Flow suggestedName={suggestedName} />
      </Modal>
    </>
  );
}

function Flow({ suggestedName }: { suggestedName: string }) {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState(reduce ? STAGES.length : 0);

  // Walk the stages once, then reveal the proposal form.
  useEffect(() => {
    if (reduce || stage >= STAGES.length) return;
    const t = setTimeout(() => setStage((s) => s + 1), stage === 0 ? 420 : 300);
    return () => clearTimeout(t);
  }, [stage, reduce]);

  const done = stage >= STAGES.length;

  return (
    <div>
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line pb-7">
        {STAGES.map((name, i) => {
          const reached = i < stage;
          return (
            <li key={name} className="flex items-center gap-3">
              <motion.span
                className={`font-mono text-micro uppercase ${
                  i === 0 ? "text-acm" : reached ? "text-ink" : "text-ink-ghost"
                }`}
                initial={reduce ? undefined : { opacity: 0.25, y: 4 }}
                animate={reached ? { opacity: 1, y: 0 } : { opacity: 0.25, y: 0 }}
                transition={{ duration: 0.3, ease }}
              >
                {name}
              </motion.span>
              {i < STAGES.length - 1 ? (
                <motion.span
                  aria-hidden
                  className="block h-px w-5 origin-left bg-acm"
                  initial={reduce ? undefined : { scaleX: 0 }}
                  animate={{ scaleX: reached ? 1 : 0 }}
                  transition={{ duration: 0.25, ease }}
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="form"
            initial={reduce ? undefined : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease }}
            className="pt-8"
          >
            <ProposalForm suggestedName={suggestedName} />
          </motion.div>
        ) : (
          <motion.p
            key="waiting"
            exit={{ opacity: 0 }}
            className="py-10 font-mono text-label uppercase text-ink-faint"
          >
            Mapping the route from problem to shipped work…
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

type Values = {
  name: string;
  concept: string;
  technologies: string;
  outcome: string;
  size: string;
  roles: string[];
};

const SIZES = ["2 people", "3 people", "4 people", "5 or more"] as const;

function ProposalForm({ suggestedName }: { suggestedName: string }) {
  const reduce = useReducedMotion();
  const [values, setValues] = useState<Values>({
    name: suggestedName,
    concept: "",
    technologies: "",
    outcome: "",
    size: "3 people",
    roles: [],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [sent, setSent] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: Partial<Record<keyof Values, string>> = {};
    if (!values.name.trim()) next.name = "Required";
    if (values.concept.trim().length < 20) next.concept = "Describe the approach in a sentence or two";
    if (values.roles.length === 0) next.roles = "Pick at least one role";
    setErrors(next);
    if (Object.keys(next).length === 0) setSent(true);
  }

  if (sent) {
    return (
      <motion.div
        initial={reduce ? undefined : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        role="status"
      >
        <div className="meta-accent">Proposal drafted</div>
        <p className="mt-5 text-2xl font-semibold tracking-[-0.03em]">
          “{values.name}” is now a project proposal.
        </p>
        <p className="mt-5 max-w-prose text-sm leading-relaxed text-ink-muted">
          A proposal is reviewed with you before it becomes an ACM project — the conversation is about scope and what
          the first milestone should be, not about whether the idea is good enough.
        </p>
        <p className="mt-6 border-t border-line pt-5 font-mono text-micro uppercase leading-relaxed text-ink-ghost">
          Demo notice · nothing was transmitted or stored. Proposals will be wired to a real endpoint before
          recruitment opens.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-7">
      <TextField
        label="Project name"
        required
        value={values.name}
        error={errors.name}
        onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
      />
      <TextArea
        label="Solution concept"
        required
        hint="What would you actually build first?"
        value={values.concept}
        error={errors.concept}
        onChange={(e) => setValues((v) => ({ ...v, concept: e.target.value }))}
        placeholder="The smallest version of this that would be useful is…"
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          label="Technologies"
          hint="Optional"
          value={values.technologies}
          onChange={(e) => setValues((v) => ({ ...v, technologies: e.target.value }))}
          placeholder="Python, Postgres, Next.js"
        />
        <SelectField
          label="Team size"
          options={SIZES}
          value={values.size}
          onChange={(e) => setValues((v) => ({ ...v, size: e.target.value }))}
        />
      </div>
      <ChipGroup
        label="Roles you would need"
        required
        options={ROLES}
        value={values.roles}
        error={errors.roles}
        onToggle={(role) =>
          setValues((v) => ({
            ...v,
            roles: v.roles.includes(role) ? v.roles.filter((r) => r !== role) : [...v.roles, role],
          }))
        }
      />
      <TextArea
        label="Expected outcome"
        hint="Optional"
        value={values.outcome}
        onChange={(e) => setValues((v) => ({ ...v, outcome: e.target.value }))}
        placeholder="At the end of a term, what exists that did not before?"
      />

      <div className="flex flex-wrap items-center gap-5 border-t border-line pt-7">
        <Button type="submit" size="lg" arrow>
          Start a project
        </Button>
        <p className="font-mono text-micro uppercase text-ink-ghost">Demo form · nothing is sent</p>
      </div>
    </form>
  );
}
