import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { REGISTRATION_URL, coreTeam } from "@/data/chapter";

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

        <Reveal className="mt-20 grid gap-px border border-line bg-line sm:grid-cols-[auto_1fr]">
          <div className="flex flex-wrap items-center gap-8 bg-void p-7">
            {/*
              White plate: a QR needs a light field to scan reliably, so it is
              treated as a deliberate object rather than tinted to match.

              The size is a scanning requirement, not a layout preference. This
              symbol is 45 modules across including its quiet zone; below about
              120px it stops decoding at all, so it is set at 160–176px to keep
              roughly four pixels per module and leave headroom for a phone
              held at an angle.
            */}
            <a
              href={REGISTRATION_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="block shrink-0 border border-line bg-white p-2 transition-transform duration-300 ease-out hover:scale-[1.03]"
              aria-label="Open the ACM @ Amity registration form"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/registration-qr.svg"
                alt=""
                width={176}
                height={176}
                className="block h-40 w-40 sm:h-44 sm:w-44"
              />
            </a>
            <div>
              <div className="meta">Register</div>
              <p className="mt-3 max-w-[14rem] text-sm leading-relaxed text-ink-muted">
                Scan, or open the registration form directly.
              </p>
              <a
                href={REGISTRATION_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="group mt-4 inline-flex items-center gap-2 font-mono text-label uppercase text-acm-bright transition-colors hover:text-ink"
              >
                Registration form
                <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
                  ↗
                </span>
              </a>
            </div>
          </div>

          <div className="flex flex-col justify-center bg-void p-7">
            <div className="meta">Core team</div>
            <ul className="mt-5 grid gap-x-10 gap-y-3 sm:grid-cols-2">
              {coreTeam.map((person) => (
                <li key={person.name} className="flex items-baseline justify-between gap-4 border-b border-line-faint pb-2.5">
                  <span className="text-sm text-ink">{person.name}</span>
                  <span className="shrink-0 font-mono text-micro uppercase text-ink-ghost">{person.role}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <div className="mt-16 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-micro uppercase text-ink-ghost">
            © {new Date().getFullYear()} ACM @ Amity University · Student chapter
          </p>
          <p className="max-w-xl font-mono text-micro uppercase leading-relaxed text-ink-ghost">
            Problem statements here are student-written explorations, not official university briefs. Application and
            submission figures in the admin view are demo content.
          </p>
        </div>
      </div>
    </footer>
  );
}
