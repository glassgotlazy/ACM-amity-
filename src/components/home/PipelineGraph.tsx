"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The hero visual: the site’s actual thesis drawn as a graph.
 *
 * Left column holds real problem statements, the middle holds the projects
 * they feed, the right holds the outcome. Edges draw themselves on mount and
 * a pulse travels the highlighted path, so the picture reads as a pipeline
 * rather than as decoration. Hovering a node dims everything it does not
 * touch — the graph is the navigation, not an illustration of it.
 */

type Node = {
  id: string;
  label: string;
  sub: string;
  x: number;
  y: number;
  href: string;
  column: 0 | 1 | 2;
};

const VIEW_H = 74;

const NODES: Node[] = [
  { id: "p1", label: "Knowledge", sub: "Problem 01", x: 6, y: 12, href: "/problems/university-knowledge", column: 0 },
  { id: "p2", label: "Timetable", sub: "Problem 02", x: 6, y: 30, href: "/problems/timetable-conflict", column: 0 },
  { id: "p3", label: "Feedback", sub: "Problem 03", x: 6, y: 48, href: "/problems/student-feedback", column: 0 },
  { id: "p4", label: "Navigation", sub: "Problem 05", x: 6, y: 66, href: "/problems/campus-navigation", column: 0 },

  { id: "j1", label: "Admissions AI", sub: "In development", x: 50, y: 19, href: "/projects/admissions-ai", column: 1 },
  { id: "j2", label: "Scheduler", sub: "Proposed", x: 50, y: 41, href: "/problems/timetable-conflict", column: 1 },
  { id: "j3", label: "Feedback Intel", sub: "Exploring", x: 50, y: 62, href: "/projects/campus-feedback-intelligence", column: 1 },

  { id: "t1", label: "Your team", sub: "Open roles", x: 94, y: 30, href: "/teams", column: 2 },
  { id: "t2", label: "Contribution", sub: "On your record", x: 94, y: 52, href: "/profile", column: 2 },
];

const EDGES: [string, string, boolean][] = [
  ["p1", "j1", true],
  ["p2", "j2", false],
  ["p3", "j3", false],
  ["p4", "j2", false],
  ["j1", "t1", true],
  ["j2", "t1", false],
  ["j3", "t2", false],
  ["t1", "t2", true],
];

function byId(id: string) {
  return NODES.find((n) => n.id === id)!;
}

/** Orthogonal-ish routing: out, across, in. Reads as a circuit, not a spline. */
function path(a: Node, b: Node) {
  const midX = (a.x + b.x) / 2;
  return `M ${a.x} ${a.y} H ${midX - 3} Q ${midX} ${a.y} ${midX} ${a.y + (b.y > a.y ? 3 : -3)} V ${
    b.y - (b.y > a.y ? 3 : -3)
  } Q ${midX} ${b.y} ${midX + 3} ${b.y} H ${b.x}`;
}

