"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * The admin console has its own chrome; the public header and footer step
 * aside. The sign-in page keeps them — it is the way back to the site.
 */
export function isAdminPath(pathname: string | null) {
  if (!pathname || pathname === "/admin/login") return false;
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function HideOnAdmin({ children }: { children: ReactNode }) {
  return isAdminPath(usePathname()) ? null : <>{children}</>;
}
