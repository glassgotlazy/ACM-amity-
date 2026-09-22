/**
 * The site's own absolute URL.
 *
 * Hard-coding this is a trap: a placeholder domain silently breaks every
 * canonical link and social preview, because Next resolves relative metadata
 * URLs against it. Vercel exposes the real production host at build time, so
 * the value is derived rather than written down. NEXT_PUBLIC_SITE_URL wins
 * when a custom domain is attached.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.startsWith("http") ? explicit : `https://${explicit}`;

  // Set by Vercel to the project's production host, stable across deployments.
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return `https://${production}`;

  // Set on every Vercel deployment, including previews.
  const deployment = process.env.VERCEL_URL;
  if (deployment) return `https://${deployment}`;

  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = "ACM BuildHub";

export const SITE_TAGLINE = "Real problems. Real projects. Real technical experience.";
