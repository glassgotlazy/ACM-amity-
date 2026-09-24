import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { FOOTER_GROUPS, type Brand, type NavItem, type PublicMember, type SiteSettings, type SocialLink } from "@/lib/cms/types";
import { cn } from "@/lib/utils";
import { Wordmark } from "./Wordmark";

const SOCIAL_LABEL: Record<SocialLink["platform"], string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  github: "GitHub",
  x: "X",
  youtube: "YouTube",
  discord: "Discord",
  whatsapp: "WhatsApp",
  email: "Email",
  website: "Website",
};

type Props = {
  brand: Brand;
  settings: SiteSettings;
  /** The same list the header uses; each item says which column it sits in. */
  nav: NavItem[];
  social: SocialLink[];
  team: PublicMember[];
};

export function Footer({ brand, settings, nav, social, team }: Props) {
  const columns = FOOTER_GROUPS.map((g) => ({ title: g.label, links: nav.filter((n) => n.footer_group === g.id) })).filter(
    (c) => c.links.length > 0,
  );
  const contact = [settings.contact_email, settings.contact_phone, settings.location].filter(Boolean);
  const registration = settings.registration_url;

  return (
    <footer className="rule-t relative overflow-hidden">
      <div className="shell py-20">
        <div className="grid gap-16 lg:grid-cols-[1.4fr_2fr]">
          <Reveal>
            <Wordmark brand={brand} size="lg" />

            {settings.footer_text ? (
              <p className="mt-6 max-w-sm text-sm leading-relaxed text-ink-muted">{settings.footer_text}</p>
            ) : null}

            {settings.pillars.length ? (
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
                {settings.pillars.map((word) => (
                  <li key={word} className="meta text-ink-muted">
                    {word}
                  </li>
                ))}
              </ul>
            ) : null}

            {contact.length ? (
              <ul className="mt-8 space-y-2 text-sm text-ink-muted">
                {settings.contact_email ? (
                  <li>
                    <a href={`mailto:${settings.contact_email}`} className="transition-colors hover:text-ink">
                      {settings.contact_email}
                    </a>
                  </li>
                ) : null}
                {settings.contact_phone ? (
                  <li>
                    <a href={`tel:${settings.contact_phone.replace(/[^\d+]/g, "")}`} className="transition-colors hover:text-ink">
                      {settings.contact_phone}
                    </a>
                  </li>
                ) : null}
                {settings.location ? <li>{settings.location}</li> : null}
              </ul>
            ) : null}

            {social.length ? (
              <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2" aria-label="Social links">
                {social.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target={link.url.startsWith("mailto:") ? undefined : "_blank"}
                      rel="noreferrer noopener"
                      className="font-mono text-label uppercase text-acm-bright transition-colors hover:text-ink"
                    >
                      {SOCIAL_LABEL[link.platform]} ↗
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </Reveal>

          <div className="grid gap-12 sm:grid-cols-3">
            {columns.map((col, i) => (
              <Reveal key={col.title} delay={0.05 * i}>
                <h3 className="meta">{col.title}</h3>
                <ul className="mt-5 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.id}>
                      <Link
                        href={link.href}
                        // /admin redirects every visitor without a session; prefetching
                        // it only caches a 307 the router would later reuse.
                        prefetch={link.href === "/admin" ? false : undefined}
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

        {registration || team.length ? (
          <Reveal
            className={cn(
              "mt-20 grid gap-px border border-line bg-line",
              registration && team.length ? "sm:grid-cols-[auto_1fr]" : undefined,
            )}
          >
            {registration ? (
              <div className="flex flex-wrap items-center gap-8 bg-void p-7">
                {/*
                  White plate: a QR needs a light field to scan reliably, so it is
                  treated as a deliberate object rather than tinted to match.

                  The size is a scanning requirement, not a layout preference. The
                  shipped symbol is 45 modules across including its quiet zone;
                  below about 120px it stops decoding at all, so it is set at
                  160–176px to keep roughly four pixels per module and leave
                  headroom for a phone held at an angle.
                */}
                {settings.registration_qr_url ? (
                  <a
                    href={registration}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="block shrink-0 border border-line bg-white p-2 transition-transform duration-300 ease-out hover:scale-[1.03]"
                    aria-label={`Open the ${settings.organization} registration form`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={settings.registration_qr_url}
                      alt=""
                      width={176}
                      height={176}
                      className="block h-40 w-40 sm:h-44 sm:w-44"
                    />
                  </a>
                ) : null}
                <div>
                  <div className="meta">Register</div>
                  <p className="mt-3 max-w-[14rem] text-sm leading-relaxed text-ink-muted">
                    {settings.registration_qr_url
                      ? "Scan, or open the registration form directly."
                      : "Open the registration form to join the chapter."}
                  </p>
                  <a
                    href={registration}
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
            ) : null}

            {team.length ? (
              <div className="flex flex-col justify-center bg-void p-7">
                <div className="meta">Core team</div>
                <ul className="mt-5 grid gap-x-10 gap-y-3 sm:grid-cols-2">
                  {team.map((person) => (
                    <li
                      key={person.id}
                      className="flex items-baseline justify-between gap-4 border-b border-line-faint pb-2.5"
                    >
                      <span className="text-sm text-ink">{person.name}</span>
                      <span className="shrink-0 font-mono text-micro uppercase text-ink-ghost">{person.role}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Reveal>
        ) : null}

        <div className="mt-16 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-micro uppercase text-ink-ghost">
            © {new Date().getFullYear()} {settings.copyright_text}
          </p>
          {settings.disclaimer_text ? (
            <p className="max-w-xl font-mono text-micro uppercase leading-relaxed text-ink-ghost">
              {settings.disclaimer_text}
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
