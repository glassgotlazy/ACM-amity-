"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion, useScroll, useMotionValueEvent } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";
import { ThemeToggle } from "./ThemeToggle";
import { openSearch } from "./CommandPalette";
import { isAdminPath } from "./HideOnAdmin";
import { Wordmark } from "./Wordmark";
import type { Brand, NavItem } from "@/lib/cms/types";

/** Links, their order and the wordmark all come from the CMS via the layout. */
export function Navbar({ brand, items, extra }: { brand: Brand; items: NavItem[]; extra: NavItem[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  // Route changes always dismiss the mobile sheet.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = open ? "hidden" : overflow;
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  if (isAdminPath(pathname)) return null;

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-acm-solid focus:px-4 focus:py-3 focus:font-mono focus:text-label focus:uppercase focus:text-white"
      >
        Skip to content
      </a>

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[90] transition-[background-color,border-color,backdrop-filter] duration-300 ease-out",
          scrolled || open
            ? "border-b border-line bg-void/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="shell flex h-[4.5rem] items-center justify-between gap-8">
          <Link href="/" className="group flex items-center gap-3" aria-label={brand.label}>
            <Wordmark brand={brand} size="sm" />
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative px-3.5 py-2 font-mono text-label uppercase transition-colors duration-200",
                    active ? "text-ink" : "text-ink-faint hover:text-ink",
                  )}
                >
                  {item.label}
                  {active ? (
                    reduce ? (
                      <span className="absolute inset-x-3.5 -bottom-px h-px bg-acm" />
                    ) : (
                      <motion.span layoutId="nav-active" className="absolute inset-x-3.5 -bottom-px h-px bg-acm" />
                    )
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={openSearch}
              aria-label="Search the site"
              className="inline-flex h-10 items-center gap-2.5 border border-line px-3.5 font-mono text-label uppercase text-ink-faint transition-colors duration-200 hover:border-line-strong hover:text-ink"
            >
              <svg viewBox="0 0 16 16" className="h-[13px] w-[13px] shrink-0" aria-hidden focusable="false">
                <circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <span className="hidden lg:inline">Search</span>
              <kbd className="hidden border border-line px-1 py-px font-mono text-[0.5625rem] text-ink-ghost lg:inline">
                ⌘K
              </kbd>
            </button>
            <ThemeToggle />

            <Link
              href="/join"
              className="group hidden h-10 items-center gap-2.5 bg-acm-solid px-5 font-mono text-label uppercase text-white transition-colors duration-200 hover:bg-acm-deep sm:inline-flex"
            >
              Join ACM
              <span aria-hidden className="transition-transform duration-300 ease-out group-hover:translate-x-1">
                →
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className="flex h-10 w-10 items-center justify-center lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              <span className="relative block h-3 w-5">
                <motion.span
                  className="absolute left-0 block h-px w-full bg-ink"
                  animate={open ? { top: 5, rotate: 45 } : { top: 0, rotate: 0 }}
                  transition={{ duration: reduce ? 0 : 0.3, ease }}
                />
                <motion.span
                  className="absolute left-0 block h-px w-full bg-ink"
                  animate={open ? { top: 5, rotate: -45 } : { top: 11, rotate: 0 }}
                  transition={{ duration: reduce ? 0 : 0.3, ease }}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-[80] bg-void pt-[4.5rem] lg:hidden"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: reduce ? 0 : 0.28, ease }}
          >
            <div className="shell flex h-full flex-col justify-between overflow-y-auto pb-10 pt-6">
              <nav aria-label="Mobile">
                <ul>
                  {items.map((item, i) => (
                    <motion.li
                      key={item.id}
                      initial={reduce ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.04 * i, ease }}
                      className="border-b border-line"
                    >
                      <Link href={item.href} className="flex items-baseline justify-between py-5">
                        <span className="text-3xl font-semibold tracking-[-0.03em]">{item.label}</span>
                        <span className="meta text-acm-bright">{String(i + 1).padStart(2, "0")}</span>
                      </Link>
                    </motion.li>
                  ))}
                </ul>

                <ul className="mt-8 space-y-4">
                  {extra.map((item, i) => (
                    <motion.li
                      key={item.id}
                      initial={reduce ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.24 + 0.04 * i }}
                    >
                      <Link href={item.href} className="meta hover:text-ink">
                        {item.label} →
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              {/* Theme toggle lives in the header bar, visible without opening
                  the menu, so it is not repeated here. */}
              <Link
                href="/join"
                className="mt-10 flex h-14 items-center justify-center gap-2 bg-acm-solid font-mono text-label uppercase text-white"
              >
                Join ACM →
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
