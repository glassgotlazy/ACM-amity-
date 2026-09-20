/**
 * Shared vocabulary. Every card, filter and badge on the site reads its
 * labels and colours from here so the taxonomy can never drift between pages.
 */

export const DOMAINS = [
  "AI",
  "Software",
  "Web",
  "Research",
  "Quantum",
  "Cybersecurity",
  "Cloud",
  "Data",
  "IoT",
  "Design",
] as const;

export type Domain = (typeof DOMAINS)[number];

/**
 * Difficulty describes the shape of the work — complexity, scope, research
 * depth, integration surface. It is never a statement about the person.
 */
export const LEVELS = [
  {
    id: "build",
    ordinal: 1,
    name: "BUILD",
    summary: "Basic implementation",
    description:
      "One clear surface, one technology, a well-understood path from start to finish. You learn by shipping the whole thing yourself.",
  },
  {
    id: "integrate",
    ordinal: 2,
    name: "INTEGRATE",
    summary: "Multiple technologies",
    description:
      "Several moving parts that have to agree with each other — an API, a store, a frontend. The difficulty lives in the seams.",
  },
  {
    id: "research",
    ordinal: 3,
    name: "RESEARCH",
    summary: "Requires experimentation and investigation",
    description:
      "The approach is not known in advance. Expect a literature pass, prototypes that get thrown away, and results you have to argue for.",
  },
  {
    id: "deploy",
    ordinal: 4,
    name: "DEPLOY",
    summary: "Production quality implementation",
    description:
      "Real users, real failure modes. Reliability, privacy, access control, monitoring and the discipline to keep it running.",
  },
] as const;

export type LevelId = (typeof LEVELS)[number]["id"];

export function level(id: LevelId) {
  return LEVELS.find((l) => l.id === id)!;
}

/** Experience bands used by the /discover matcher and the join flow. */
export const COMFORT = [
  { id: "beginner", label: "Beginner", note: "New to building. Bring curiosity." },
  { id: "intermediate", label: "Intermediate", note: "You have shipped a few things." },
  { id: "advanced", label: "Advanced", note: "You want depth and hard edges." },
  { id: "learning", label: "I want to learn", note: "Pick the stretch, not the safe option." },
] as const;

export type ComfortId = (typeof COMFORT)[number]["id"];

/**
 * Status vocabulary. These are deliberately honest: nothing on this site
 * claims to be finished, launched or adopted unless it actually is.
 */
export const STATUSES = {
  current: { label: "CURRENT", tone: "live" },
  development: { label: "IN DEVELOPMENT", tone: "work" },
  ongoing: { label: "ONGOING RESEARCH", tone: "work" },
  exploring: { label: "EXPLORING", tone: "idea" },
  proposed: { label: "PROPOSED", tone: "idea" },
  soon: { label: "COMING SOON", tone: "idle" },
} as const;

export type StatusId = keyof typeof STATUSES;
export type Tone = (typeof STATUSES)[StatusId]["tone"];

/**
 * Provenance labels for problem statements. Nothing here is presented as an
 * official, confirmed or university-endorsed brief unless it genuinely is —
 * and at the moment none of them are.
 */
export const ORIGINS = {
  potential: "POTENTIAL PROBLEM",
  example: "EXAMPLE PROBLEM STATEMENT",
  exploration: "STUDENT EXPLORATION",
  challenge: "STUDENT CHALLENGE",
} as const;

export type OriginId = keyof typeof ORIGINS;

export const PROBLEM_CATEGORIES = [
  "AI & Automation",
  "Campus Technology",
  "Student Experience",
  "Research",
  "Cybersecurity",
  "Administration",
  "Accessibility",
  "Sustainability",
  "Data",
  "Emerging Technology",
] as const;

export type ProblemCategory = (typeof PROBLEM_CATEGORIES)[number];

export const ROLES = [
  "Frontend",
  "Backend",
  "AI / LLM",
  "Research",
  "UX",
  "Data",
  "Security",
  "Testing",
  "DevOps",
  "Design",
  "Technical Writing",
] as const;

export type Role = (typeof ROLES)[number];
