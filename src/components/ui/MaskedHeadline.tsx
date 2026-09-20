"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Props = {
  lines: (string | { text: string; className?: string })[];
  className?: string;
  lineClassName?: string;
  id?: string;
  /** `view` waits for the heading to scroll in; `mount` plays immediately. */
  trigger?: "view" | "mount";
  delay?: number;
  as?: "h1" | "h2" | "h3";
};

/**
 * Headline whose lines wipe up from behind a clipping mask.
 *
 * The intersection observer has to live on the *outer* element, not on the
 * moving line. A line starting at y:110% is translated clear of its
 * overflow-hidden parent, and IntersectionObserver clips against ancestor
 * overflow — so an observer on the line itself measures zero visible area,
 * never fires, and the text stays permanently invisible. Observing the
 * wrapper and driving the lines as variant children avoids that deadlock.
 */
export function MaskedHeadline({
  lines,
  className,
  lineClassName,
  id,
  trigger = "view",
  delay = 0,
  as: Tag = "h2",
}: Props) {
  const reduce = useReducedMotion();
  const MotionTag = motion[Tag];

  const normalised = lines.map((line) => (typeof line === "string" ? { text: line, className: undefined } : line));

  if (reduce) {
    return (
      <Tag id={id} className={className}>
        {normalised.map((line) => (
          <span key={line.text} className={cn("block", lineClassName, line.className)}>
            {line.text}
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <MotionTag
      id={id}
      className={className}
      initial="hidden"
      {...(trigger === "view"
        ? { whileInView: "show", viewport: { once: true, amount: 0.35 } }
        : { animate: "show" })}
      variants={{ hidden: {}, show: { transition: { delayChildren: delay, staggerChildren: 0.075 } } }}
    >
      {normalised.map((line) => (
        <span key={line.text} className="block overflow-hidden pb-[0.06em]">
          <motion.span
            className={cn("block", lineClassName, line.className)}
            variants={{
              hidden: { y: "110%" },
              show: { y: "0%", transition: { duration: 0.85, ease } },
            }}
          >
            {line.text}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}
