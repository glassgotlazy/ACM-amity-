export type ActivityKind = "build" | "research" | "team" | "problem" | "role" | "review";

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  text: string;
  actor: string;
  target?: { label: string; href: string };
  /** Relative, because there is no real timestamp behind it yet. */
  when: string;
  day: string;
};

/**
 * Demo activity. The shape matches what a real event feed would emit, so the
 * component does not change when a backend replaces this array.
 */
export const activity: ActivityItem[] = [
  {
    id: "a1",
    kind: "build",
    text: "Admissions AI team updated the chatbot interface and reworked how refusals are shown.",
    actor: "AI Team",
    target: { label: "AI Admissions Assistant", href: "/projects/admissions-ai" },
    when: "2h ago",
    day: "Today",
  },
  {
    id: "a2",
    kind: "role",
    text: "Opened 3 new roles across the Admissions AI project — frontend, evaluation and UX.",
    actor: "AI Team",
    target: { label: "Open roles", href: "/projects/admissions-ai" },
    when: "5h ago",
    day: "Today",
  },
  {
    id: "a3",
    kind: "problem",
    text: "A new problem submission was received and is queued for review.",
    actor: "Problem Lab",
    target: { label: "Problem Lab", href: "/problems" },
    when: "7h ago",
    day: "Today",
  },
  {
    id: "a4",
    kind: "research",
    text: "Research team completed a literature review pass on device-independent protocols.",
    actor: "Research Team",
    target: { label: "Quantum Handshake", href: "/research/quantum-handshake" },
    when: "Yesterday",
    day: "This week",
  },
  {
    id: "a5",
    kind: "team",
    text: "New contributor joined the Web team and picked up the accessibility pass.",
    actor: "Web Team",
    target: { label: "Web Team", href: "/teams" },
    when: "Yesterday",
    day: "This week",
  },
  {
    id: "a6",
    kind: "build",
    text: "Baseline protocol simulation reproduced textbook behaviour under idealised conditions.",
    actor: "Research Team",
    target: { label: "Quantum Handshake", href: "/research/quantum-handshake" },
    when: "2 days ago",
    day: "This week",
  },
  {
    id: "a7",
    kind: "review",
    text: "Cybersecurity team completed a data-handling review of the feedback pipeline proposal.",
    actor: "Cybersecurity Team",
    target: { label: "Campus Feedback Intelligence", href: "/projects/campus-feedback-intelligence" },
    when: "3 days ago",
    day: "This week",
  },
  {
    id: "a8",
    kind: "problem",
    text: "The Campus Navigation problem statement was expanded with accessible-route requirements.",
    actor: "Problem Lab",
    target: { label: "Campus Navigation", href: "/problems/campus-navigation" },
    when: "4 days ago",
    day: "This week",
  },
  {
    id: "a9",
    kind: "build",
    text: "Campus Information Hub moved from idea to a written problem statement, and is looking for a founding team.",
    actor: "Software Team",
    target: { label: "Campus Information Hub", href: "/projects/campus-information-hub" },
    when: "Last week",
    day: "Earlier",
  },
  {
    id: "a10",
    kind: "research",
    text: "Evaluation methodology reading group started, shared across three projects.",
    actor: "Research Team",
    target: { label: "Research Hub", href: "/research" },
    when: "Last week",
    day: "Earlier",
  },
];

export const ACTIVITY_KINDS: Record<ActivityKind, string> = {
  build: "BUILD",
  research: "RESEARCH",
  team: "TEAM",
  problem: "PROBLEM",
  role: "ROLE",
  review: "REVIEW",
};
