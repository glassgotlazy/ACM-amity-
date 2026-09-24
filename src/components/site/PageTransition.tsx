"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ease } from "@/lib/motion";
import { isAdminPath } from "./HideOnAdmin";

/**
 * Route-level entrance. Deliberately short and vertical only — a long or
 * horizontal transition makes navigation feel slower than it is.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  // The admin console has its own, lighter transition (and must not remount
  // its sidebar and data on every click).
  if (reduce || isAdminPath(pathname)) return <>{children}</>;

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
    >
      {children}
    </motion.div>
  );
}
