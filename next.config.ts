import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  // Permanent redirect vercel.app -> koachme.ai. Enabled 2026-07-30 after
  // verifying with a real request (not just DNS) that https://koachme.ai
  // serves the app: /admin/login and / both return 200.
  //
  // Vercel's own domain settings currently answer this host with a 307
  // at the edge, before Next runs, so in practice this rule is a backstop
  // rather than the active redirect. It matters because 307 is temporary
  // and does not consolidate ranking signals into the canonical host —
  // when that project-level redirect is removed, this one takes over and
  // answers 301. No chain either way: the destination host does not match
  // the `has` condition, so it cannot redirect again.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "coachme-y4vx.vercel.app" }],
        destination: "https://koachme.ai/:path*",
        permanent: true,
      },
    ];
  },
  images: {
    // Drill posters and coach portraits are served from our Vercel Blob
    // store (mirrored there by scripts/mirror-drills.mjs; we never serve
    // third-party CDN URLs).
    remotePatterns: [
      new URL("https://woooi7wpsmvhydy9.public.blob.vercel-storage.com/**"),
    ],
  },
  // Keeps dev-mode screenshots clean for marketing captures; has no
  // effect on production builds.
  devIndicators: false,
  // Vendored UI prototype lives in src/app/app/page.tsx and is
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
