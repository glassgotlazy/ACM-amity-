import type {
  Announcement,
  EventItem,
  NavItem,
  ProjectMemberRow,
  ProjectRow,
  Section,
  SiteSettings,
  SocialLink,
  TeamMember,
  TeamRole,
} from "../types";
import { defaultProjects } from "./projects";

/**
 * What the site showed before the CMS existed.
 *
 * These values have exactly two uses: the public site renders them while the
 * CMS tables are empty (between deploying this code and loading content in
 * the admin), and "Load current website content" copies them into the
 * database once. After that the database is the single source of truth and
 * nothing here is read by the public site.
 */

export const defaultSettings: SiteSettings = {
  site_name: "ACM BuildHub",
  short_name: "ACM",
  organization: "ACM @ Amity University",
  tagline: "Real problems. Real projects. Real technical experience.",
  description:
    "Real problems. Real projects. Real technical experience. ACM BuildHub is where students at Amity University find a problem worth solving, build a team around it, and leave with something they can show.",
  logo_url: null,
  favicon_url: null,
  contact_email: null,
  contact_phone: null,
  location: null,
  registration_url:
    "https://docs.google.com/forms/d/e/1FAIpQLSfZuPSTlqs4rxTGgaAP6DwSO5-zjySCqdJj0GIu1wmj6jsD_w/viewform",
  registration_qr_url: "/registration-qr.svg",
  footer_text:
    "BuildHub is where campus problems become projects, projects become teams, and teams leave behind something you can point at.",
  pillars: ["Build", "Research", "Learn", "Collaborate"],
  copyright_text: "ACM @ Amity University · Student chapter",
  disclaimer_text:
    "Problem statements here are student-written explorations, not official university briefs. Team sizes are a demo figure.",
};

const nav = (
  n: number,
  label: string,
  href: string,
  in_header: boolean,
  footer_group: NavItem["footer_group"],
): NavItem => ({ id: `default-nav-${n}`, label, href, in_header, footer_group, enabled: true, sort: n });

export const defaultNav: NavItem[] = [
  nav(0, "Projects", "/projects", true, "platform"),
  nav(1, "Problem Lab", "/problems", true, "platform"),
  nav(2, "Project Ideas", "/ideas", false, "platform"),
  nav(3, "Research", "/research", true, "platform"),
  nav(4, "Teams", "/teams", true, "community"),
  nav(5, "Activity", "/activity", true, "community"),
  nav(6, "Contribution Profile", "/profile", false, "community"),
  nav(7, "Find Your Project", "/discover", false, "community"),
  nav(8, "Join ACM", "/join", false, "take-part"),
  nav(9, "Submit a Problem", "/problems/submit", false, "take-part"),
  nav(10, "Apply to a Project", "/projects/admissions-ai", false, "take-part"),
  nav(11, "Admin", "/admin", false, "take-part"),
];

export const defaultSocial: SocialLink[] = [];

const section = (key: Section["key"], sort: number, fields: Partial<Section>): Section => ({
  key,
  enabled: true,
  sort,
  eyebrow: "",
  title: "",
  subtitle: "",
  body: "",
  note: "",
  primary_label: "",
  primary_href: "",
  secondary_label: "",
  secondary_href: "",
  image_url: null,
  extra: {},
  ...fields,
});

