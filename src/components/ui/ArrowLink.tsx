import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Directional link. The arrow turns from → to ↗ and the label underlines from
 * the left — the same gesture as Button, at text scale.
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
  /** `back` puts the arrow first and points it the other way. */
  direction?: "forward" | "back";
}) {
  const back = direction === "back";

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 font-mono text-label uppercase transition-colors duration-200",
        tone === "accent" ? "text-acm-bright hover:text-ink" : "text-ink-muted hover:text-ink",
        className,
      )}
    >
      {back ? (
        <span aria-hidden className="block transition-transform duration-300 ease-out group-hover:-translate-x-1">
          ←
        </span>
      ) : null}

      <span className="relative">
        {children}
        <span className="absolute -bottom-1 left-0 h-px w-0 bg-current transition-[width] duration-300 ease-out group-hover:w-full" />
      </span>

      {!back ? (
        <span aria-hidden className="relative block h-3 w-3 overflow-hidden">
          <span className="absolute inset-0 grid place-items-center transition-transform duration-300 ease-out group-hover:-translate-y-3 group-hover:translate-x-3">
            →
          </span>
          <span className="absolute inset-0 grid place-items-center translate-y-3 -translate-x-3 transition-transform duration-300 ease-out group-hover:translate-y-0 group-hover:translate-x-0">
            ↗
          </span>
        </span>
      ) : null}
    </Link>
  );
}
