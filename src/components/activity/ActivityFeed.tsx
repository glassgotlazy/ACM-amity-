"use client";

import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { activity, ACTIVITY_KINDS, type ActivityKind } from "@/data/activity";
import { FilterBar } from "@/components/ui/FilterBar";

const KIND_TONE: Record<ActivityKind, string> = {
  build: "text-signal-live",
  research: "text-signal-idea",
  team: "text-ink-muted",
  problem: "text-acm-bright",
  role: "text-signal-work",
  review: "text-ink-muted",
};

const FILTERS = ["All", ...Object.values(ACTIVITY_KINDS)] as const;

export function ActivityFeed() {
  const reduce = useReducedMotion();
  const [filter, setFilter] = useState<string>("All");

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: activity.length };
    for (const [kind, label] of Object.entries(ACTIVITY_KINDS)) {
      map[label] = activity.filter((a) => a.kind === kind).length;
    }
    return map;
  }, []);

  const shown = useMemo(
    () => (filter === "All" ? activity : activity.filter((a) => ACTIVITY_KINDS[a.kind] === filter)),
    [filter],
  );

  // Group by day so the feed reads as a log rather than an undifferentiated list.
  const groups = useMemo(() => {
    const map = new Map<string, typeof activity>();
    for (const item of shown) {
      map.set(item.day, [...(map.get(item.day) ?? []), item]);
    }
    return [...map.entries()];
  }, [shown]);

  return (
    <section className="shell py-14" aria-labelledby="activity-list">
      <h2 id="activity-list" className="sr-only">
        Activity log
      </h2>

      <div className="sticky top-[4.5rem] z-40 -mx-gutter border-b border-line bg-void/90 px-gutter py-4 backdrop-blur-xl">
        <FilterBar
          label="Filter activity by type"
          options={FILTERS}
          value={filter}
          onChange={setFilter}
          counts={counts}
          layoutId="activity-filter"
        />
      </div>

      <LayoutGroup>
        <div className="mt-12 space-y-14">
          {groups.map(([day, items]) => (
            <motion.div key={day} layout={!reduce}>
              <div className="flex items-center gap-5">
                <span className="meta text-ink-faint">{day}</span>
                <span className="h-px flex-1 bg-line" aria-hidden />
                <span className="font-mono text-micro tnum uppercase text-ink-ghost">{items.length}</span>
              </div>

              <ol className="mt-2">
                <AnimatePresence mode="popLayout" initial={false}>
                  {items.map((item, i) => (
                    <motion.li
                      key={item.id}
                      layout={!reduce}
                      initial={reduce ? undefined : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? undefined : { opacity: 0 }}
                      transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.2) }}
                      className="group grid gap-3 border-b border-line py-6 lg:grid-cols-[7rem_1fr_9rem] lg:items-baseline lg:gap-8"
                    >
                      <span className={`meta ${KIND_TONE[item.kind]}`}>{ACTIVITY_KINDS[item.kind]}</span>

                      <div>
                        <p className="text-[0.9375rem] leading-relaxed text-ink text-pretty">{item.text}</p>
                        <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1">
                          <span className="font-mono text-micro uppercase text-ink-ghost">{item.actor}</span>
                          {item.target ? (
                            <Link
                              href={item.target.href}
                              className="font-mono text-micro uppercase text-ink-faint transition-colors duration-200 hover:text-acm-bright"
                            >
                              {item.target.label} →
                            </Link>
                          ) : null}
                        </div>
                      </div>

                      <span className="font-mono text-micro uppercase text-ink-ghost lg:text-right">{item.when}</span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ol>
            </motion.div>
          ))}
        </div>
      </LayoutGroup>

      {shown.length === 0 ? (
        <p className="border border-line px-8 py-20 text-center font-mono text-label uppercase text-ink-faint">
          Nothing of that kind in the window shown.
        </p>
      ) : null}
    </section>
  );
}