export const defaultSections: Section[] = [
  section("hero", 0, {
    eyebrow: "ACM @ Amity University",
    title: "BUILD SOMETHING\nWORTH SHOWING.",
    subtitle: "Real problems.\nReal projects.\nReal technical experience.",
    body: "ACM @ Amity is a student-driven technical community where ideas become projects, projects become experience, and experience becomes something you can actually show.",
    primary_label: "Explore projects",
    primary_href: "/projects",
    secondary_label: "Find a problem",
    secondary_href: "/problems",
    extra: {
      badge: "BuildHub",
      tertiary_label: "Join ACM",
      tertiary_href: "/join",
      focus: ["AI", "Software", "Research", "Quantum", "Cybersecurity", "Data", "Web", "Emerging Technology"],
    },
  }),
  section("announcements", 1, { eyebrow: "Notice" }),
  section("what_we_build", 2, {
    eyebrow: "What we build",
    title: "WE BUILD THINGS\nTHAT MATTER.",
    body: "Not another collection of ideas sitting inside a presentation. These are problems students can explore, contribute to and learn from.",
    subtitle: "Every project below states what exists today and what does not.",
    note: "The admissions assistant is a working student project, not an official university admissions channel. Quantum Handshake is an ongoing research effort with no published result. Neither is presented as more than it is.",
    primary_label: "All projects",
    primary_href: "/projects",
  }),
  section("problem_lab", 3, {
    eyebrow: "Problem Lab",
    title: "DON’T START WITH AN IDEA.\nSTART WITH A PROBLEM.",
    body: "Universities are rapidly adopting AI, automation, digital platforms and data-driven systems. That creates new challenges that still need better solutions.",
    subtitle: "Find a problem worth solving.",
    note: "These are student-written explorations. None of them is an official or confirmed university brief.",
    primary_label: "Enter the Problem Lab",
    primary_href: "/problems",
  }),
  section("problem_of_the_week", 4, {
    eyebrow: "Problem of the week",
    subtitle: "Rotates weekly",
    primary_label: "Explore problem",
  }),
  section("events", 5, {
    eyebrow: "Events",
    title: "WHAT’S COMING UP.",
    body: "Sessions, workshops and build nights run by the chapter. Open to every member.",
    primary_label: "All events",
    primary_href: "/events",
  }),
  section("difficulty", 6, {
    eyebrow: "Difficulty system",
    title: "FOUR LEVELS. NONE OF THEM ABOUT YOU.",
    body: "Difficulty here describes the work — its technical complexity, its scope, how much research it needs and how many things have to agree with each other. It is not a statement about who is capable of doing it.",
  }),
  section("ideas", 7, {
    eyebrow: "Project ideas",
    title: "DON’T HAVE AN IDEA?\nWE’VE GOT PROBLEMS.",
    body: "Unclaimed starting points, filtered by how much you already know. None of these has a team yet — the first person in decides what it becomes.",
    primary_label: "All project ideas",
    primary_href: "/ideas",
  }),
  section("contribution", 8, {
    eyebrow: "Contribution",
    title: "YOUR MEMBERSHIP SAYS YOU JOINED.\nYOUR CONTRIBUTIONS SHOW WHAT YOU DID.",
    body: "Every project you touch through ACM leaves a trace — a commit, a review, a write-up, a deployed service. This platform exists to keep that record, so you leave with evidence rather than a line on a list.",
    note: "Contribution tracking is not wired to a live source yet — the profile you can view is demo content.",
    primary_label: "See a profile",
    primary_href: "/profile",
  }),
  section("recruit", 9, {
    title: "YOUR NEXT PROJECT\nDOESN’T HAVE TO BE\nA COLLEGE ASSIGNMENT.",
    body: "Build something. Research something. Solve something.",
    primary_label: "Join ACM",
    primary_href: "/join",
    secondary_label: "Explore problems",
    secondary_href: "/problems",
  }),
  section("final_cta", 10, {
    title: "DON’T JUST ADD ACM\nTO YOUR RESUME.",
    subtitle: "ADD WHAT YOU BUILT\nTHROUGH ACM.",
    body: "You don’t need to know everything. You just need a problem worth caring about and the willingness to build.",
  }),
];

const page = (key: Section["key"], eyebrow: string, title: string, body: string, note = ""): Section =>
  section(key, 0, { eyebrow, title, body, note });