export function PipelineGraph() {
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<string | null>(null);

  const connected = new Set<string>();
  if (hover) {
    connected.add(hover);
    EDGES.forEach(([from, to]) => {
      if (from === hover) connected.add(to);
      if (to === hover) connected.add(from);
    });
  }

  const dim = (id: string) => hover !== null && !connected.has(id);

  return (
    <div className="w-full">
      <div className="mb-5 flex items-center justify-between border-b border-line pb-3">
        <span className="meta">Problem → Project → People</span>
        <span className="flex items-center gap-2 font-mono text-micro uppercase text-ink-ghost">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-acm" />
          Live map
        </span>
      </div>

      <MobileChain />

      <div className="relative hidden md:block">
        <svg viewBox={`0 0 100 ${VIEW_H}`} className="w-full overflow-visible" role="img" aria-label="A map connecting campus problems to ACM projects, teams and recorded contributions">
        <defs>
          <marker id="arrow" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
            <path d="M0,0 L4,2 L0,4 Z" fill="currentColor" />
          </marker>
        </defs>

        {EDGES.map(([from, to, primary], i) => {
          const a = byId(from);
          const b = byId(to);
          const faded = dim(from) || dim(to);
          const lit = hover !== null && connected.has(from) && connected.has(to);
          return (
            <motion.path
              key={`${from}-${to}`}
              d={path(a, b)}
              fill="none"
              strokeWidth={lit ? 0.5 : 0.35}
              className={cn(
                "transition-[stroke,stroke-width,opacity] duration-300",
                lit || (primary && hover === null) ? "stroke-acm" : "stroke-ink/20",
              )}
              style={{ opacity: faded ? 0.15 : 1 }}
              initial={reduce ? undefined : { pathLength: 0 }}
              animate={reduce ? undefined : { pathLength: 1 }}
              transition={{ duration: 1.1, delay: 0.5 + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
            />
          );
        })}

        {/* A single packet travelling the primary route, so the graph has a
            direction. Plain SMIL keeps it off the main thread entirely. */}
        {!reduce
          ? [
              path(byId("p1"), byId("j1")),
              path(byId("j1"), byId("t1")),
              path(byId("t1"), byId("t2")),
            ].map((d, i) => (
              <circle key={`packet-${i}`} r="0.7" opacity="0" className="fill-acm-bright">
                <animateMotion dur="1.5s" begin={`${2.2 + i * 1.4}s`} repeatCount="indefinite" path={d} />
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  keyTimes="0;0.12;0.82;1"
                  dur="1.5s"
                  begin={`${2.2 + i * 1.4}s`}
                  repeatCount="indefinite"
                />
              </circle>
            ))
          : null}

        {NODES.map((node, i) => {
          const faded = dim(node.id);
          const isHover = hover === node.id;
          return (
            <motion.g
              key={node.id}
              initial={reduce ? undefined : { opacity: 0, scale: 0.6 }}
              animate={reduce ? undefined : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.25 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              style={{ opacity: faded ? 0.25 : 1, transformOrigin: `${node.x}px ${node.y}px` }}
              className="transition-opacity duration-300"
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={isHover ? 2.1 : 1.5}
                className={cn(
                  "transition-all duration-300",
                  node.column === 0 && "fill-void stroke-acm",
                  node.column === 1 && "fill-acm stroke-acm",
                  node.column === 2 && "fill-void stroke-ink/45",
                )}
                strokeWidth="0.5"
              />
              {isHover ? (
                <circle cx={node.x} cy={node.y} r="3.6" className="fill-none stroke-acm/40" strokeWidth="0.3" />
              ) : null}
            </motion.g>
          );
        })}
      </svg>

      {/* Labels live in the DOM rather than the SVG so they stay real links.
          Positioning sits on a plain wrapper because framer-motion writes the
          `x` animation to `transform` and would otherwise clobber the
          centring translate. */}
      <div className="pointer-events-none absolute inset-0">
        {NODES.map((node, i) => (
          <div
            key={node.id}
            className={cn("absolute", node.column === 2 ? "text-right" : "")}
            style={
              node.column === 2
                ? { right: `${100 - node.x}%`, bottom: `${100 - (node.y / VIEW_H) * 100}%`, marginRight: "-0.4rem", marginBottom: "0.75rem" }
                : { left: `${node.x}%`, bottom: `${100 - (node.y / VIEW_H) * 100}%`, marginLeft: "-0.4rem", marginBottom: "0.75rem" }
            }
          >
            <motion.div
              initial={reduce ? undefined : { opacity: 0, y: 6 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 + i * 0.06 }}
            >
              <Link
                href={node.href}
                onMouseEnter={() => setHover(node.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(node.id)}
                onBlur={() => setHover(null)}
                className={cn(
                  "pointer-events-auto block whitespace-nowrap transition-opacity duration-300",
                  dim(node.id) ? "opacity-25" : "opacity-100",
                )}
              >
                <span
                  className={cn(
                    "block text-[0.8125rem] font-medium leading-tight tracking-[-0.01em] transition-colors duration-200",
                    hover === node.id ? "text-acm-bright" : "text-ink",
                  )}
                >
                  {node.label}
                </span>
                <span className="block font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-ghost">
                  {node.sub}
                </span>
              </Link>
            </motion.div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Phone rendering of the same pipeline: one column, grouped by stage. It keeps
 * every destination reachable without trying to draw a three-column graph in
 * 350 pixels.
 */
function MobileChain() {
  const reduce = useReducedMotion();
  const stages = [
    { label: "Problems", nodes: NODES.filter((n) => n.column === 0) },
    { label: "Projects", nodes: NODES.filter((n) => n.column === 1) },
    { label: "People", nodes: NODES.filter((n) => n.column === 2) },
  ];

  return (
    <div className="md:hidden">
      {stages.map((stage, si) => (
        <div key={stage.label} className="relative border-l border-line pb-7 pl-6 last:pb-0">
          <span
            aria-hidden
            className={cn(
              "absolute -left-[4.5px] top-1.5 block h-2 w-2 rounded-full",
              si === 1 ? "bg-acm" : "border border-acm bg-void",
            )}
          />
          <span className="meta text-ink-ghost">{stage.label}</span>
          <ul className="mt-3 space-y-2.5">
            {stage.nodes.map((node, i) => (
              <motion.li
                key={node.id}
                initial={reduce ? undefined : { opacity: 0, x: -6 }}
                animate={reduce ? undefined : { opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + si * 0.1 + i * 0.05 }}
              >
                <Link href={node.href} className="group flex items-baseline justify-between gap-4">
                  <span className="text-[0.9375rem] font-medium tracking-[-0.01em] transition-colors duration-200 group-hover:text-acm-bright">
                    {node.label}
                  </span>
                  <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-ghost">
                    {node.sub}
                  </span>
                </Link>
              </motion.li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
