import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  // Vendored UI prototype lives in src/app/(marketing)/page.tsx and is
  // intentionally untyped. We re-enable strict checks before Phase 1.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
