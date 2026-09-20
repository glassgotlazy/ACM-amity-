"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "quiet";
type Size = "sm" | "md" | "lg";

const base =
  "group relative inline-flex select-none items-center justify-center gap-2.5 overflow-hidden font-mono text-label uppercase " +
  "transition-[color,background-color,border-color,transform] duration-200 ease-out active:translate-y-px " +
  "disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary: "bg-acm-solid text-white hover:bg-acm-deep",
  outline: "border border-line-strong text-ink hover:border-acm hover:text-acm-bright",
  ghost: "border border-transparent text-ink-muted hover:text-ink",
  quiet: "bg-surface-raised text-ink hover:bg-surface-high",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4",
  md: "h-11 px-6",
  lg: "h-14 px-8 text-[0.75rem]",
};

type Props = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  href?: string;
  arrow?: boolean;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">;

/**
 * The arrow rotates from → to ↗ on hover. It is the one flourish shared by
 * every call to action on the site, which is what makes it read as a system
 * rather than as decoration.
 */
function Arrow() {
  return (
    <span aria-hidden className="relative block h-3 w-3 overflow-hidden">
      <span className="absolute inset-0 grid place-items-center transition-transform duration-300 ease-out group-hover:-translate-y-3 group-hover:translate-x-3">
        →
      </span>
      <span className="absolute inset-0 grid place-items-center translate-y-3 -translate-x-3 transition-transform duration-300 ease-out group-hover:translate-y-0 group-hover:translate-x-0">
        ↗
      </span>
    </span>
  );
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", className, children, href, arrow = false, ...rest },
  ref,
) {
  const classes = cn(base, variants[variant], sizes[size], className);
  const content = (
    <>
      <span className="relative z-10">{children}</span>
      {arrow ? <Arrow /> : null}
    </>
  );

  if (href) {
    const external = href.startsWith("http") || href.startsWith("mailto:");
    if (external) {
      return (
        <a className={classes} href={href} rel="noreferrer noopener" target="_blank">
          {content}
        </a>
      );
    }
    return (
      <Link className={classes} href={href}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} ref={ref} {...rest}>
      {content}
    </button>
  );
});
