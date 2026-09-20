/**
 * Chapter details that are real and confirmed — the office bearers and the
 * registration link. Everything here is verified information, unlike the demo
 * content elsewhere in this directory, so it carries no placeholder labelling.
 */

export const REGISTRATION_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfZuPSTlqs4rxTGgaAP6DwSO5-zjySCqdJj0GIu1wmj6jsD_w/viewform";

export type Officer = {
  name: string;
  role: string;
  /** What the role actually covers, so the title is not the whole story. */
  remit: string;
};

export const coreTeam: Officer[] = [
  {
    name: "Paridhi Laxhar",
    role: "Chair",
    remit: "Direction of the chapter, and what ACM @ Amity commits to each term.",
  },
  {
    name: "Vanshika Gupta",
    role: "Vice Chair",
    remit: "Operations, events, and keeping projects moving between sessions.",
  },
  {
    name: "Gurjashan Singh Khaira",
    role: "Treasurer",
    remit: "Budget, resourcing and everything a project needs in order to run.",
  },
  {
    name: "Anuansh Tiwari",
    role: "Technical Head",
    remit: "Technical direction across projects, research and the BuildHub platform.",
  },
];
