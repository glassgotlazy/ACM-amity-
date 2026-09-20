import type { StatusId } from "./taxonomy";

export type ResearchStage = {
  id: string;
  name: string;
  state: "done" | "active" | "open";
  detail: string;
};

export type ResearchProject = {
  slug: string;
  title: string;
  status: StatusId;
  field: string;
  question: string;
  background: string[];
  /** Reading list themes — deliberately not fabricated citations. */
  literature: { theme: string; note: string }[];
  exploration: string[];
  experiments: { title: string; state: "running" | "planned" | "blocked"; note: string }[];
  analysis: string | null;
  paper: string | null;
  stages: ResearchStage[];
  openTo: string[];
};

export const researchProjects: ResearchProject[] = [
  {
    slug: "quantum-handshake",
    title: "Quantum Handshake",
    status: "ongoing",
    field: "Quantum computing & communication",
    question:
      "What do quantum approaches to establishing a shared secret actually guarantee, under which assumptions, and where do those assumptions break?",
    background: [
      "Classical key exchange rests on problems believed to be computationally hard. That belief is an assumption about the state of the art, not a proof.",
      "Quantum approaches replace the computational assumption with a physical one — that measurement disturbs the system being measured, and that disturbance is detectable.",
      "The literature is mature in places and contested in others. Our first job is to read it accurately rather than to add to it.",
    ],
    literature: [
      { theme: "Foundational key distribution protocols", note: "Read closely enough to implement, not just to summarise." },
      { theme: "Security proofs and their assumptions", note: "Where each proof holds, and what it quietly requires." },
      { theme: "Device-independent approaches", note: "What changes when you stop trusting your own hardware." },
      { theme: "Implementation and side channels", note: "The gap between the protocol and the physical device." },
    ],
    exploration: [
      "Reproduce textbook protocol behaviour in simulation and verify it matches the stated expectations.",
      "Introduce an eavesdropper under a stated model and measure whether detection behaves as the theory predicts.",
      "Record every assumption we had to make to get a simulation running. That list is itself a finding.",
    ],
    experiments: [
      { title: "Baseline protocol simulation", state: "running", note: "Textbook conditions, no noise, no adversary." },
      { title: "Intercept-and-resend under a stated model", state: "planned", note: "Detection rate against theoretical expectation." },
      { title: "Noise sensitivity sweep", state: "planned", note: "Where simulated results stop resembling the idealised case." },
    ],
    analysis: null,
    paper: null,
    stages: [
      { id: "idea", name: "IDEA", state: "done", detail: "Scope agreed: understand before attempting anything original." },
      { id: "literature", name: "LITERATURE", state: "active", detail: "Systematic reading, annotation and weekly discussion." },
      { id: "experiment", name: "EXPERIMENT", state: "open", detail: "Simulation under explicitly stated assumptions." },
      { id: "analysis", name: "ANALYSIS", state: "open", detail: "What the results support — and what they do not." },
      { id: "paper", name: "PAPER", state: "open", detail: "Only if there is a contribution worth defending." },
    ],
    openTo: [
      "Anyone willing to read a hard paper twice and present it to the group",
      "Simulation contributors comfortable with Python",
      "Someone to maintain the annotated bibliography",
    ],
  },
  {
    slug: "retrieval-quality",
    title: "Measuring Answer Quality Without Labels",
    status: "exploring",
    field: "Information retrieval & evaluation",
    question:
      "How do you tell whether a retrieval-based assistant is right, when nobody has labelled the correct answers?",
    background: [
      "Every campus assistant project runs into the same wall: it demos well and nobody can say whether it is accurate.",
      "Standard retrieval benchmarks do not transfer to a small, local, constantly changing corpus.",
      "This question sits underneath several BuildHub projects, which makes it worth answering once, properly.",
    ],
    literature: [
      { theme: "Retrieval evaluation metrics", note: "What precision and recall mean when relevance is subjective." },
      { theme: "Model-graded evaluation", note: "Using a model as a judge, and how badly that can fail." },
      { theme: "Calibration and abstention", note: "Knowing when a system should decline to answer." },
    ],
    exploration: [
      "Build a small, hand-labelled question set as ground truth and treat it as the project's real asset.",
      "Compare human grading against model grading on the same answers and quantify the disagreement.",
      "Test whether abstention can be tuned without collapsing usefulness.",
    ],
    experiments: [
      { title: "Hand-labelled question set", state: "running", note: "Slow, unglamorous, and the foundation of everything else." },
      { title: "Human vs. model grading agreement", state: "planned", note: "Measured on identical answers." },
    ],
    analysis: null,
    paper: null,
    stages: [
      { id: "idea", name: "IDEA", state: "done", detail: "Framed from a problem three BuildHub projects share." },
      { id: "literature", name: "LITERATURE", state: "active", detail: "Evaluation methodology reading in progress." },
      { id: "experiment", name: "EXPERIMENT", state: "active", detail: "Question set under construction." },
      { id: "analysis", name: "ANALYSIS", state: "open", detail: "Pending enough labelled data to say anything." },
      { id: "paper", name: "PAPER", state: "open", detail: "Not planned. A usable methodology would be enough." },
    ],
    openTo: [
      "Contributors who will write and label questions carefully",
      "Anyone interested in evaluation methodology",
    ],
  },
];

export function researchBySlug(slug: string) {
  return researchProjects.find((r) => r.slug === slug);
}
