"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KIND_LABEL, buildIndex, search, suggestions, type SearchEntry, type SearchProject } from "@/lib/search";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Any component can open the palette by dispatching this on `window`. */
export const OPEN_SEARCH_EVENT = "acm:search";

export function openSearch() {
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
}

/**
 * ⌘K / Ctrl-K search over problems, projects, ideas, teams and research.
 * Mounted once in the root layout; the navbar buttons only fire an event.
 *
 * Search runs synchronously in memory on every keystroke — the corpus is a
 * few dozen entries, so debouncing would add latency for nothing.
 */
export function CommandPalette({ projects }: { projects: SearchProject[] }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const index = useMemo(() => buildIndex(projects), [projects]);
  const results = useMemo(() => (query.trim() ? search(index, query) : suggestions(index)), [index, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  const go = useCallback(
    (entry: SearchEntry) => {
      close();
      router.push(entry.href);
    },
    [close, router],
  );

  // Global shortcut + programmatic open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpen);
    };
  }, []);

  // Focus, scroll lock, and Escape while open.
  useEffect(() => {
    if (!open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  // Clamp the cursor when results shrink; keep the active row in view.
  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, results.length - 1)));
  }, [results.length]);
  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % Math.max(1, results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active]);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[110] flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]">
          <motion.button
            type="button"
            aria-label="Close search"
            onClick={close}
            className="absolute inset-0 cursor-default bg-scrim backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search the site"
            className="relative w-full max-w-2xl border border-line-strong bg-surface"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.99 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.99 }}
            transition={{ duration: reduce ? 0 : 0.22, ease }}
          >
            <div className="flex items-center gap-4 border-b border-line px-5">
              <span aria-hidden className="meta text-acm-bright">
                /
              </span>
              <input
                ref={inputRef}
                type="search"
                role="combobox"
                aria-expanded="true"
                aria-controls="search-results"
                aria-activedescendant={results[active] ? `sr-${results[active].id}` : undefined}
                aria-autocomplete="list"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onInputKey}
                placeholder="Search problems, projects, ideas, teams…"
                className="h-14 w-full bg-transparent text-[0.9375rem] text-ink outline-none placeholder:text-ink-ghost [&::-webkit-search-cancel-button]:appearance-none"
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className="hidden shrink-0 border border-line px-1.5 py-0.5 font-mono text-micro uppercase text-ink-ghost sm:block">
                Esc
              </kbd>
            </div>

            <ul
              id="search-results"
              ref={listRef}
              role="listbox"
              className="max-h-[52vh] overflow-y-auto py-2"
            >
              {results.length === 0 ? (
                <li className="px-5 py-10 text-center">
                  <p className="font-mono text-label uppercase text-ink-faint">Nothing matches “{query}”</p>
                  <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">
                    Try a technology, a domain like “quantum”, or a role like “frontend”.
                  </p>
                </li>
              ) : (
                results.map((entry, i) => (
                  <li
                    key={entry.id}
                    id={`sr-${entry.id}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(entry)}
                    className={cn(
                      "flex cursor-pointer items-baseline gap-4 px-5 py-3 transition-colors duration-100",
                      i === active ? "bg-surface-high" : "hover:bg-surface-raised",
                    )}
                  >
                    <span className="w-16 shrink-0 font-mono text-micro uppercase text-ink-ghost">
                      {KIND_LABEL[entry.kind]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-[0.9375rem] font-medium", i === active && "text-acm-bright")}>
                        {entry.title}
                      </span>
                      <span className="block truncate text-sm text-ink-muted">{entry.subtitle}</span>
                    </span>
                    <span aria-hidden className={cn("shrink-0 font-mono text-micro text-ink-ghost", i === active && "text-acm-bright")}>
                      ↵
                    </span>
                  </li>
                ))
              )}
            </ul>

            <div className="flex items-center justify-between border-t border-line px-5 py-2.5 font-mono text-micro uppercase text-ink-ghost">
              <span>{query.trim() ? `${results.length} result${results.length === 1 ? "" : "s"}` : "Suggestions"}</span>
              <span className="hidden sm:block">↑↓ navigate · ↵ open</span>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
