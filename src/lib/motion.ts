import type { Transition, Variants } from "framer-motion";

/**
 * A single motion vocabulary for the whole site. Everything is short,
 * spring-free unless it needs weight, and travels a small distance —
 * movement should register without asking for attention.
 */

export const ease = [0.22, 1, 0.36, 1] as const;

export const spring: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 38,
  mass: 0.9,
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease } },
};

export const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

export const riseSmall: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
};

export const slideIn: Variants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease } },
};

/** Parent container that staggers its children’s `rise`. */
export function stagger(delayChildren = 0, staggerChildren = 0.06): Variants {
  return {
    hidden: {},
    show: { transition: { delayChildren, staggerChildren } },
  };
}

/** Clip-path wipe used for headline lines. */
export const lineReveal: Variants = {
  hidden: { y: "108%" },
  show: { y: "0%", transition: { duration: 0.85, ease } },
};

/**
 * Shared scroll-reveal viewport. `amount` is deliberately low and the root box
 * is extended past the bottom edge, so content commits slightly before it is
 * on screen rather than visibly popping in at the fold.
 */
export const viewportOnce = { once: true, amount: 0.15, margin: "0px 0px -8% 0px" } as const;
