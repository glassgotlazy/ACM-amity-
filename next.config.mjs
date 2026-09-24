/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Baseline hardening for every response. A strict Content-Security-Policy
  // is not set yet: the theme bootstrap is an inline script and would need a
  // nonce first.
  async headers() {
    const base = [
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
