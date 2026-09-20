import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";
import type { ReactNode } from "react";

type Props = {
  /** "01", "02" — the editorial numbering that runs through the site. */
  index?: string;
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  action?: ReactNode;
  align?: "left" | "wide";
  className?: string;
};

export function SectionHeading({ index, eyebrow, title, lede, action, align = "left", className }: Props) {
  return (
    <div className={cn("rule-b pb-10", className)}>
      <Reveal className="flex items-baseline gap-4">
        <span className="meta text-acm-bright">{index ? `${index} /` : null}</span>
        <span className="meta">{eyebrow}</span>
      </Reveal>

      {/*
        Title left, supporting column right. The lede and the action share that
        right column rather than competing for the same row — three items in one
        justify-between row squeezed the headline into an awkward wrap.
      */}
      <div className="mt-7 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
        <Reveal delay={0.05} className={align === "wide" ? "lg:max-w-4xl" : "lg:max-w-2xl"}>
          <h2 className="text-display-md text-balance">{title}</h2>
        </Reveal>

        {lede || action ? (
          <div className="flex shrink-0 flex-col gap-6 lg:max-w-xs lg:items-start">
            {lede ? (
              <Reveal delay={0.1}>
                <div className="max-w-prose text-[0.975rem] leading-relaxed text-ink-muted text-pretty">{lede}</div>
              </Reveal>
            ) : null}
            {action ? <Reveal delay={0.14}>{action}</Reveal> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Large page-level header used at the top of every route. */
export function PageHeader({
  index,
  eyebrow,
  title,
  lede,
  meta,
  children,
}: {
  index?: string;
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  meta?: { label: string; value: string }[];
  children?: ReactNode;
}) {
  return (
    <header className="rule-b relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-field grid-mask opacity-60" aria-hidden />
      <div className="shell relative pb-16 pt-32 sm:pt-40">
        <Reveal className="flex items-baseline gap-4">
          <span className="meta text-acm-bright">{index ? `${index} /` : null}</span>
          <span className="meta">{eyebrow}</span>
        </Reveal>

        <Reveal delay={0.05} className="mt-8 max-w-5xl">
          <h1 className="text-display-page text-balance">{title}</h1>
        </Reveal>

        {lede ? (
          <Reveal delay={0.1} className="mt-8 max-w-2xl">
            <p className="text-lg leading-relaxed text-ink-muted text-pretty">{lede}</p>
          </Reveal>
        ) : null}

        {children ? (
          <Reveal delay={0.14} className="mt-10">
            {children}
          </Reveal>
        ) : null}

        {meta?.length ? (
          <Reveal delay={0.18} className="mt-14 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
            {meta.map((m) => (
              <div key={m.label} className="bg-void px-5 py-5">
                <div className="meta">{m.label}</div>
                <div className="mt-2 text-lg tnum text-ink">{m.value}</div>
              </div>
            ))}
          </Reveal>
        ) : null}
      </div>
    </header>
  );
}
