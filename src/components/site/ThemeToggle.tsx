"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const THEME_KEY = "acm-theme";

/**
 * Theme switch.
 *
 * The rendered glyph is chosen by CSS off `:root[data-theme]` rather than by
 * React state, so the button’s markup is identical on the server and the
 * client. That avoids both a hydration mismatch and the flash of a wrong icon
 * on first paint, which a state-driven version cannot.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const toggle = useCallback(() => {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";

    // Colours animate only while switching; page loads stay instant.
    root.setAttribute("data-theme-switching", "");
    window.setTimeout(() => root.removeAttribute("data-theme-switching"), 260);

    if (next === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");

    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private mode or blocked storage: the choice simply will not persist.
    }

    // Keep the browser chrome in step with the page.
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", next === "light" ? "#FAFAF8" : "#08090B");
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch between light and dark theme"
      title="Switch theme"
      // Inert until hydrated, so it can never look interactive before it works.
      disabled={!mounted}
      className={cn(
        "group inline-flex h-10 items-center gap-2.5 border border-line px-3.5 font-mono text-label uppercase text-ink-faint",
        "transition-colors duration-200 hover:border-line-strong hover:text-ink disabled:opacity-60",
        className,
      )}
    >
      <svg viewBox="0 0 16 16" className="h-[13px] w-[13px] shrink-0" aria-hidden focusable="false">
        <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.3" />
        {/* Filled half flips with the theme — a contrast mark, not a sun or moon. */}
        <path d="M8 1.75 A6.25 6.25 0 0 1 8 14.25 Z" fill="currentColor" className="theme-glyph-dark" />
        <path d="M8 1.75 A6.25 6.25 0 0 0 8 14.25 Z" fill="currentColor" className="theme-glyph-light" />
      </svg>
      {/* Label names the theme you will get, matching the aria-label's intent.
          Both are rendered and CSS picks one, so server and client markup match. */}
      <span className="theme-label-dark">Light</span>
      <span className="theme-label-light">Dark</span>
    </button>
  );
}
