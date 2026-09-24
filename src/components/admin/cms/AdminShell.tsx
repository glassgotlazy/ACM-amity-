"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SignOut } from "../SignOut";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { CmsProvider, ToastProvider } from "./kit";

const NAV: { group: string; items: { href: string; label: string }[] }[] = [
  { group: "", items: [{ href: "/admin", label: "Dashboard" }] },
  { group: "Inbox", items: [{ href: "/admin/submissions", label: "Submissions" }] },
  {
    group: "Website",
    items: [
      { href: "/admin/settings", label: "Site Settings" },
      { href: "/admin/navigation", label: "Navigation" },
      { href: "/admin/homepage", label: "Homepage" },
    ],
  },
  {
    group: "Content",
    items: [
      { href: "/admin/team", label: "Team" },
      { href: "/admin/roles", label: "Roles" },
      { href: "/admin/events", label: "Events" },
      { href: "/admin/projects", label: "Projects" },
      { href: "/admin/announcements", label: "Announcements" },
      { href: "/admin/media", label: "Media" },
    ],
  },
  { group: "Reference", items: [{ href: "/admin/catalogue", label: "Catalogue" }] },
];

/** Admin chrome: a fixed sidebar on desktop, a slide-in menu on phones. */
export function AdminShell({ siteName, children }: { siteName: string; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const sidebar = (
    <nav aria-label="Admin" className="flex h-full flex-col">
      <div className="border-b border-line px-5 py-5">
        <div className="text-[1.0625rem] font-semibold tracking-[-0.03em]">{siteName}</div>
        <div className="mt-1 font-mono text-micro uppercase text-acm-bright">Admin</div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((section) => (
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
      <div className="border-t border-line px-1 py-2">
        <SignOut />
      </div>
    </nav>
  );

  return (
    <ToastProvider>
      <CmsProvider>
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
      </CmsProvider>
    </ToastProvider>
  );
}
