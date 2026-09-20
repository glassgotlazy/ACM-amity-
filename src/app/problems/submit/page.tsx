import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/SectionHeading";
import { ProblemForm } from "@/components/forms/ProblemForm";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Submit a Problem",
  description:
    "Noticed something on campus that should work better? Write it up. A well-described problem is a contribution in itself.",
};

export default function SubmitProblemPage() {
  return (
    <>
      <PageHeader
        eyebrow="Problem Lab / Submit"
        title={
          <>
            YOU NOTICED
            <br />
            SOMETHING.
          </>
        }
        lede="The people who see a problem clearly are usually the people living with it. You do not need a solution, a team or a technical background to write one down — a precise description is the hard part."
      />

      <div className="shell grid gap-16 py-20 lg:grid-cols-[1fr_2fr] lg:gap-24">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="meta">What makes a good submission</h2>
          <ul className="mt-7 space-y-6">
            {[
              {
                t: "Specific beats broad",
                d: "“The library catalogue does not include past question papers” is workable. “The library should be better” is not.",
              },
              {
                t: "Describe the problem, not the app",
                d: "Jumping to a solution narrows what a team can consider. Say what goes wrong instead.",
              },
              {
                t: "Consequences matter",
                d: "Who loses what, and how often? That is what decides whether anyone should spend a term on it.",
              },
              {
                t: "You can be wrong",
                d: "A submission that turns out to be a misunderstanding is still useful — it tells us where things are unclear.",
              },
            ].map((item) => (
              <li key={item.t} className="border-b border-line pb-6">
                <h3 className="text-base font-medium tracking-[-0.02em]">{item.t}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-muted text-pretty">{item.d}</p>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.08}>
          <ProblemForm />
        </Reveal>
      </div>
    </>
  );
}
