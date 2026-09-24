/**
 * Uploaded images live in Supabase Storage. Allow the optimiser to fetch
 * them from exactly that project's public bucket (and any *.supabase.co
 * project, for previews) — nothing else.
 */
function storagePatterns() {
  const patterns = [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/cms-media/**" }];
  try {
    const u = new URL(process.env.SUPABASE_URL ?? "");
    patterns.push({
      protocol: u.protocol.replace(":", ""),
      hostname: u.hostname,
      port: u.port,
      pathname: "/storage/v1/object/public/cms-media/**",
    });
  } catch {
    /* not configured */
  }
  return patterns;
}

/**
 * Content-Security-Policy. Scripts may only come from this site and
 * Cloudflare's spam check; images from this site and Supabase Storage; no
 * plugins, no <base> tricks, no posting forms to other sites, no framing by
 * other sites. 'unsafe-inline' stays on scripts because the App Router's
 * page data and the theme bootstrap are inline, and a nonce would force every
 * page to render per request (losing static pages).
 */
function contentSecurityPolicy() {
  let storage = "";
  try {
    storage = new URL(process.env.SUPABASE_URL ?? "").origin;
  } catch {
    /* not configured */
  }
  const dev = process.env.NODE_ENV !== "production";
  const cf = "https://challenges.cloudflare.com";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${cf}${dev ? " 'unsafe-eval' https://va.vercel-scripts.com" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://*.supabase.co ${storage}`.trim(),
    "font-src 'self' data:",
    `connect-src 'self' ${cf} https://*.vercel-insights.com`,
    `frame-src ${cf}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join("; ");
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    remotePatterns: storagePatterns(),
    formats: ["image/avif", "image/webp"],
  },

  // Baseline hardening for every response.
  async headers() {
    const base = [
      { key: "Content-Security-Policy", value: contentSecurityPolicy() },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
    ];
    return [
      { source: "/:path*", headers: base },
      {
        source: "/api/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },

  // The Open Graph routes read the Inter font from disk at request time.
  // Next's tracer cannot see a runtime readFile, so the font has to be
  // declared explicitly or it is left out of the serverless bundle and the
  // cards 500 in production while working perfectly in local dev.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./src/assets/**"],
    "/problems/[slug]/opengraph-image": ["./src/assets/**"],
    "/projects/[slug]/opengraph-image": ["./src/assets/**"],
  },
};

export default nextConfig;
