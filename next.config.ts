import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  // Vendored UI prototype lives in src/app/(marketing)/page.tsx and is
  // intentionally untyped. We re-enable strict checks before Phase 1.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withSentryConfig(nextConfig, {
  // Keep builds quiet on machines without Sentry credentials (no org,
  // project, or auth token configured yet — source map upload is skipped).
  silent: true,
  telemetry: false,
});
