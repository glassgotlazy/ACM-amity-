/**
 * DEMO ADMIN DATA. No real applications, members or submissions are stored —
 * this view exists to show the shape of the eventual back office.
 */

export type Application = {
  id: string;
  name: string;
  course: string;
  target: string;
  role: string;
  state: "new" | "reviewing" | "accepted" | "waitlist";
  when: string;
};

export type Submission = {
  id: string;
  title: string;
  area: string;
  anonymous: boolean;
  state: "queued" | "reviewing" | "published" | "declined";
  when: string;
};

export const adminStats = [
  { label: "Applications", value: 34, delta: "+9 this week", href: "#applications" },
  { label: "Active projects", value: 5, delta: "2 need leads", href: "/projects" },
  { label: "Open roles", value: 19, delta: "across 5 projects", href: "/teams" },
  { label: "Active contributors", value: 27, delta: "+4 this month", href: "/profile" },
  { label: "Problem submissions", value: 11, delta: "6 queued for review", href: "#submissions" },
];

export const applications: Application[] = [
  { id: "AP-1041", name: "Applicant A", course: "B.Tech CSE · Y2", target: "AI Admissions Assistant", role: "Backend", state: "new", when: "2h ago" },
  { id: "AP-1040", name: "Applicant B", course: "B.Tech IT · Y1", target: "ACM BuildHub", role: "Frontend", state: "new", when: "6h ago" },
  { id: "AP-1039", name: "Applicant C", course: "BCA · Y3", target: "Quantum Handshake", role: "Research", state: "reviewing", when: "Yesterday" },
  { id: "AP-1038", name: "Applicant D", course: "B.Tech CSE · Y2", target: "Campus Feedback Intelligence", role: "Data", state: "reviewing", when: "Yesterday" },
  { id: "AP-1037", name: "Applicant E", course: "B.Tech ECE · Y2", target: "Campus Information Hub", role: "Frontend", state: "accepted", when: "2 days ago" },
  { id: "AP-1036", name: "Applicant F", course: "MCA · Y1", target: "AI Admissions Assistant", role: "Testing", state: "waitlist", when: "3 days ago" },
];

export const submissions: Submission[] = [
  { id: "PS-212", title: "Hostel maintenance requests have no status", area: "Student Experience", anonymous: true, state: "queued", when: "3h ago" },
  { id: "PS-211", title: "Lab slot booking collides across sections", area: "Campus Technology", anonymous: false, state: "queued", when: "Yesterday" },
  { id: "PS-210", title: "Library search does not cover past question papers", area: "Data", anonymous: false, state: "reviewing", when: "2 days ago" },
  { id: "PS-209", title: "Campus maps are unusable for wheelchair routes", area: "Accessibility", anonymous: true, state: "reviewing", when: "4 days ago" },
  { id: "PS-208", title: "Event waste is never measured", area: "Sustainability", anonymous: false, state: "published", when: "Last week" },
  { id: "PS-207", title: "Shared lab machines keep credentials in plain text", area: "Cybersecurity", anonymous: true, state: "declined", when: "Last week" },
];

export const STATE_TONE: Record<string, string> = {
  new: "text-acm-bright",
  queued: "text-acm-bright",
  reviewing: "text-signal-work",
  accepted: "text-signal-live",
  published: "text-signal-live",
  waitlist: "text-ink-muted",
  declined: "text-ink-ghost",
};
