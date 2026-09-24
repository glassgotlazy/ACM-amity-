"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useEffect, useState } from "react";

/**
 * A single hairline ring that trails the pointer and widens over interactive
 * elements. Desktop and fine-pointer only; it never appears on touch, and it
 * is disabled entirely under reduced motion.
 */
export function Cursor() {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 900, damping: 50, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 900, damping: 50, mass: 0.35 });

  useEffect(() => {
    if (reduce) return;
    const fine = window.matchMedia("(pointer: fine)");
    setEnabled(fine.matches);
    const onChange = (e: MediaQueryListEvent) => setEnabled(e.matches);
    fine.addEventListener("change", onChange);
    return () => fine.removeEventListener("change", onChange);
  }, [reduce]);

  useEffect(() => {
    if (!enabled) return;

    function onMove(event: PointerEvent) {
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);
      const el = event.target as HTMLElement | null;
      setActive(Boolean(el?.closest('a, button, [role="button"], input, textarea, select, [data-cursor="active"]')));
    }
    function onLeave() {
      setVisible(false);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[999] hidden lg:block"
      style={{ x: sx, y: sy }}
    >
      <motion.span
        className="block rounded-full border border-acm/70"
        animate={{
          width: active ? 34 : 20,
          height: active ? 34 : 20,
          opacity: visible ? (active ? 0.9 : 0.45) : 0,
          margin: active ? -17 : -10,
        }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.div>
  );
}
