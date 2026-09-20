import type { Domain, Role } from "./taxonomy";

export type Team = {
  slug: string;
  name: string;
  /** A sentence that says what the team is actually for. */
  focus: string;
  charter: string;
  domains: Domain[];
  works: string[];
  projects: { name: string; slug: string }[];
  openPositions: { role: Role; level: string; note: string }[];
  meets: string;
  /** Demo figure — replace with a real roster when membership data exists. */
  size: number;
};

export const teams: Team[] = [
  {
    slug: "ai",
    name: "AI Team",
    focus: "Retrieval, language models and the discipline of knowing when a system is wrong.",
    charter:
      "We are interested in systems that answer questions from real documents, and in the far harder problem of measuring whether those answers are correct. We prefer a boring pipeline with a known accuracy to a clever one with none.",
    domains: ["AI", "Data", "Research"],
    works: ["Retrieval pipelines", "Evaluation harnesses", "Prompt and refusal design", "Model integration"],
    projects: [
      { name: "AI Admissions Assistant", slug: "admissions-ai" },
      { name: "Campus Feedback Intelligence", slug: "campus-feedback-intelligence" },
    ],
    openPositions: [
      { role: "AI / LLM", level: "Advanced", note: "Retrieval over real documents" },
      { role: "Testing", level: "Beginner", note: "Build the evaluation question set" },
    ],
    meets: "Weekly working session",
    size: 6,
  },
  {
    slug: "software",
    name: "Software Team",
    focus: "Services, data models and the unglamorous engineering everything else depends on.",
    charter:
      "APIs, storage, scheduling, workflow. We own the parts of a project that have to keep working after the demo. If a design cannot be explained on a whiteboard, it is not finished.",
    domains: ["Software", "Cloud", "Data"],
    works: ["API design", "Data modelling", "Infrastructure", "Automation"],
    projects: [
      { name: "Campus Information Hub", slug: "campus-information-hub" },
      { name: "ACM BuildHub", slug: "buildhub-platform" },
    ],
    openPositions: [
      { role: "Backend", level: "Intermediate", note: "Replace BuildHub's demo data with a real store" },
      { role: "DevOps", level: "Any", note: "Deployment and CI for team projects" },
    ],
    meets: "Weekly working session",
    size: 8,
  },
  {
    slug: "research",
    name: "Research Team",
    focus: "Reading carefully, testing honestly, and writing down what we actually found.",
    charter:
      "We treat a negative result as a result. Membership means reading a difficult paper and presenting it to people who will disagree with your reading. No prior research experience is required — willingness to be wrong in public is.",
    domains: ["Research", "Quantum", "AI"],
    works: ["Literature review", "Simulation", "Methodology", "Technical writing"],
    projects: [
      { name: "Quantum Handshake", slug: "quantum-handshake" },
      { name: "Campus Feedback Intelligence", slug: "campus-feedback-intelligence" },
    ],
    openPositions: [
      { role: "Research", level: "Any", note: "Reading group — the entry point for everyone" },
      { role: "Technical Writing", level: "Intermediate", note: "Annotated bibliography and write-ups" },
    ],
    meets: "Weekly reading group",
    size: 5,
  },
  {
    slug: "web",
    name: "Web Team",
    focus: "The surfaces students actually touch, built to a standard we are willing to sign.",
    charter:
      "Interfaces, performance, accessibility. We care about the 360-pixel screen as much as the 1440. A page that is beautiful and unusable on a phone has failed.",
    domains: ["Web", "Design", "Software"],
    works: ["Product interfaces", "Design systems", "Accessibility", "Performance"],
    projects: [
      { name: "ACM BuildHub", slug: "buildhub-platform" },
      { name: "Campus Information Hub", slug: "campus-information-hub" },
    ],
    openPositions: [
      { role: "Frontend", level: "Any", note: "Components and interaction detail" },
      { role: "UX", level: "Beginner", note: "Empty states, refusals and error copy" },
    ],
    meets: "Weekly build session",
    size: 7,
  },
  {
    slug: "design",
    name: "Design Team",
    focus: "Making complicated systems legible, and holding the line on quality.",
    charter:
      "We work on information architecture, interface design and the written voice of everything ACM publishes. Design here is not decoration applied at the end — it is the argument about what the thing is.",
    domains: ["Design", "Web", "Research"],
    works: ["Interface design", "Information architecture", "Content design", "Design systems"],
    projects: [{ name: "ACM BuildHub", slug: "buildhub-platform" }],
    openPositions: [
      { role: "Design", level: "Intermediate", note: "Editorial layout and the contribution record" },
      { role: "UX", level: "Any", note: "Research and flow design for the Problem Lab" },
    ],
    meets: "Weekly critique",
    size: 4,
  },
  {
    slug: "cybersecurity",
    name: "Cybersecurity Team",
    focus: "Reviewing what we build before anyone else has to, and learning to attack in order to defend.",
    charter:
      "We review ACM projects for access control, data handling and privacy before they go anywhere near real data. Everything we do is scoped, consented and documented — that constraint is the discipline, not an obstacle to it.",
    domains: ["Cybersecurity", "Software", "Research"],
    works: ["Security review", "Privacy engineering", "Threat modelling", "Secure development"],
    projects: [
      { name: "Campus Feedback Intelligence", slug: "campus-feedback-intelligence" },
      { name: "Quantum Handshake", slug: "quantum-handshake" },
    ],
    openPositions: [
      { role: "Security", level: "Any", note: "Review track — start by reviewing, not attacking" },
      { role: "Research", level: "Advanced", note: "Applied cryptography reading" },
    ],
    meets: "Fortnightly review",
    size: 4,
  },
];

export function teamBySlug(slug: string) {
  return teams.find((t) => t.slug === slug);
}