/** Page headers: eyebrow, headline (one line per line break) and lede. */
export const defaultPages: Section[] = [
  page(
    "page_projects",
    "Projects",
    "FIND SOMETHING\nWORTH BUILDING.",
    "Each project below states its current status honestly — what is working, what is not built yet, and which roles are open. Nothing here is finished, which is the point.",
  ),
  page(
    "page_problems",
    "Problem Lab",
    "DON’T START WITH AN IDEA.\nSTART WITH A PROBLEM.",
    "Universities are rapidly adopting AI, automation, digital platforms and data-driven systems. That creates new challenges that still need better solutions. Find a problem worth solving.",
  ),
  page(
    "page_submit",
    "Problem Lab / Submit",
    "YOU NOTICED\nSOMETHING.",
    "The people who see a problem clearly are usually the people living with it. You do not need a solution, a team or a technical background to write one down — a precise description is the hard part.",
  ),
  page(
    "page_ideas",
    "Project ideas",
    "DON’T HAVE AN IDEA?\nWE’VE GOT PROBLEMS.",
    "Not knowing what to build is the most common reason people never start. Every idea below is unclaimed and has no team — which means the first person in gets to decide what it becomes.",
  ),
  page(
    "page_research",
    "Research",
    "WE DON’T JUST BUILD.\nWE ASK WHY.",
    "Research here means reading carefully, testing honestly and writing down what we actually found — including when the answer is that we were wrong. No result below is published, peer-reviewed or established.",
  ),
  page(
    "page_teams",
    "Teams",
    "FIND PEOPLE WHOSE SKILLS\nCOVER WHAT YOURS DON’T.",
    "Teams are how a problem becomes work that actually ships. You join one because of what it works on, not because of what it is called — and most projects need more than one.",
  ),
  page(
    "page_teams_core",
    "Chapter leadership",
    "The core team.",
    "Office bearers for the current term. They set direction and unblock work — the building itself happens in the teams below.",
  ),
  page(
    "page_activity",
    "Activity",
    "WHAT ACTUALLY\nHAPPENED THIS WEEK.",
    "A community is easiest to judge by what it did recently. This is the log — work shipped, papers read, reviews completed, roles opened.",
    "These are real project milestones, taken from the two ACM repositories. The feed is not yet wired to repository events, so it is updated manually. Entries describe work on projects rather than output by individuals.",
  ),
  page(
    "page_events",
    "Events",
    "WHERE THE CHAPTER\nMEETS IN PERSON.",
    "Sessions, workshops and build nights. Open to every member — and most of them to anyone curious enough to turn up.",
  ),
  page(
    "page_join",
    "Join ACM @ Amity",
    "YOU DON’T NEED\nTO KNOW EVERYTHING.",
    "Seven short questions. There is no test, no minimum skill level and no wrong answer — the only thing that matters is that there is something you want to work on.",
  ),
  page(
    "page_discover",
    "Discover",
    "WHAT DO YOU\nWANT TO BUILD?",
    "Two questions. Then a shortlist of problems to explore, projects with open roles, and unclaimed ideas — ranked by how closely they match what you picked.",
  ),
];

export const defaultRoles: TeamRole[] = ["Chair", "Vice Chair", "Treasurer", "Technical Head"].map((name, sort) => ({
  id: `default-role-${sort}`,
  name,
  sort,
}));

const member = (sort: number, name: string, bio: string): TeamMember => ({
  id: `default-member-${sort}`,
  name,
  role_id: `default-role-${sort}`,
  bio,
  photo_url: null,
  linkedin_url: null,
  github_url: null,
  website_url: null,
  email: null,
  published: true,
  sort,
});

export const defaultMembers: TeamMember[] = [
  member(0, "Paridhi Laxkar", "Direction of the chapter, and what ACM @ Amity commits to each term."),
  member(1, "Vanshika Gupta", "Operations, events, and keeping projects moving between sessions."),
  member(2, "Gurjashan Singh Khaira", "Budget, resourcing and everything a project needs in order to run."),
  member(3, "Anuansh Tiwari", "Technical direction across projects, research and the BuildHub platform."),
];

export const defaultEvents: EventItem[] = [];

export const defaultAnnouncements: Announcement[] = [];

/** The shipped projects as table rows, so defaults and DB go through one path. */
export const defaultProjectRows: { row: ProjectRow; members: ProjectMemberRow[] }[] = defaultProjects.map((p, sort) => ({
  row: {
    id: `default-project-${p.slug}`,
    slug: p.slug,
    name: p.name,
    category: p.category,
    status: p.status,
    summary: p.summary,
    problem: p.problem,
    problem_slug: p.problemSlug ?? null,
    image_url: null,
    repo_url: p.repo ?? null,
    live_url: null,
    progress: p.progress,
    featured: Boolean(p.featured),
    published: true,
    sort,
    domains: p.domains,
    technologies: p.technologies,
    building: p.building,
    exists_now: p.currentState.exists,
    not_yet: p.currentState.notYet,
    contribute: p.contribute,
    timeline: p.timeline,
    open_roles: p.openRoles,
  },
  members: p.team.map((t, i) => ({ member_id: null, name: t.name, role: t.role, sort: i })),
}));
