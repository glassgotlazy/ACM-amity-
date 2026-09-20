import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

/**
 * The standard content band used by every detail page: a numbered label in a
 * narrow left rail, content in the wide right column. The consistent rail is
 * what makes long documents scannable.
 */
export function Section({
  index,
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
      <div className="shell grid gap-10 py-16 lg:grid-cols-[14rem_1fr] lg:gap-16 lg:py-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <div className="flex items-baseline gap-3">
              {index ? <span className="meta tnum text-acm">{index}</span> : null}
              <h2 className="meta text-ink">{title}</h2>
            </div>
            {lede ? <p className="mt-5 text-sm leading-relaxed text-ink-faint">{lede}</p> : null}
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
