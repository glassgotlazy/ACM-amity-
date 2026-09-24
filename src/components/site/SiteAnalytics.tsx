"use client";

import { Analytics } from "@vercel/analytics/next";

/**
 * Vercel Web Analytics: page views only, no cookies. The admin console is
 * never counted, and query strings (which can carry search terms) are dropped.
 * Turned on per project in the Vercel dashboard (Analytics tab).
 */
export function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        const url = new URL(event.url);
        if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) return null;
        url.search = "";
        return { ...event, url: url.toString() };
      }}
    />
  );
}
