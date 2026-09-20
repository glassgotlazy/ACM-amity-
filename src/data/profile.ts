/**
 * DEMO PROFILE.
 *
 * Every value below is placeholder content. The shape is what matters: it is
 * modelled on what a real contribution record would hold, so swapping in a
 * live source (repository activity, task completion, research output) is a
 * data change rather than a redesign.
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

export const demoProfile: Profile = {
  name: "Anuansh Tiwari",
  handle: "anuansh",
  standing: "ACM Contributor",
  course: "B.Tech Computer Science",
  year: "Year 2",
  statement:
    "Joining was the easy part. This page is the other part — what I actually worked on, what shipped, and what I am still wrong about.",
  interests: ["AI", "Software", "Research"],
  skills: [
    { name: "Python", level: 4 },
    { name: "AI / ML", level: 3 },
    { name: "APIs", level: 4 },
    { name: "Git", level: 4 },
    { name: "Research", level: 2 },
  ],
  projects: [
    {
      name: "AI Admissions Assistant",
      slug: "admissions-ai",
      role: "Backend Contributor",
      status: "IN DEVELOPMENT",
      period: "Current",
      did: [
        "Hardened the server-side scope gate so out-of-scope requests are rejected before any upstream call.",
        "Added provider abstraction so the fallback is not tied to one vendor.",
      ],
    },
    {
      name: "Quantum Handshake",
      slug: "quantum-handshake",
      role: "Research Contributor",
      status: "ONGOING RESEARCH",
      period: "Current",
      did: [
        "Annotated four foundational papers for the group bibliography.",
        "Reproduced baseline protocol behaviour in simulation.",
      ],
    },
  ],
  contributions: [
    { label: "Commits", value: 12, unit: "merged", note: "Across 2 repositories" },
    { label: "Tasks", value: 8, unit: "completed", note: "Closed and reviewed" },
    { label: "Projects", value: 2, unit: "active", note: "One build, one research" },
    { label: "Research", value: 1, unit: "contribution", note: "Annotated bibliography" },
  ],
  links: [
    { label: "GitHub", href: null },
    { label: "LinkedIn", href: null },
    { label: "Portfolio", href: null },
  ],
  timeline: [
    { when: "Week 1", what: "Read the Problem Lab. Picked the university knowledge problem." },
    { when: "Week 2", what: "Joined the AI team as a backend contributor." },
    { when: "Week 4", what: "First merged change — scope gate hardening." },
    { when: "Week 6", what: "Joined the research reading group." },
    { when: "Week 9", what: "First simulation reproduced and written up." },
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
