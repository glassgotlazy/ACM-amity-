"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "quiet";
type Size = "sm" | "md" | "lg";

const base =
  "group relative inline-flex select-none items-center justify-center gap-2 rounded-lg font-medium tracking-[-0.005em] " +
  "transition-[color,background-color,border-color,transform] duration-150 ease-out active:scale-[0.98] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acm " +
  "disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary: "bg-acm-solid text-white hover:bg-acm-deep",
  outline: "border border-line-strong bg-surface/40 text-ink hover:border-ink-faint hover:bg-surface",
  ghost: "text-ink-muted hover:bg-surface hover:text-ink",
  quiet: "bg-surface-high text-ink hover:bg-surface-raised",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-12 px-6 text-base",
};

type Props = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  href?: string;
  arrow?: boolean;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  // `arrow` is accepted for existing callers but no longer drawn: a label that
  // says what happens needs no arrow after it.
  { variant = "primary", size = "md", className, children, href, arrow: _arrow = false, ...rest },
  ref,
) {
  const classes = cn(base, variants[variant], sizes[size], className);
  const content = (
    <>
      <span className="relative z-10">{children}</span>
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
