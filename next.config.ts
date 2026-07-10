import path from "node:path";
import type { NextConfig } from "next";

// Initialize the OpenNext Cloudflare dev shim so `getCloudflareContext()` works
// during `next dev`. No-op in production builds.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the workspace root: a stray parent lockfile (the SundaySuite repos share
  // a parent dir) would otherwise be auto-selected and break output tracing.
  turbopack: {
    root: path.join(__dirname),
  },
  // Skolen v2 moved the piano flows under /piano. Keep the old URLs working
  // (temporary — the routing may still evolve, so not a permanent 308).
  async redirects() {
    return [
      { source: '/bibliotek', destination: '/piano', permanent: false },
      { source: '/sang/:slug', destination: '/piano/sang/:slug', permanent: false },
      { source: '/egen-midi', destination: '/piano/egen-midi', permanent: false },
    ]
  },
};

export default nextConfig;
