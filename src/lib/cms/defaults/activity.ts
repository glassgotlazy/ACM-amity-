import type { ActivityItem } from "../content-types";

/**
 * Built-in content, used only until "Load remaining content" copies it into
 * the database (see supabase/admin.sql). After that the database is the only
 * source and this file is never read by the public site.
 */
/**
 * Real project milestones, taken from the commit history of the two ACM
 * repositories. Each entry describes something that actually shipped.
 *
 * Entries describe work on projects, not output by individuals — repository
 * history is a poor proxy for who contributed what, and this feed does not
 * pretend otherwise.
 */
export const defaultActivity: ActivityItem[] = [
  {
    id: "a1",
    kind: "build",
    text: "BuildHub went live: the Problem Lab, project pages, team pages and the application flows are all deployed.",
    actor: "Web Team",
    target: { label: "ACM BuildHub", href: "/projects/buildhub-platform" },
    when: "Latest",
    day: "This week",
  },
  {
    id: "a2",
    kind: "build",
    text: "Form submissions wired to a live endpoint — membership applications, project applications and problem submissions now reach the team.",
    actor: "Web Team",
    target: { label: "Join ACM", href: "/join" },
    when: "Latest",
    day: "This week",
  },
  {
    id: "a3",
    kind: "problem",
    text: "Six campus problem statements published to the Problem Lab, each with possible directions, technologies and open roles.",
    actor: "Problem Lab",
    target: { label: "Problem Lab", href: "/problems" },
    when: "This week",
    day: "This week",
  },
  {
    id: "a4",
    kind: "role",
    text: "Seventeen roles opened across five projects, from beginner frontend work to advanced retrieval engineering.",
    actor: "ACM @ Amity",
    target: { label: "All projects", href: "/projects" },
    when: "This week",
    day: "This week",
  },
  {
    id: "a5",
    kind: "build",
    text: "Admissions Assistant knowledge base reached 310 offline topics, with an eligibility checker, cost estimator and shareable answer links.",
    actor: "AI Team",
    target: { label: "AI Admissions Assistant", href: "/projects/admissions-ai" },
    when: "Recently",
    day: "Earlier",
  },
  {
    id: "a6",
    kind: "review",
    text: "Scope gate hardened so out-of-scope questions are rejected in the browser and again on the server, before any upstream call.",
    actor: "AI Team",
    target: { label: "AI Admissions Assistant", href: "/projects/admissions-ai" },
    when: "Recently",
    day: "Earlier",
  },
  {
    id: "a7",
    kind: "build",
    text: "Assistant gained provider abstraction — the AI fallback works with either OpenAI or Claude, so it is not tied to one vendor.",
    actor: "AI Team",
    target: { label: "AI Admissions Assistant", href: "/projects/admissions-ai" },
    when: "Recently",
    day: "Earlier",
  },
  {
    id: "a8",
    kind: "build",
    text: "Serverless functions added so the assistant’s AI fallback works in a deployed environment, not only locally.",
    actor: "AI Team",
    target: { label: "AI Admissions Assistant", href: "/projects/admissions-ai" },
    when: "Recently",
    day: "Earlier",
  },
  {
    id: "a9",
    kind: "build",
    text: "Assistant rebuilt as a fully offline experience — the knowledge base answers without an API key, a server or a network connection.",
    actor: "AI Team",
    target: { label: "AI Admissions Assistant", href: "/projects/admissions-ai" },
    when: "Earlier",
    day: "Earlier",
  },
  {
    id: "a10",
    kind: "research",
    text: "Quantum Handshake reading group opened, working through foundational key distribution papers.",
    actor: "Research Team",
    target: { label: "Quantum Handshake", href: "/research/quantum-handshake" },
    when: "Ongoing",
    day: "Ongoing",
  },
];
