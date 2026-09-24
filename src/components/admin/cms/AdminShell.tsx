"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SignOut } from "../SignOut";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { CmsProvider, ToastProvider, useCms } from "./kit";
import { can, ROLE_LABEL, type Permission } from "@/lib/admin-permissions";
import type { AdminRole } from "@/lib/admin-auth";

type Item = { href: string; label: string; need: Permission; accountOnly?: boolean };

const NAV: { group: string; items: Item[] }[] = [
  { group: "", items: [{ href: "/admin", label: "Dashboard", need: "admin:read" }] },
  {
    group: "Inbox",
    items: [
      { href: "/admin/submissions", label: "Submissions", need: "submissions:read" },
      { href: "/admin/emails", label: "Emails", need: "settings:write" },
    ],
  },
  {
    group: "Website",
    items: [
      { href: "/admin/settings", label: "Site Settings", need: "settings:write" },
      { href: "/admin/navigation", label: "Navigation", need: "settings:write" },
      { href: "/admin/homepage", label: "Homepage", need: "settings:write" },
      { href: "/admin/pages", label: "Pages", need: "settings:write" },
      { href: "/admin/media", label: "Media", need: "media:write" },
    ],
  },
  {
    group: "People",
    items: [
      { href: "/admin/team", label: "Team", need: "content:write" },
      { href: "/admin/roles", label: "Roles", need: "content:write" },
      { href: "/admin/working-teams", label: "Working teams", need: "content:write" },
    ],
  },
  {
    group: "Content",
    items: [
      { href: "/admin/projects", label: "Projects", need: "content:write" },
      { href: "/admin/problems", label: "Problem statements", need: "content:write" },
      { href: "/admin/ideas", label: "Project ideas", need: "content:write" },
      { href: "/admin/research", label: "Research", need: "content:write" },
      { href: "/admin/events", label: "Events", need: "events:write" },
      { href: "/admin/announcements", label: "Announcements", need: "events:write" },
      { href: "/admin/activity", label: "Activity log", need: "content:write" },
    ],
  },
  {
    group: "Admin",
    items: [
      { href: "/admin/admins", label: "Admins", need: "admins:manage" },
      { href: "/admin/audit", label: "Audit log", need: "audit:read" },
      { href: "/admin/backup", label: "Backup", need: "backup:read" },
      { href: "/admin/account", label: "My account", need: "admin:read", accountOnly: true },
    ],
  },
];

/** Admin chrome: a fixed sidebar on desktop, a slide-in menu on phones. */
export function AdminShell({ siteName, children }: { siteName: string; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <ToastProvider>
      <CmsProvider>
        <Shell siteName={siteName} pathname={pathname} open={open} setOpen={setOpen}>
          {children}
        </Shell>
      </CmsProvider>
    </ToastProvider>
  );
}

/** Only the sections this role may use. The server enforces the same rules. */
function visibleNav(role: string, account: boolean) {
  if (!role) return NAV.slice(0, 1);
  return NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => can(role as AdminRole, i.need) && (!i.accountOnly || account)),
  })).filter((g) => g.items.length);
}

function Shell({
  siteName,
  pathname,
  open,
  setOpen,
  children,
}: {
  siteName: string;
  pathname: string;
  open: boolean;
  setOpen: (v: boolean) => void;
  children: ReactNode;
}) {
  const { role, account } = useCms();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const sidebar = (
    <nav aria-label="Admin" className="flex h-full flex-col">
      <div className="border-b border-line px-5 py-5">
        <div className="text-[1.0625rem] font-semibold tracking-[-0.03em]">{siteName}</div>
        <div className="mt-1 font-mono text-micro uppercase text-acm-bright">Admin</div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {visibleNav(role, account).map((section) => (
          <div key={section.group || "main"} className="mb-5">
            {section.group ? (
              <div className="px-2 pb-2 font-mono text-micro uppercase text-ink-ghost">{section.group}</div>
            ) : null}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    prefetch={false}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "block border-l-2 px-3 py-2 text-sm transition-colors",
                      isActive(item.href)
                        ? "border-acm bg-surface text-ink"
                        : "border-transparent text-ink-muted hover:bg-surface/60 hover:text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-3">
        <a href="/" target="_blank" rel="noreferrer" className="whitespace-nowrap px-2 font-mono text-label uppercase text-ink-faint hover:text-ink">
          View site ↗
        </a>
        <ThemeToggle />
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-line px-1 py-2">
        <SignedInAs />
        <SignOut />
      </div>
    </nav>
  );

  return (
    <>
        <div className="min-h-screen bg-void lg:grid lg:grid-cols-[15rem_1fr]">
          <a
            href="#admin-main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[400] focus:bg-acm-solid focus:px-4 focus:py-3 focus:font-mono focus:text-label focus:uppercase focus:text-white"
          >
            Skip to content
          </a>

          <aside className="sticky top-0 hidden h-screen border-r border-line bg-surface/30 lg:block">{sidebar}</aside>

          <div className="flex items-center justify-between border-b border-line px-5 py-3 lg:hidden">
            <span className="font-semibold tracking-[-0.02em]">
              {siteName} <span className="font-mono text-micro uppercase text-acm-bright">Admin</span>
            </span>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls="admin-menu"
              className="h-10 px-3 font-mono text-label uppercase text-ink"
            >
              Menu
            </button>
          </div>

          {open ? (
            <div className="fixed inset-0 z-[150] lg:hidden" id="admin-menu">
              <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-hidden />
              <div className="absolute inset-y-0 left-0 w-72 border-r border-line bg-void">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="absolute right-2 top-3 h-9 w-9 text-ink-faint hover:text-ink"
                >
                  ✕
                </button>
                {sidebar}
              </div>
            </div>
          ) : null}

          <div id="admin-main" className="min-w-0">
            {children}
          </div>
        </div>
    </>
  );
}

function SignedInAs() {
  const { actor, role } = useCms();
  return actor ? (
    <span className="truncate px-3 text-xs text-ink-faint">
      {actor}
      {role ? ` · ${ROLE_LABEL[role as AdminRole] ?? role}` : ""}
    </span>
  ) : (
    <span />
  );
}
