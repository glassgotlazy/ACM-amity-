import type { Project } from "../types";

/**
 * The projects the site shipped with. Used only until the CMS is initialised
 * (see supabase/cms.sql): "Load current website content" in the admin copies
 * these into the database, after which the database is the only source and
 * this file is never read by the public site again.
 */
export const defaultProjects: Omit<Project, "id">[] = [
  {
    slug: "admissions-ai",
    name: "AI Admissions Assistant",
    category: "AI / Software",
    status: "development",
    domains: ["AI", "Software", "Web"],
    summary:
      "A conversational assistant that answers admission questions about Amity Lucknow from a curated knowledge base, and declines anything outside that scope.",
    problem:
      "Prospective students ask the same few hundred questions about courses, eligibility, fees, hostels and placements — across forms, phone calls and messages. The answers exist in documents; the work is in getting a person to the right one.",
    problemSlug: "university-knowledge",
    building: [
      "A retrieval engine over a hand-written knowledge base of admission topics, so the common questions are answered instantly and without a network call.",
      "A scope gate that decides whether a question is actually about the university before anything is sent anywhere. It is enforced in the browser and again on the server.",
      "An optional model-backed fallback for in-scope questions the knowledge base does not cover.",
      "Supporting tools around the core answer path — an eligibility check, a cost estimate and a shareable answer link.",
    ],
    currentState: {
      exists: [
        "A working offline build that answers its knowledge-base topics with no API key and no internet connection.",
        "A two-layer scope gate, with the server rejecting out-of-scope requests before any upstream call.",
        "A small Express server that brokers the optional fallback when a key is configured.",
      ],
      notYet: [
        "No live deployment serving prospective students.",
        "No retrieval over official university documents — the knowledge base is written and maintained manually.",
        "No evaluation set, so answer quality is reviewed by reading rather than measured.",
        "Not an official university admissions channel, and not a replacement for one.",
      ],
    },
    technologies: ["JavaScript", "Node.js", "Express", "LLM APIs", "Retrieval", "Conversation design"],
    team: [
      { name: "Project lead", role: "Knowledge base + retrieval" },
      { name: "Open", role: "Frontend" },
      { name: "Open", role: "Evaluation" },
    ],
    openRoles: [
      { role: "Frontend", level: "Intermediate", what: "Conversation interface, answer rendering, mobile behaviour" },
      { role: "Backend", level: "Intermediate", what: "Scope gate hardening, rate limiting, provider abstraction" },
      { role: "AI / LLM", level: "Advanced", what: "Move from hand-written topics to retrieval over real documents" },
      { role: "Testing", level: "Beginner", what: "Build the question set that tells us whether an answer is right" },
      { role: "UX", level: "Beginner", what: "Refusal states, empty states, and what the assistant says when unsure" },
    ],
    contribute: [
      "Write questions. The single most useful contribution right now is a list of real questions the assistant gets wrong.",
      "Take one topic area and make its answers precise, sourced and current.",
      "Build the evaluation harness so quality stops being a matter of opinion.",
      "Improve how a refusal reads — that is most of the trust.",
    ],
    timeline: [
      { phase: "Define", state: "done", detail: "Scope fixed to admissions. Everything outside it is refused by design." },
      { phase: "Build", state: "done", detail: "Offline knowledge base and retrieval engine running with no dependencies." },
      { phase: "Integrate", state: "active", detail: "Optional model fallback behind a server-side scope gate." },
      { phase: "Evaluate", state: "next", detail: "A labelled question set and an accuracy number we can defend." },
      { phase: "Deploy", state: "later", detail: "Only after evaluation. Accuracy before availability." },
    ],
    progress: 55,
    featured: true,
  },
  {
    slug: "quantum-handshake",
    name: "Quantum Handshake",
    category: "Research",
    status: "ongoing",
    domains: ["Quantum", "Research", "Cybersecurity"],
    summary:
      "An ongoing research project exploring concepts related to quantum handshake protocols and emerging areas of quantum computing and communication.",
    problem:
      "Key exchange as we practise it today rests on assumptions about what is computationally hard. Quantum approaches to establishing a shared secret change those assumptions — and the literature is large, uneven and worth reading properly before anyone claims anything.",
    building: [
      "A structured literature review of quantum key distribution and handshake-adjacent protocols.",
      "Simulation work using existing quantum computing frameworks, to develop intuition for what the protocols actually do.",
      "A written record of what we understood, what we could not reproduce, and where our reasoning is uncertain.",
    ],
    currentState: {
      exists: [
        "An active reading group working through foundational papers.",
        "Early simulation notebooks reproducing textbook protocol behaviour.",
        "A running list of open questions the group cannot yet answer.",
      ],
      notYet: [
        "No novel result, no proof, and no claim of a breakthrough.",
        "No published paper and no submission under review.",
        "No hardware access — everything is simulated.",
        "Nothing here should be cited as an established finding.",
      ],
    },
    technologies: ["Quantum computing frameworks", "Python", "Cryptography", "Information theory", "Simulation"],
    team: [
      { name: "Research lead", role: "Literature + direction" },
      { name: "Open", role: "Simulation" },
      { name: "Open", role: "Literature review" },
    ],
    openRoles: [
      { role: "Research", level: "Any", what: "Read a paper, summarise it for the group, defend your reading" },
      { role: "AI / LLM", level: "Advanced", what: "Simulation work and numerical experiments" },
      { role: "Technical Writing", level: "Intermediate", what: "Turn the group’s notes into something readable" },
    ],
    contribute: [
      "You do not need quantum background to start. You need to be willing to read something difficult twice.",
      "Reproduce a result from a paper in simulation and report honestly whether it worked.",
      "Maintain the annotated bibliography — an underrated and genuinely citable contribution.",
    ],
    timeline: [
      { phase: "Idea", state: "done", detail: "Scope agreed: understand the protocols before attempting anything original." },
      { phase: "Literature", state: "active", detail: "Systematic reading and annotation, in progress." },
      { phase: "Experiment", state: "next", detail: "Simulation of selected protocols under stated assumptions." },
      { phase: "Analysis", state: "later", detail: "What the simulations support, and what they do not." },
      { phase: "Paper", state: "later", detail: "Only if there is something worth saying." },
    ],
    progress: 30,
    featured: true,
  },
  {
    slug: "campus-information-hub",
    name: "Campus Information Hub",
    category: "Web / Software",
    status: "proposed",
    domains: ["Web", "Software", "Data"],
    summary:
      "A searchable archive of university announcements with per-student subscriptions and extracted deadlines.",
    problem:
      "Announcements are distributed across channels that are good at delivery and bad at retrieval. A notice reaches everyone once and then becomes effectively unfindable.",
    problemSlug: "lost-information",
    building: [
      "A single archive with full-text search across every announcement.",
      "Categorisation by department, year and programme, so a student subscribes to a slice rather than everything.",
      "Deadline extraction that turns announcement text into calendar entries.",
    ],
    currentState: {
      exists: ["A written problem statement and a proposed scope.", "An agreed first milestone: search before subscriptions."],
      notYet: [
        "No code has been written yet — this project is looking for a founding team.",
        "No data source has been agreed, and no content is being collected.",
      ],
    },
    technologies: ["Next.js", "PostgreSQL", "Full-text search", "REST APIs", "iCalendar"],
    team: [{ name: "Open", role: "Project lead" }],
    openRoles: [
      { role: "Frontend", level: "Beginner", what: "Search interface and archive browsing — a good first project" },
      { role: "Backend", level: "Intermediate", what: "Indexing, categorisation and subscription logic" },
      { role: "UX", level: "Beginner", what: "Information architecture and notification design" },
    ],
    contribute: [
      "This project has no team yet. The first person in gets to set its direction.",
      "Archive a term’s worth of public notices manually — that first pass teaches you the schema.",
      "Design the search result. That single component decides whether the product works.",
    ],
    timeline: [
      { phase: "Define", state: "active", detail: "Scope written. Looking for a team to take it." },
      { phase: "Design", state: "next", detail: "Schema, information architecture, search result design." },
      { phase: "Build", state: "later", detail: "Archive and search." },
      { phase: "Deploy", state: "later", detail: "Subscriptions and deadline extraction." },
    ],
    progress: 10,
  },
  {
    slug: "campus-feedback-intelligence",
    name: "Campus Feedback Intelligence",
    category: "Data / AI",
    status: "exploring",
    domains: ["Data", "AI", "Research"],
    summary:
      "A privacy-preserving pipeline that clusters free-text student feedback into recurring themes and tracks them over time.",
    problem:
      "Feedback arrives in volume and gets reduced to an average. The specific, repeated, actionable thing that forty people wrote is exactly the information the average destroys.",
    problemSlug: "student-feedback",
    building: [
      "A clustering pipeline that groups comments by subject rather than sentiment.",
      "Anonymisation and minimum-cluster-size rules enforced in the pipeline, not in the interface.",
      "A longitudinal view showing whether a theme is growing or fading.",
    ],
    currentState: {
      exists: ["Exploratory work on clustering approaches using synthetic data.", "A first draft of the privacy rules."],
      notYet: [
        "No real feedback data is being used, and none will be without consent and a review.",
        "No validated methodology yet — cluster quality is still being checked manually.",
      ],
    },
    technologies: ["Python", "NLP", "Clustering", "Anonymisation", "Visualisation"],
    team: [
      { name: "Open", role: "Data lead" },
      { name: "Open", role: "Research" },
    ],
    openRoles: [
      { role: "Data", level: "Intermediate", what: "Clustering pipeline and evaluation of cluster quality" },
      { role: "Research", level: "Advanced", what: "Privacy guarantees and methodology" },
      { role: "Frontend", level: "Intermediate", what: "Analysis interface and longitudinal views" },
    ],
    contribute: [
      "Hand-label a sample so the clustering has something to be measured against.",
      "Write the privacy rules as executable tests.",
      "Design a visualisation that shows change over time without implying causation.",
    ],
    timeline: [
      { phase: "Define", state: "done", detail: "Problem framed; privacy treated as a hard constraint." },
      { phase: "Research", state: "active", detail: "Clustering approaches evaluated on synthetic data." },
      { phase: "Build", state: "next", detail: "Pipeline with anonymisation enforced at ingestion." },
      { phase: "Analysis", state: "later", detail: "Longitudinal theme tracking." },
    ],
    progress: 22,
  },
  {
    slug: "buildhub-platform",
    name: "ACM BuildHub",
    category: "Web / Platform",
    status: "current",
    domains: ["Web", "Software", "Design"],
    summary:
      "The platform you are reading — the place where campus problems, ACM projects, teams and contributions are connected.",
    problem:
      "A club page tells you a society exists. It does not tell you what is being built, what is unsolved, or where a new person could usefully start. That gap is why most people who are interested never join anything.",
    building: [
      "A Problem Lab where campus problems are written down properly instead of living in conversation.",
      "Project pages that are honest about what exists and what does not.",
      "A contribution record, so a student leaves with evidence rather than a membership line.",
    ],
    currentState: {
      exists: [
        "The public site, deployed, with problem, project, research, team and contribution surfaces.",
        "Application and submission flows that are stored and reviewed in a real admin queue.",
        "Light and dark themes, both measured at zero WCAG AA contrast failures.",
        "A contribution profile and activity feed built from the project repositories.",
      ],
      notYet: [
        "No authentication for members — the admin view is gated by one shared password.",
        "No automatic contribution tracking from GitHub.",
      ],
    },
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"],
    team: [{ name: "Web team", role: "Design + build" }],
    openRoles: [
      { role: "Frontend", level: "Any", what: "Components, interaction detail, accessibility passes" },
      { role: "Backend", level: "Intermediate", what: "Wire contribution tracking to real repository activity" },
      { role: "Design", level: "Intermediate", what: "Editorial layout work and the contribution record design" },
    ],
    contribute: [
      "Submit a problem you have noticed. That is the fastest way to change what this site is about.",
      "Take one page and make it better on a 360px screen.",
      "Replace the last demo figure — team sizes — with a real roster.",
    ],
    timeline: [
      { phase: "Design", state: "done", detail: "Problem-first information architecture agreed." },
      { phase: "Build", state: "done", detail: "Public site, discovery, and application flows." },
      { phase: "Integrate", state: "done", detail: "Submissions stored and reviewed in the admin queue." },
      { phase: "Deploy", state: "active", detail: "Contribution tracking wired to real repositories." }
    ],
    progress: 82,
  },
];
