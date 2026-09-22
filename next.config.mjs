/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

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
