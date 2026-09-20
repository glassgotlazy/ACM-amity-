"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** One-pixel reading indicator, fixed under the navbar. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 260, damping: 40, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[95] h-px origin-left bg-acm"
      style={{ scaleX }}
    />
  );
}
