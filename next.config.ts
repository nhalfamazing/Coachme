import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  // TODO(Rasheid: enable after DNS): permanent redirect vercel.app -> koachme.ai.
  // As of 2026-07-28 koachme.ai has DNS A records but no working HTTPS
  // (SSL handshake fails - domain not yet connected in Vercel). Enabling
  // this redirect now would send every visitor to a dead host. Once the
  // domain is added to the Vercel project and serves the app, uncomment:
  // async redirects() {
  //   return [
  //     {
  //       source: "/:path*",
  //       has: [{ type: "host", value: "coachme-y4vx.vercel.app" }],
  //       destination: "https://koachme.ai/:path*",
  //       permanent: true,
  //     },
  //   ];
  // },
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
