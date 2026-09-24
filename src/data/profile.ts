/**
 * A real contribution record, built only from things that can be checked: the
 * role is confirmed by the chapter, and the project facts come from the two
 * ACM repositories.
 *
 * Deliberately absent: per-person commit and task counts. Repository history
 * on these projects is AI-assisted and shared, so attributing a commit total
 * to one person would overstate individual authorship — on the one page whose
 * entire argument is that a contribution record should be true. The counters
 * below measure project output, and say so.
 */

export type Contribution = {
  label: string;
  value: number;
  unit: string;
  note: string;
};

export type ProfileProject = {
  name: string;
  slug: string;
  role: string;
  status: string;
  period: string;
  did: string[];
};

export type Profile = {
  name: string;
  handle: string;
  standing: string;
  course: string;
  year: string;
  statement: string;
  interests: string[];
  skills: { name: string; level: number }[];
  projects: ProfileProject[];
  contributions: Contribution[];
  links: { label: string; href: string | null }[];
  timeline: { when: string; what: string }[];
};

export const contributorProfile: Profile = {
  name: "Anuansh Tiwari",
  handle: "anuansh",
  standing: "Technical Head",
  course: "ACM @ Amity University",
  year: "Current term",
  statement:
    "Joining was the easy part. This page is the other part — what actually shipped, what is still unfinished, and what I am probably still wrong about.",
  interests: ["AI", "Software", "Research"],
  skills: [
    { name: "JavaScript / TypeScript", level: 4 },
    { name: "Retrieval & LLM integration", level: 3 },
    { name: "APIs & backend", level: 4 },
    { name: "Git", level: 4 },
    { name: "Research", level: 2 },
  ],
  projects: [
    {
      name: "AI Admissions Assistant",
      slug: "admissions-ai",
      role: "Technical lead",
      status: "In development",
      period: "Current",
      did: [
        "Knowledge base grown to 310 topics that answer offline, with no API key and no network connection.",
        "Scope gate enforced twice — in the browser and again on the server — so the assistant cannot be repurposed as a general chatbot.",
        "Provider abstraction added so the optional AI fallback runs on either OpenAI or Claude.",
      ],
    },
    {
      name: "ACM BuildHub",
      slug: "buildhub-platform",
      role: "Technical lead",
      status: "CURRENT",
      period: "Current",
      did: [
        "Problem Lab published with six campus problem statements, each with directions, technologies and open roles.",
        "Application and submission flows wired to a live endpoint.",
      ],
    },
  ],
  contributions: [
    { label: "Projects", value: 2, unit: "active", note: "Assistant and platform" },
    { label: "KB topics", value: 310, unit: "offline", note: "Answer with no network call" },
    { label: "Problems", value: 6, unit: "published", note: "Open for teams to take" },
    { label: "Repositories", value: 2, unit: "public", note: "Open to contributors" },
  ],
  links: [{ label: "GitHub", href: "https://github.com/glassgotlazy" }],
  timeline: [
    { when: "Start", what: "Admissions assistant rebuilt as a fully offline experience with its own retrieval engine." },
    { when: "Then", what: "Scope gate added, then hardened so it is enforced on the server as well as the browser." },
    { when: "Then", what: "Knowledge base grown past 300 topics, with an eligibility checker and cost estimator." },
    { when: "Then", what: "BuildHub built — Problem Lab, project pages, teams, and the application flows." },
    { when: "Now", what: "Evaluation. Moving answer quality from something we read to something we measure." },
  ],
};

/** The distinction the whole contribution model rests on. */
export const CONTRIBUTION_MODEL = [
  {
    kind: "Membership",
    claim: "I joined ACM.",
    evidence: "A name on a list.",
    tone: "muted" as const,
  },
  {
    kind: "Contribution",
    claim: "I built something through ACM.",
    evidence: "A commit, a review, a paper, a deployed service, a documented decision.",
    tone: "accent" as const,
  },
];

export const TRACKED = [
  "Projects joined",
  "Tasks completed",
  "Repository contributions",
  "Research contributions",
  "Documentation written",
  "Technical presentations",
  "Reviews given",
  "Open source contributions",
];
