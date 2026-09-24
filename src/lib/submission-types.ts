import { DOMAINS, PROBLEM_CATEGORIES, ROLES } from "@/data/taxonomy";

/**
 * Shared, browser-safe description of the submissions queue. The server code
 * that talks to Supabase lives in ./supabase; this file holds only the shapes
 * and vocabulary, so the admin UI can import it without pulling server code
 * into the client bundle.
 */

export const SUBMISSION_STATES = ["new", "reviewing", "accepted", "declined", "published"] as const;
export type SubmissionState = (typeof SUBMISSION_STATES)[number];

export const STATE_LABEL: Record<SubmissionState, string> = {
  new: "New",
  reviewing: "Under review",
  accepted: "Accepted",
  declined: "Declined",
  published: "Published",
};

export const SUBMISSION_KINDS = ["join", "project-application", "problem-submission", "project-proposal"] as const;
export type SubmissionKind = (typeof SUBMISSION_KINDS)[number];

export const KIND_LABEL: Record<SubmissionKind, string> = {
  join: "Membership",
  "project-application": "Project application",
  "problem-submission": "Problem submission",
  "project-proposal": "Project proposal",
};

export type StoredSubmission = {
  id: string;
  created_at: string;
  /** Null until an admin first changes the row (and before supabase/admin.sql). */
  updated_at?: string | null;
  kind: SubmissionKind;
  payload: Record<string, unknown>;
  anonymous: boolean;
  state: SubmissionState;
  note: string | null;
};

/**
 * The payload field each kind is categorised by, and the values the public
 * form offers for it. Array fields (a member's interests, a proposal's roles)
 * match when they contain the value.
 */
export const CATEGORY: Record<SubmissionKind, { field: string; label: string; array: boolean; options: readonly string[] }> = {
  join: { field: "interests", label: "Interest", array: true, options: [...DOMAINS, "Leadership"] },
  "project-application": { field: "role", label: "Role", array: false, options: ROLES },
  "problem-submission": { field: "area", label: "Area", array: false, options: PROBLEM_CATEGORIES },
  "project-proposal": { field: "roles", label: "Role needed", array: true, options: ROLES },
};

/** Payload fields the search box looks in. */
export const SEARCH_FIELDS = ["name", "email", "project", "what", "concept"] as const;

/**
 * How the detail view groups each kind's payload. Any stored field not listed
 * here still appears, under "Other details", so nothing is ever hidden.
 */
export const FIELD_GROUPS: Record<SubmissionKind, { title: string; fields: [string, string][] }[]> = {
  join: [
    { title: "Applicant", fields: [["name", "Name"], ["course", "Course"], ["year", "Year"]] },
    { title: "Interests and skills", fields: [["interests", "Interests"], ["skills", "Skills"], ["build", "Wants to build"]] },
    { title: "Links", fields: [["github", "GitHub"], ["linkedin", "LinkedIn"]] },
    { title: "Motivation", fields: [["why", "Why ACM"]] },
  ],
  "project-application": [
    { title: "Applicant", fields: [["name", "Name"], ["email", "Email"], ["course", "Course"]] },
    { title: "Project", fields: [["project", "Project"], ["role", "Role"]] },
    { title: "Experience", fields: [["experience", "Experience"], ["skills", "Skills"], ["why", "Why this project"]] },
    { title: "Links", fields: [["github", "GitHub"]] },
  ],
  "problem-submission": [
    { title: "Problem", fields: [["what", "What happens"], ["where", "Where"], ["who", "Who it affects"], ["why", "Why it matters"], ["area", "Area"]] },
    { title: "Ideas", fields: [["solution", "Possible solution"], ["technologies", "Technologies"]] },
    { title: "Submitter", fields: [["name", "Name"], ["email", "Email"]] },
  ],
  "project-proposal": [
    { title: "Project", fields: [["name", "Project name"], ["problem", "From problem"], ["concept", "Concept"], ["outcome", "Outcome"]] },
    { title: "Team", fields: [["size", "Team size"], ["roles", "Roles needed"], ["technologies", "Technologies"]] },
  ],
};

/** One-line title for a row in the queue. */
export function submissionTitle(s: Pick<StoredSubmission, "kind" | "payload" | "anonymous">): string {
  const p = s.payload;
  const str = (k: string) => (typeof p[k] === "string" && (p[k] as string).trim() ? (p[k] as string).trim() : "");
  switch (s.kind) {
    case "problem-submission":
      return str("what") || "Untitled problem";
    case "project-proposal":
      return str("name") || "Untitled proposal";
    default:
      return str("name") || (s.anonymous ? "Anonymous" : "Unnamed");
  }
}
