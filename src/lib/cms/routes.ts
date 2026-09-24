/**
 * Where a CMS link may point. Internal links must resolve to a page that
 * exists, so an admin cannot publish a navigation item or button that 404s.
 * Shared by the server validator and the admin's link picker.
 */

export const STATIC_ROUTES = [
  "/",
  "/projects",
  "/problems",
  "/problems/submit",
  "/ideas",
  "/research",
  "/teams",
  "/activity",
  "/events",
  "/profile",
  "/discover",
  "/join",
  "/admin",
] as const;

export type KnownSlugs = { projects: string[]; problems: string[]; research: string[] };

const DYNAMIC: { prefix: string; key: keyof KnownSlugs }[] = [
  { prefix: "/projects/", key: "projects" },
  { prefix: "/problems/", key: "problems" },
  { prefix: "/research/", key: "research" },
];

/** Every internal destination, for the admin's suggestion list. */
export function allRoutes(slugs: KnownSlugs): string[] {
  return [
    ...STATIC_ROUTES,
    ...DYNAMIC.flatMap(({ prefix, key }) => slugs[key].map((s) => `${prefix}${s}`)),
  ];
}

/**
 * Returns an error message, or null when the link is valid. Accepts an
 * internal path (with an optional #anchor or ?query), an http(s) URL, or a
 * mailto:/tel: link.
 */
export function checkHref(href: string, slugs: KnownSlugs): string | null {
  const value = href.trim();
  if (!value) return "Enter a link.";
  if (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(value)) return null;
  if (/^tel:\+?[\d\s()-]{5,}$/i.test(value)) return null;
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      return url.hostname.includes(".") ? null : "That web address is not complete.";
    } catch {
      return "That web address is not valid.";
    }
  }
  if (!value.startsWith("/")) return "Use a site path like /projects, or a full https:// address.";

  const path = value.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if ((STATIC_ROUTES as readonly string[]).includes(path)) return null;
  for (const { prefix, key } of DYNAMIC) {
    if (path.startsWith(prefix)) {
      const slug = path.slice(prefix.length);
      return slugs[key].includes(slug) ? null : `No ${key.replace(/s$/, "")} called “${slug}” exists.`;
    }
  }
  return `There is no page at ${path}.`;
}
