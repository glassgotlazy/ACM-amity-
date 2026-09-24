import type { Transition } from "framer-motion";

/**
 * Motion for the admin console. It only ever answers something the admin did
 * (opened, closed, saved, moved), never decorates. Enters ease out and take
 * ~240ms; exits are faster and ease in, so dismissing feels instant.
 */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const; // quint out: fast start, soft landing
export const EASE_IN = [0.32, 0, 0.67, 0] as const; // cubic in: for things leaving

export const enter = (duration = 0.24): Transition => ({ duration, ease: EASE_OUT });
export const exit = (duration = 0.16): Transition => ({ duration, ease: EASE_IN });

/** Things that slide into place under the pointer: indicators, reordered rows. */
export const snap: Transition = { type: "spring", stiffness: 520, damping: 42, mass: 0.8 };
