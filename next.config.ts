import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { DRILLS } from "./src/lib/drills";
import { drillPath, legacyDrillPath } from "./src/lib/drill-seo";

/* Drill pages moved from id-based paths (/drills/softball/sb-windmill) to
 * keyword slugs (/drills/softball/windmill-pitching) on 2026-07-30. Every
 * old URL 301s to its new one — permanently, because the page did not
 * change, only its address, and a 302 would leave the ranking on a URL we
 * no longer serve.
 *
 * Generated from DRILLS rather than hand-listed, so a drill cannot be
 * added, renamed or removed without its redirect following automatically.
 *
 * NO CHAINS, and it is checked rather than assumed: a destination that is
 * also somebody's source would make Googlebot follow two hops, and the
 * build refuses to produce that.
 *
 * `statusCode: 301` rather than `permanent: true`, which emits 308. Google
 * treats the two the same, but 301 is the one every other tool, log
 * pipeline and older crawler understands without qualification, and there
 * is nothing here worth spending that ambiguity on — these are GET requests
 * for HTML, so 308's method-preserving guarantee buys us nothing. */
function drillSlugRedirects() {
  const moved = DRILLS.filter(d => legacyDrillPath(d) !== drillPath(d));
  const sources = new Set(moved.map(legacyDrillPath));
  const chained = moved.filter(d => sources.has(drillPath(d)));
  if (chained.length) {
    throw new Error(
      `Redirect chain: ${chained.map(d => `${legacyDrillPath(d)} -> ${drillPath(d)}`).join(", ")}. `
      + "A destination is also a source; collapse it to a single hop.",
    );
  }
  return moved.map(d => ({
    source: legacyDrillPath(d),
    destination: drillPath(d),
    statusCode: 301 as const,
  }));
}

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  // Permanent redirect vercel.app -> koachme.ai. Enabled 2026-07-30 after
  // verifying with a real request (not just DNS) that https://koachme.ai
  // serves the app: /admin/login and / both return 200.
  //
  // `statusCode: 301`, not `permanent: true` — the latter emits 308, which
  // is what this rule actually served until 2026-07-30 despite the baseline
  // notes describing it as a 301.
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
        statusCode: 301 as const,
      },
      ...drillSlugRedirects(),
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
