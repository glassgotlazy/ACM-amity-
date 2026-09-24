import type { Problem } from "../content-types";

/**
 * Built-in content, used only until "Load remaining content" copies it into
 * the database (see supabase/admin.sql). After that the database is the only
 * source and this file is never read by the public site.
 */
/**
 * These are problem statements written by ACM students from things they have
 * noticed on campus. They are exploration material — none of them has been
 * commissioned, confirmed or endorsed by Amity University, and none should be
 * described as an official university brief.
 */
export const defaultProblems: Problem[] = [
  {
    slug: "university-knowledge",
    index: 1,
    title: "The University Knowledge Problem",
    hook: "Everything is written down somewhere. Nobody knows where.",
    question:
      "How might we create a reliable system that allows students to find university information without searching across multiple platforms?",
    origin: "potential",
    category: "AI & Automation",
    domains: ["AI", "Software", "Data"],
    level: "research",
    context: [
      "Student portals",
      "PDF circulars",
      "Email threads",
      "Notice boards",
      "Department websites",
      "Class messaging groups",
    ],
    whyItMatters: [
      "The information usually exists. The cost is the search — a student ends up asking three people before finding a document that was published a month ago.",
      "Answers that get passed around by word of mouth drift. A date remembered wrongly by one person becomes the date an entire group believes.",
      "This is the clearest example on campus of a retrieval problem, which makes it an unusually good way to learn how retrieval systems actually behave outside a tutorial.",
    ],
    directions: [
      {
        title: "Retrieval over a curated corpus",
        detail:
          "Collect a bounded set of documents, chunk them carefully, embed them and answer only from what was retrieved. The interesting engineering is in chunking and in refusing to answer when confidence is low.",
      },
      {
        title: "Structured extraction first",
        detail:
          "Rather than answering free text, pull dates, fees and deadlines into a structured store and let the interface query it. Less impressive in a demo, far more reliable in practice.",
      },
      {
        title: "Citation-first interface",
        detail:
          "Treat the source document as the answer and the generated text as a pointer to it. Every response links back to the page it came from.",
      },
      {
        title: "Freshness and expiry",
        detail:
          "A notice from last semester is worse than no notice. Model document validity explicitly instead of hoping the ranking handles it.",
      },
    ],
    technologies: ["Retrieval (RAG)", "LLMs", "Vector search", "PostgreSQL", "Python", "REST APIs"],
    potentialProject: {
      name: "Campus Knowledge Assistant",
      summary:
        "A question-answering layer over a curated, permission-aware corpus of university documents that always cites its source and declines when it does not know.",
    },
    skills: ["Python", "Embeddings", "Prompt design", "API design", "Evaluation", "Interface design"],
    openRoles: ["AI / LLM", "Backend", "Frontend", "Research", "UX"],
    team: [
      { role: "AI / LLM", count: 2, note: "Retrieval pipeline, chunking strategy, evaluation harness" },
      { role: "Backend", count: 1, note: "Ingestion, storage, document freshness and access rules" },
      { role: "Frontend", count: 1, note: "Query interface, citation rendering, empty and refusal states" },
      { role: "Research", count: 1, note: "Answer quality methodology and failure analysis" },
    ],
    researchQuestions: [
      "What chunking strategy survives documents that mix tables, dates and prose?",
      "How do you measure whether an answer is correct when there is no labelled dataset?",
      "Can the system be made to say “I don’t know” often enough to be trusted, without becoming useless?",
      "What is the right unit of freshness — the document, the section, or the individual fact?",
    ],
    nextSteps: [
      "Assemble a corpus of 50–100 publicly available documents and label 40 real student questions against them.",
      "Build the smallest possible retrieval baseline — keyword search, no model — and record its accuracy.",
      "Only then introduce embeddings, and justify the improvement with numbers.",
      "Write up what broke. The failure list is the contribution.",
    ],
    featured: true,
  },
  {
    slug: "timetable-conflict",
    index: 2,
    title: "The Timetable Conflict Problem",
    hook: "A room changes. Forty people find out at different times.",
    question:
      "How might we create an intelligent scheduling system that detects conflicts and communicates relevant changes?",
    origin: "potential",
    category: "Campus Technology",
    domains: ["Software", "Data", "AI"],
    level: "deploy",
    context: ["Shifting schedules", "Room reallocation", "Elective clashes", "Last-minute substitutions"],
    whyItMatters: [
      "A schedule change is cheap to make and expensive to distribute. The cost lands on students who show up to the wrong room.",
      "Conflict detection is a genuinely hard constraint problem hiding behind a boring interface — good training for anyone who wants to work on optimisation.",
      "It is also a communication problem. The best solver in the world is useless if the change reaches people after the class starts.",
    ],
    directions: [
      {
        title: "Constraint modelling",
        detail:
          "Express rooms, cohorts, faculty and time as constraints and let a solver find the violations. Start by detecting conflicts, not resolving them.",
      },
      {
        title: "Change propagation",
        detail:
          "Work out who is actually affected by a given change, and reach only those people. Precision matters more than speed.",
      },
      {
        title: "Personal schedule view",
        detail:
          "A read-only layer that assembles one student’s real timetable from electives and section allocation, and shows the diff when it moves.",
      },
    ],
    technologies: ["Constraint solvers", "Graph algorithms", "APIs", "Notification services", "Calendar formats"],
    potentialProject: {
      name: "Smart Campus Scheduler",
      summary:
        "A conflict detection engine over timetable data, with a personal schedule view and targeted notifications when something a student depends on moves.",
    },
    skills: ["Algorithms", "Optimisation", "Backend engineering", "Data modelling", "Systems design"],
    openRoles: ["Backend", "Data", "Frontend", "DevOps"],
    team: [
      { role: "Backend", count: 2, note: "Constraint engine and change detection" },
      { role: "Data", count: 1, note: "Schema design and import of timetable formats" },
      { role: "Frontend", count: 1, note: "Personal schedule and diff visualisation" },
    ],
    researchQuestions: [
      "Which conflicts can be detected from partial data, and which need the full picture?",
      "How do you rank conflicts when you cannot resolve all of them?",
      "What notification frequency stops being helpful and starts being ignored?",
    ],
    nextSteps: [
      "Model a single department’s week as a constraint graph on paper first.",
      "Write the detector before the solver. Detection alone is a useful product.",
      "Test propagation logic against invented worst cases — two changes that cancel each other out, a change reverted an hour later.",
    ],
  },
  {
    slug: "student-feedback",
    index: 3,
    title: "The Student Feedback Problem",
    hook: "Thousands of responses. A summary nobody can act on.",
    question:
      "How might we analyse student feedback while preserving privacy and identifying recurring issues?",
    origin: "potential",
    category: "Data",
    domains: ["AI", "Data", "Research"],
    level: "research",
    context: ["Course feedback forms", "Event surveys", "Free-text comments", "Departmental reviews"],
    whyItMatters: [
      "Averages destroy information. A 3.4 out of 5 tells you nothing about the two specific things forty people wrote about.",
      "Feedback is only honest when it is genuinely anonymous — which makes privacy a design constraint, not a compliance checkbox.",
      "Recurring issues are hard to see one response at a time and obvious in aggregate. That gap is the entire opportunity.",
    ],
    directions: [
      {
        title: "Theme clustering over free text",
        detail:
          "Group comments by what they are about rather than by sentiment score, and surface clusters that repeat across terms.",
      },
      {
        title: "Privacy by construction",
        detail:
          "Enforce minimum cluster sizes, strip identifying detail at ingestion, and make it structurally impossible to drill down to one person.",
      },
      {
        title: "Change tracking",
        detail:
          "The valuable question is not what students said. It is whether what they said last term changed this term.",
      },
    ],
    technologies: ["NLP", "Clustering", "Sentiment analysis", "Anonymisation", "Analytics", "Visualisation"],
    potentialProject: {
      name: "Campus Feedback Intelligence",
      summary:
        "A privacy-preserving analysis pipeline that clusters free-text feedback into recurring themes and tracks how those themes move over time.",
    },
    skills: ["NLP", "Statistics", "Data visualisation", "Privacy engineering", "Python"],
    openRoles: ["AI / LLM", "Data", "Research", "Frontend"],
    team: [
      { role: "Data", count: 2, note: "Pipeline, clustering, anonymisation guarantees" },
      { role: "Research", count: 1, note: "Methodology, validity, and what the clusters actually mean" },
      { role: "Frontend", count: 1, note: "Analysis interface and longitudinal views" },
    ],
    researchQuestions: [
      "What is the smallest group size at which a theme can be reported without risking re-identification?",
      "Do sentiment scores add anything once you have themes?",
      "How do you distinguish a real shift in opinion from a change in who responded?",
    ],
    nextSteps: [
      "Write the privacy rules before any code, and treat them as acceptance tests.",
      "Validate clusters by manually labelling a sample — if a human disagrees with the grouping, the grouping is wrong.",
      "Build with synthetic or consented data only.",
    ],
  },
  {
    slug: "lost-information",
    index: 4,
    title: "The Lost Information Problem",
    hook: "The announcement went out. It is now unfindable.",
    question:
      "How might we create a centralised, searchable system for university announcements?",
    origin: "example",
    category: "Student Experience",
    domains: ["Web", "Software", "Data"],
    level: "integrate",
    context: ["Messaging groups", "Email", "Portal notices", "Printed boards", "Social posts"],
    whyItMatters: [
      "An announcement has a half-life measured in hours once it scrolls past in a group chat.",
      "Missing one notice can mean missing a deadline. The consequence is disproportionate to the cause.",
      "This is the most tractable problem on this page — a well-scoped build with a visible result, which makes it a good first ACM project.",
    ],
    directions: [
      {
        title: "Single searchable archive",
        detail: "One place where every announcement lands, with full-text search and no login wall for public notices.",
      },
      {
        title: "Categorisation and subscription",
        detail: "Let a student follow only their department, year and electives instead of receiving everything.",
      },
      {
        title: "Deadline extraction",
        detail: "Pull dates out of announcement text and turn them into something a calendar can read.",
      },
    ],
    technologies: ["Full-text search", "Web application", "APIs", "Databases", "Calendar formats"],
    potentialProject: {
      name: "Campus Information Hub",
      summary:
        "A searchable, categorised archive of announcements with per-student subscriptions and extracted deadlines.",
    },
    skills: ["Web development", "Search", "Database design", "UX writing"],
    openRoles: ["Frontend", "Backend", "UX", "Technical Writing"],
    team: [
      { role: "Frontend", count: 2, note: "Search interface, archive browsing, mobile-first reading" },
      { role: "Backend", count: 1, note: "Indexing, categorisation, subscription logic" },
      { role: "UX", count: 1, note: "Information architecture and notification design" },
    ],
    researchQuestions: [
      "What makes an announcement findable six months later — its title, its date, or its consequences?",
      "Can categorisation be inferred reliably, or does it need a human in the loop?",
    ],
    nextSteps: [
      "Archive a term’s worth of public notices manually and try to search them. That first pass teaches you the schema.",
      "Ship search before subscriptions. Search is the thing people will actually use.",
    ],
  },
  {
    slug: "campus-navigation",
    index: 5,
    title: "The Campus Navigation Problem",
    hook: "Block, floor, wing, room. Four unknowns in your first week.",
    question: "How might we create an intelligent campus navigation experience?",
    origin: "example",
    category: "Accessibility",
    domains: ["Software", "AI", "IoT", "Design"],
    level: "integrate",
    context: ["First-year orientation", "Lab and block locations", "Exam hall allocation", "Visitor access"],
    whyItMatters: [
      "Outdoor map services stop at the building entrance. Almost all of the confusion happens after that.",
      "The people who need this most — new students, visitors, anyone with a mobility constraint — are the least likely to ask for directions.",
      "Indoor positioning is a real technical problem with several credible approaches and no obvious winner, which makes it worth actually investigating.",
    ],
    directions: [
      {
        title: "QR waypoints",
        detail:
          "Cheap, robust, no positioning stack required. Scan a code at a junction, get directions from there. Unglamorous and likely to work.",
      },
      {
        title: "Indoor mapping",
        detail: "Model floors as connected graphs and route between them, including lifts, ramps and accessible paths.",
      },
      {
        title: "Visual localisation",
        detail:
          "Recognise where someone is from a camera frame. The most interesting option and the most likely to fail — which is why it belongs in a research track.",
      },
    ],
    technologies: ["Maps", "Graph routing", "QR", "Computer vision", "Location services", "Progressive web apps"],
    potentialProject: {
      name: "Smart Campus Navigation",
      summary:
        "An indoor routing experience that gets a person from a campus entrance to a specific room, with accessible-path awareness.",
    },
    skills: ["Mobile web", "Graph algorithms", "Computer vision", "Accessibility", "Interaction design"],
    openRoles: ["Frontend", "AI / LLM", "Design", "Backend"],
    team: [
      { role: "Frontend", count: 2, note: "Routing interface, offline behaviour, one-handed use" },
      { role: "Design", count: 1, note: "Wayfinding language and accessible route presentation" },
      { role: "Backend", count: 1, note: "Map graph, waypoint registry, floor data" },
    ],
    researchQuestions: [
      "How accurate does indoor positioning have to be before it beats a printed sign?",
      "What does an accessible route mean in a building that was not designed with one?",
      "Can a navigation interface work with one hand, in a corridor, while late?",
    ],
    nextSteps: [
      "Map one building completely. One good floor plan beats a partial model of the whole campus.",
      "Prototype the QR approach first — it sets the bar every clever approach has to beat.",
    ],
  },
  {
    slug: "administrative-automation",
    index: 6,
    title: "The Administrative Automation Problem",
    hook: "The same form, the same signature, the same six steps.",
    question:
      "Which repetitive administrative workflows could be safely automated while preserving necessary human oversight?",
    origin: "challenge",
    category: "Administration",
    domains: ["Software", "AI", "Cloud"],
    level: "deploy",
    context: ["Form routing", "Approval chains", "Status enquiries", "Record reconciliation"],
    whyItMatters: [
      "Repetition is expensive in a way nobody measures, because the cost is spread across everyone a little at a time.",
      "Automation without oversight is worse than the manual process. The design question is where the human stays, not how to remove them.",
      "It forces a genuinely useful discipline: mapping a process before writing a line of code.",
    ],
    directions: [
      {
        title: "Process mapping first",
        detail:
          "Document an existing workflow end to end, including the exceptions. Most of the value is created here, before any automation exists.",
      },
      {
        title: "Status transparency",
        detail:
          "Many enquiries exist only because a request is a black box. Showing where something is removes the need to ask.",
      },
      {
        title: "Human-in-the-loop by design",
        detail:
          "Automate assembly and routing; keep judgement, approval and exceptions with a person, explicitly and visibly.",
      },
    ],
    technologies: ["Workflow engines", "APIs", "Document automation", "Audit logging", "Access control"],
    potentialProject: {
      name: "Campus Automation Engine",
      summary:
        "A workflow layer that handles the routing and status of repetitive requests while keeping approval and exception handling with a person.",
    },
    skills: ["Systems design", "Process analysis", "Backend engineering", "Security", "Technical writing"],
    openRoles: ["Backend", "Security", "Technical Writing", "UX"],
    team: [
      { role: "Backend", count: 2, note: "Workflow engine, audit trail, integrations" },
      { role: "Security", count: 1, note: "Access control and data handling review" },
      { role: "Technical Writing", count: 1, note: "Process documentation — the real deliverable" },
    ],
    researchQuestions: [
      "Which steps in a workflow carry judgement, and which are purely mechanical?",
      "What has to be logged for an automated decision to remain reviewable months later?",
      "How do you fail safely when an automated step is wrong?",
    ],
    nextSteps: [
      "Pick one workflow. Document every step, every exception and every person who touches it.",
      "Publish the map. If nothing gets automated, the map is still worth having.",
      "Automate only the steps that nobody disagrees about.",
    ],
  },
];
