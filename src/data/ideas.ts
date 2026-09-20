import type { Domain, LevelId } from "./taxonomy";

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

/**
 * Starting points for students who want to build but have not found a problem
 * yet. These are unclaimed — none of them has a team.
 */
export const ideas: Idea[] = [
  {
    slug: "campus-event-aggregator",
    name: "Campus Event Aggregator",
    tagline: "One page that knows what is happening this week, and where.",
    level: "build",
    band: "Beginner",
    domains: ["Web", "Software"],
    teamSize: "2–3",
    technologies: ["React", "Next.js", "REST APIs", "Local storage"],
    skills: ["Web development", "State management", "Responsive layout"],
    learn: [
      "How to model a domain properly before writing components",
      "Date and timezone handling, which is harder than it looks",
      "Shipping something small that is genuinely finished",
    ],
  },
  {
    slug: "ai-feedback-analyser",
    name: "AI Student Feedback Analyser",
    tagline: "Turn a thousand free-text comments into five things worth acting on.",
    level: "integrate",
    band: "Intermediate",
    domains: ["AI", "Data"],
    teamSize: "3–4",
    technologies: ["Python", "Embeddings", "Clustering", "Visualisation"],
    skills: ["NLP", "Data analysis", "Statistics", "Python"],
    learn: [
      "Clustering and how to tell a real cluster from an artefact",
      "Evaluating an unsupervised result without labels",
      "Privacy as an engineering constraint",
    ],
    problemSlug: "student-feedback",
  },
  {
    slug: "university-knowledge-graph",
    name: "University Knowledge Graph",
    tagline: "Courses, faculty, labs, prerequisites and research, as a queryable graph.",
    level: "deploy",
    band: "Advanced",
    domains: ["Data", "Software", "AI"],
    teamSize: "4–5",
    technologies: ["Graph databases", "Entity resolution", "GraphQL", "Python"],
    skills: ["Data modelling", "Graph theory", "Backend engineering", "API design"],
    learn: [
      "Ontology design, where most of the difficulty actually lives",
      "Entity resolution across inconsistent sources",
      "Query languages that are not SQL",
    ],
    problemSlug: "university-knowledge",
  },
  {
    slug: "academic-recommendation",
    name: "AI Academic Recommendation Systems",
    tagline: "What should a student take next, and can you justify the answer?",
    level: "research",
    band: "Research",
    domains: ["AI", "Research", "Data"],
    teamSize: "3–4",
    technologies: ["Recommender systems", "Python", "Evaluation frameworks"],
    skills: ["Machine learning", "Evaluation methodology", "Statistics", "Research writing"],
    learn: [
      "Why offline recommender metrics routinely mislead",
      "Fairness and feedback loops in academic recommendation",
      "Writing up a negative result as a contribution",
    ],
  },
  {
    slug: "quantum-cryptography-simulation",
    name: "Quantum Cryptography Simulation",
    tagline: "Implement a key distribution protocol in simulation and attack it.",
    level: "research",
    band: "Research",
    domains: ["Quantum", "Cybersecurity", "Research"],
    teamSize: "2–3",
    technologies: ["Quantum computing frameworks", "Python", "Cryptography"],
    skills: ["Quantum fundamentals", "Cryptography", "Mathematics", "Simulation"],
    learn: [
      "Qubits, measurement and why eavesdropping is detectable",
      "Reading a protocol paper closely enough to implement it",
      "The gap between a protocol on paper and a protocol in code",
    ],
  },
  {
    slug: "lab-equipment-tracker",
    name: "Lab Equipment Tracker",
    tagline: "What is in the lab, who has it, and when it comes back.",
    level: "build",
    band: "Beginner",
    domains: ["Web", "IoT", "Software"],
    teamSize: "2–3",
    technologies: ["Next.js", "SQLite", "QR codes"],
    skills: ["CRUD design", "Database basics", "Interface design"],
    learn: [
      "Designing a schema that survives contact with real use",
      "Scan-based interactions on mobile",
      "Handling the awkward states — lost, overdue, broken",
    ],
  },
  {
    slug: "attendance-anomaly",
    name: "Attendance Pattern Analysis",
    tagline: "Find the signal that says a student is drifting, early enough to matter.",
    level: "integrate",
    band: "Intermediate",
    domains: ["Data", "AI"],
    teamSize: "3",
    technologies: ["Python", "Time series", "Anomaly detection", "Visualisation"],
    skills: ["Statistics", "Data analysis", "Ethics of prediction"],
    learn: [
      "Time-series anomaly detection on messy real-world data",
      "The difference between a prediction and a judgement about a person",
      "Why some accurate models should not be deployed",
    ],
  },
  {
    slug: "campus-api",
    name: "Open Campus API",
    tagline: "One documented API that every other campus project can build on.",
    level: "deploy",
    band: "Advanced",
    domains: ["Cloud", "Software", "Web"],
    teamSize: "3–4",
    technologies: ["Node.js", "PostgreSQL", "OpenAPI", "Docker", "CI/CD"],
    skills: ["API design", "Infrastructure", "Documentation", "Versioning"],
    learn: [
      "Designing an interface other people depend on",
      "Versioning and the cost of a breaking change",
      "Documentation as a first-class deliverable",
    ],
  },
  {
    slug: "accessibility-audit-tool",
    name: "Campus Web Accessibility Audit",
    tagline: "Measure how usable university web surfaces actually are, then fix one.",
    level: "integrate",
    band: "Intermediate",
    domains: ["Web", "Design", "Data"],
    teamSize: "2–3",
    technologies: ["Playwright", "axe-core", "Node.js", "Reporting"],
    skills: ["Accessibility", "Automation", "Technical writing"],
    learn: [
      "WCAG in practice rather than in theory",
      "Automated auditing and its real limits",
      "Writing a report that leads to a change",
    ],
  },
  {
    slug: "phishing-awareness-range",
    name: "Phishing Awareness Range",
    tagline: "A safe, consented environment for teaching people to spot an attack.",
    level: "research",
    band: "Advanced",
    domains: ["Cybersecurity", "Web", "Research"],
    teamSize: "3–4",
    technologies: ["Web application", "Sandboxing", "Analytics"],
    skills: ["Security fundamentals", "Ethics and consent", "Backend engineering"],
    learn: [
      "Security education design under strict ethical constraints",
      "Why consent and scoping come before any technical work",
      "Measuring whether training actually changed behaviour",
    ],
  },
];

export const BANDS = ["Beginner", "Intermediate", "Advanced", "Research"] as const;

export function ideaBySlug(slug: string) {
  return ideas.find((i) => i.slug === slug);
}
