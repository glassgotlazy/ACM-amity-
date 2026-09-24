"use client";

import Link from "next/link";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import type { Problem } from "@/lib/cms/content-types";
import type { Project } from "@/lib/cms/types";
import { DifficultyMeter, StatusPill } from "@/components/ui/Badges";
import { cn } from "@/lib/utils";

/**
 * The hero centrepiece: real problems from the Problem Lab, the project each
 * one could become, and the roles that project needs. It steps through the
 * problems on its own until someone picks one, then stays where they put it.
 * The connecting lines are measured from the DOM so they always meet the
 * elements they join, whatever the text wraps to.
 */

const CYCLE_MS = 5200;
const EASE = [0.23, 1, 0.32, 1] as const;

type Point = { x: number; y: number };
type Wires = { inbound: Point[] | null; outbound: Point[][] };

function shortTitle(title: string) {
  return title.replace(/^The /, "").replace(/ Problem$/, "");
}

/** Offset of `el` inside `root`, ignoring transforms so animations don't skew it. */
function offsetIn(el: HTMLElement, root: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

function curve([a, b]: Point[]) {
  const mid = (a.x + b.x) / 2;
  return `M ${a.x} ${a.y} C ${mid} ${a.y}, ${mid} ${b.y}, ${b.x} ${b.y}`;
}

export function ProblemExplorer({ problems, projects }: { problems: Problem[]; projects: Project[] }) {
  const reduce = useReducedMotion();
  const items = problems.slice(0, 5);
  const [active, setActive] = useState(0);
  const [picked, setPicked] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.4 });
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const roleRefs = useRef(new Map<string, HTMLSpanElement>());
  const [wires, setWires] = useState<Wires>({ inbound: null, outbound: [] });

  const problem = items[active];
  const project = problem
    ? projects.find((p) => p.problemSlug === problem.slug || (problem.potentialProject.slug && p.slug === problem.potentialProject.slug))
    : undefined;
  const roles = useMemo(() => (problem ? problem.openRoles.slice(0, 5) : []), [problem]);

  const cycling = !reduce && !picked && !paused && !hovering && inView && items.length > 1;

  useEffect(() => {
    if (!cycling) return;
    const t = window.setTimeout(() => setActive((i) => (i + 1) % items.length), CYCLE_MS);
    return () => window.clearTimeout(t);
  }, [cycling, active, items.length]);

  const measure = useCallback(() => {
    const root = rootRef.current;
    const dot = dotRefs.current[active];
    const card = cardRef.current;
    // Wires only make sense in the three-column layout.
    if (!root || !dot || !card || window.matchMedia("(max-width: 767px)").matches) {
      setWires({ inbound: null, outbound: [] });
      return;
    }
    const d = offsetIn(dot, root);
    const c = offsetIn(card, root);
    const cardIn = { x: c.x, y: c.y + 44 };
    const cardOut = { x: c.x + c.w, y: c.y + 44 };
    const outbound = roles
      .map((role) => roleRefs.current.get(`${problem?.slug}-${role}`))
      .filter((el): el is HTMLSpanElement => Boolean(el))
      .map((el) => {
        const r = offsetIn(el, root);
        return [cardOut, { x: r.x, y: r.y + r.h / 2 }];
      });
    setWires({ inbound: [{ x: d.x + d.w, y: d.y + d.h / 2 }, cardIn], outbound });
  }, [active, problem?.slug, roles]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(root);
    return () => ro.disconnect();
  }, [measure]);

  if (!problem) return null;

  function pick(i: number) {
    setPicked(true);
    setActive(i);
  }

  function onKey(e: React.KeyboardEvent, i: number) {
    const next = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!next) return;
    e.preventDefault();
    const j = (i + next + items.length) % items.length;
    pick(j);
    (e.currentTarget.parentElement?.parentElement?.children[j]?.querySelector("button") as HTMLButtonElement | null)?.focus();
  }

  const swap = reduce
    ? { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE } },
        exit: { opacity: 0, y: -6, transition: { duration: 0.16, ease: [0.32, 0, 0.67, 0] as const } },
      };

  return (
    <div
      className="rounded-2xl border border-line bg-surface/60 p-5 shadow-[0_40px_90px_-50px_rgba(0,0,0,0.55)] sm:p-7 lg:p-9"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.9375rem] font-medium text-ink">Pick a problem and follow where it leads</p>
        {!reduce && items.length > 1 ? (
          <button
            type="button"
            onClick={() => (picked ? setPicked(false) : setPaused((p) => !p))}
            className="inline-flex h-8 items-center gap-2 rounded-lg px-2.5 text-sm text-ink-faint transition-colors duration-150 hover:bg-surface-high hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-acm"
          >
            <span className="relative h-1 w-10 overflow-hidden rounded-full bg-line-strong" aria-hidden>
              {cycling ? (
                <motion.span
                  key={active}
                  className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-acm"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: CYCLE_MS / 1000, ease: "linear" }}
                />
              ) : null}
            </span>
            {picked || paused ? "Play tour" : "Pause tour"}
          </button>
        ) : null}
      </div>

      <div ref={rootRef} className="relative mt-7 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,0.8fr)] md:gap-12 lg:gap-16">
        {/* Wires sit behind everything and never take clicks. */}
        <svg className="pointer-events-none absolute inset-0 z-10 hidden h-full w-full overflow-visible md:block" aria-hidden>
          {wires.inbound ? (
            <motion.path
              key={`in-${active}`}
              d={curve(wires.inbound)}
              fill="none"
              strokeWidth={1.5}
              className="stroke-acm"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.45, ease: EASE }}
            />
          ) : null}
          {wires.outbound.map((pts, i) => (
            <motion.path
              key={`out-${active}-${i}`}
              d={curve(pts)}
              fill="none"
              strokeWidth={1.25}
              className="stroke-gold/60"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.05, ease: EASE }}
            />
          ))}
          {!reduce && wires.inbound ? (
            <circle key={`pkt-${active}`} r="3" className="fill-acm-bright" opacity="0">
              <animateMotion dur="1.6s" begin="0.5s" repeatCount="indefinite" path={curve(wires.inbound)} />
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.8;1" dur="1.6s" begin="0.5s" repeatCount="indefinite" />
            </circle>
          ) : null}
        </svg>

        {/* Problems */}
        <div className="relative min-w-0">
          <p className="text-sm text-ink-faint">Problem</p>
          <ul className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 md:flex-col md:gap-1 md:overflow-visible md:pb-0" aria-label="Problems">
            {items.map((p, i) => {
              const on = i === active;
              return (
                <li key={p.slug} className="shrink-0">
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => pick(i)}
                    onKeyDown={(e) => onKey(e, i)}
                    className={cn(
                      "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acm",
                      on ? "text-ink" : "text-ink-muted hover:bg-surface-high/60 hover:text-ink",
                    )}
                  >
                    {on ? (
                      <motion.span
                        layoutId="explorer-active"
                        className="absolute inset-0 rounded-lg bg-surface-high"
                        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 42, mass: 0.8 }}
                      />
                    ) : null}
                    <span className="relative min-w-0 flex-1">
                      <span className="block whitespace-nowrap text-[0.9375rem] font-medium md:whitespace-normal">{shortTitle(p.title)}</span>
                      <span className="hidden text-xs text-ink-faint md:block">{p.category}</span>
                    </span>
                    <span
                      ref={(el) => {
                        dotRefs.current[i] = el;
                      }}
                      aria-hidden
                      className={cn(
                        "relative hidden h-2.5 w-2.5 shrink-0 rounded-full border-2 transition-colors duration-200 md:block",
                        on ? "border-acm bg-acm" : "border-line-strong bg-transparent",
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* The project it could become */}
        <div className="relative min-w-0">
          <p className="text-sm text-ink-faint">Could become</p>
          <div ref={cardRef} className="relative mt-3 rounded-xl border border-line bg-void p-5 sm:p-6" aria-live={picked ? "polite" : "off"}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={problem.slug} {...swap}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {project ? (
                    <StatusPill status={project.status} />
                  ) : (
                    <span className="text-xs text-ink-faint">No team yet</span>
                  )}
                  <DifficultyMeter level={problem.level} />
                </div>
                <h2 className="mt-4 text-xl font-semibold tracking-[-0.02em] sm:text-2xl">{problem.potentialProject.name}</h2>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-muted text-pretty">{problem.question}</p>
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
                  <Link href={`/problems/${problem.slug}`} className="text-acm-bright underline-offset-4 hover:underline">
                    Open the problem
                  </Link>
                  {project ? (
                    <Link href={`/projects/${project.slug}`} className="text-ink-muted underline-offset-4 hover:text-ink hover:underline">
                      See the project
                    </Link>
                  ) : null}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Who it needs */}
        <div className="relative min-w-0">
          <p className="text-sm text-ink-faint">Needs</p>
          <ul className="mt-3 flex flex-wrap gap-2 md:flex-col md:items-start md:gap-2.5" aria-label={`Open roles for ${shortTitle(problem.title)}`}>
            <AnimatePresence mode="popLayout" initial={false}>
              {roles.map((role, i) => (
                <motion.li
                  key={`${problem.slug}-${role}`}
                  initial={reduce ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0, transition: { duration: 0.3, delay: reduce ? 0 : 0.35 + i * 0.05, ease: EASE } }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  className="rounded-full bg-gold/10 text-sm font-medium text-gold"
                >
                  {/* AnimatePresence's popLayout takes the li's own ref, so the
                      wire anchor lives on this inner span. */}
                  <span
                    ref={(el) => {
                      const k = `${problem.slug}-${role}`;
                      if (el) roleRefs.current.set(k, el);
                      else roleRefs.current.delete(k);
                    }}
                    className="block px-3 py-1"
                  >
                    {role}
                  </span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <Link
            href="/join"
            className="mt-5 inline-block text-sm font-medium text-ink-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Take one of these roles
          </Link>
        </div>
      </div>
    </div>
  );
}
