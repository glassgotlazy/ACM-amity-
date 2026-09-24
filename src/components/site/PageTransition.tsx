"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ease } from "@/lib/motion";
import { isAdminPath } from "./HideOnAdmin";

/**
 * Route-level entrance. Short and vertical only — a long or horizontal
 * transition makes navigation feel slower than it is.
 *
 * Two rules keep it safe:
 * - The element tree is the same on server and client whatever the motion
 *   setting. (Returning a different tree under reduced motion made React
 *   discard the server HTML and rebuild the page, which also wiped the
 *   light-theme attribute on <html>.)
 * - It never plays on the first load: the server-rendered page must be
 *   visible before any JavaScript runs, so only client-side navigations fade.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const first = useRef(true);
  useEffect(() => {
    first.current = false;
  }, []);

  // The admin console has its own, lighter transition.
  const still = first.current || reduce || isAdminPath(pathname);

  return (
    <motion.div
      key={isAdminPath(pathname) ? "admin" : pathname}
      initial={still ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
    >
      {children}
    </motion.div>
  );
}
