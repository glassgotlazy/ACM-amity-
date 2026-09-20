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
        <span className="meta text-acm">{index ? `${index} /` : null}</span>
        <span className="meta">{eyebrow}</span>
      </Reveal>

      <div
        className={cn(
          "mt-7 flex flex-col gap-8",
          align === "wide" ? "lg:flex-row lg:items-end lg:justify-between" : "lg:flex-row lg:items-end lg:gap-16",
        )}
      >
        <Reveal delay={0.05} className={align === "wide" ? "lg:max-w-3xl" : "lg:w-[58%]"}>
          <h2 className="text-display-md text-balance">{title}</h2>
        </Reveal>

        {lede ? (
          <Reveal delay={0.1} className={align === "wide" ? "lg:max-w-sm" : "lg:w-[42%]"}>
            <div className="max-w-prose text-[0.975rem] leading-relaxed text-ink-muted text-pretty">{lede}</div>
          </Reveal>
        ) : null}

        {action ? (
          <Reveal delay={0.12} className="shrink-0">
            {action}
          </Reveal>
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
          <span className="meta text-acm">{index ? `${index} /` : null}</span>
          <span className="meta">{eyebrow}</span>
        </Reveal>

        <Reveal delay={0.05} className="mt-8 max-w-5xl">
          <h1 className="text-display-lg text-balance">{title}</h1>
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
