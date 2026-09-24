"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * Whether the visitor asked for reduced motion — hydration-safe.
 *
 * framer-motion's own hook answers from the browser on the very first render,
 * while the server always rendered the "full motion" version. The two trees
 * then differ, React throws away the server HTML (error #418), rebuilds the
 * page and drops attributes such as the light theme; and content the server
 * sent at opacity 0 could stay invisible. This hook reports `false` while
 * hydrating — matching the server — and the real setting right after.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
