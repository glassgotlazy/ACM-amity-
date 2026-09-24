import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

/**
 * The standard content band used by every detail page: the heading in a
 * narrow left rail, content in the wide right column. The consistent rail is
 * what makes long documents scannable. (`index` is accepted but not shown.)
 */
export function Section({
  title,
  lede,
  children,
  className,
  id,
}: {
  index?: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("border-b border-line", className)}>
      <div className="shell grid gap-8 py-14 lg:grid-cols-[14rem_1fr] lg:gap-16 lg:py-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <h2 className="text-lg font-semibold tracking-[-0.015em] text-ink">{title}</h2>
            {lede ? <p className="mt-2 text-sm leading-relaxed text-ink-faint">{lede}</p> : null}
          </Reveal>
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}

export function Prose({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Reveal
      className={cn(
        "max-w-prose space-y-6 text-[1.0625rem] leading-relaxed text-ink-muted text-pretty [&_strong]:font-medium [&_strong]:text-ink",
        className,
      )}
    >
      {children}
    </Reveal>
  );
}
