import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { href: "/projects", label: "Projects" },
      { href: "/problems", label: "Problem Lab" },
      { href: "/ideas", label: "Project Ideas" },
      { href: "/research", label: "Research" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "/teams", label: "Teams" },
      { href: "/activity", label: "Activity" },
      { href: "/profile", label: "Contribution Profile" },
      { href: "/discover", label: "Find Your Project" },
    ],
  },
  {
    title: "Take part",
    links: [
      { href: "/join", label: "Join ACM" },
      { href: "/problems/submit", label: "Submit a Problem" },
      { href: "/projects/admissions-ai", label: "Apply to a Project" },
      { href: "/admin", label: "Admin" },
    ],
  },
];

/** Placeholders. No invented handles or URLs — these are wired up by a human. */
const SOCIAL = [
  { label: "Instagram", value: "Link to be added" },
  { label: "LinkedIn", value: "Link to be added" },
  { label: "Contact", value: "Address to be added" },
];

export function Footer() {
  return (
    <footer className="rule-t relative overflow-hidden">
      <div className="shell py-20">
        <div className="grid gap-16 lg:grid-cols-[1.4fr_2fr]">
          <Reveal>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-semibold tracking-[-0.03em]">ACM</span>
              <span className="h-5 w-px bg-line-strong" aria-hidden />
              <span className="meta">@ Amity University</span>
            </div>

            <p className="mt-6 max-w-sm text-sm leading-relaxed text-ink-muted">
              BuildHub is where campus problems become projects, projects become teams, and teams leave behind something
              you can point at.
            </p>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
              {["Build", "Research", "Learn", "Collaborate"].map((word) => (
                <li key={word} className="meta text-ink-muted">
                  {word}
                </li>
              ))}
            </ul>
          </Reveal>

          <div className="grid gap-12 sm:grid-cols-3">
            {COLUMNS.map((col, i) => (
              <Reveal key={col.title} delay={0.05 * i}>
                <h3 className="meta">{col.title}</h3>
                <ul className="mt-5 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-ink-muted transition-colors duration-200 hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal className="mt-20 grid gap-px border border-line bg-line sm:grid-cols-4">
          <div className="bg-void p-6">
            <div className="meta">Registration</div>
            <div className="mt-3 flex h-20 w-20 items-center justify-center border border-dashed border-line-strong">
              <span className="text-center font-mono text-[0.5rem] uppercase leading-tight text-ink-ghost">
                QR code
                <br />
                placeholder
              </span>
            </div>
            <p className="mt-3 font-mono text-micro uppercase text-ink-ghost">Registration link to be added</p>
          </div>
          {SOCIAL.map((item) => (
            <div key={item.label} className="bg-void p-6">
              <div className="meta">{item.label}</div>
              <p className="mt-3 text-sm text-ink-faint">{item.value}</p>
            </div>
          ))}
        </Reveal>

        <div className="mt-16 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-micro uppercase text-ink-ghost">
            © {new Date().getFullYear()} ACM @ Amity University · Student chapter
          </p>
          <p className="max-w-xl font-mono text-micro uppercase leading-relaxed text-ink-ghost">
            Problem statements here are student-written explorations, not official university briefs. Profile and
            activity figures are demo content.
          </p>
        </div>
      </div>
    </footer>
  );
}
