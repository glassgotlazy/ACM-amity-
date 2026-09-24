import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * A text link that says where it goes. Forward links carry no arrow — the
 * label does the work; back links keep a small ← because direction is the
 * information there.
 */
export function ArrowLink({
  href,
  children,
  className,
  tone = "default",
  direction = "forward",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "accent";
  direction?: "forward" | "back";
}) {
  const back = direction === "back";
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-1.5 text-[0.9375rem] font-medium underline decoration-transparent decoration-1 underline-offset-[5px] transition-[color,text-decoration-color] duration-150",
        tone === "accent" ? "text-acm-bright hover:decoration-current" : "text-ink-muted hover:text-ink hover:decoration-line-strong",
        className,
      )}
    >
      {back ? (
        <span aria-hidden className="transition-transform duration-200 ease-out group-hover:-translate-x-0.5">
          ←
        </span>
      ) : null}
      {children}
    </Link>
  );
}
