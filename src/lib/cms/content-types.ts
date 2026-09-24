import type { Domain, LevelId, OriginId, ProblemCategory, Role, StatusId } from "@/data/taxonomy";

/**
 * Public shapes of the long-form content: problem statements, project
 * ideas, research, working teams and the activity log. The components were
 * written against these shapes before the CMS existed; the read layer maps
 * database rows back into them.
 */

export type ActivityKind = "build" | "research" | "team" | "problem" | "role" | "review";

export const ACTIVITY_KINDS: Record<ActivityKind, string> = {
  build: "Build",
  research: "Research",
  team: "Team",
  problem: "Problem",
  role: "Role",
  review: "Review",
};

export const BANDS = ["Beginner", "Intermediate", "Advanced", "Research"] as const;

export type Problem = {
  slug: string;
  index: number;
  title: string;
  /** The one-line framing used on cards and in the ticker. */
  hook: string;
  /** Always a "How might we…" question. */
  question: string;
  origin: OriginId;
  category: ProblemCategory;
  domains: Domain[];
  level: LevelId;
  /** Where students currently run into it. */
  context: string[];
  whyItMatters: string[];
  directions: { title: string; detail: string }[];
  technologies: string[];
  potentialProject: { name: string; slug?: string; summary: string };
  skills: string[];
  openRoles: Role[];
  team: { role: Role; count: number; note: string }[];
  researchQuestions: string[];
  nextSteps: string[];
  featured?: boolean;
};

export type Idea = {
  slug: string;
  name: string;
  tagline: string;
  level: LevelId;
  band: "Beginner" | "Intermediate" | "Advanced" | "Research";
  domains: Domain[];
  teamSize: string;
  technologies: string[];
  skills: string[];
  learn: string[];
  problemSlug?: string;
};

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

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  text: string;
  actor: string;
  target?: { label: string; href: string };
  when: string;
  day: string;
};
