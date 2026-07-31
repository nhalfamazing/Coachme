// Client-side Sentry init. Next 16 builds with Turbopack, where the old
// sentry.client.config.ts is not picked up — this file is its successor.
//
// The SDK is loaded with a DYNAMIC import, and that is the whole point of
// this file's shape. A static `import * as Sentry from "@sentry/nextjs"`
// here lands the entire browser SDK in the chunk every single route shares,
// measured on 2026-07-30 at 61.5 KB brotli and 224 KB of parse-and-execute
// work — about 30% of all JavaScript on the marketing pages, including a
// static privacy policy. The `if (dsn)` guard below could never prevent
// that, because a static import is unconditional: it decides what ships,
// not what runs. With no DSN configured, that was 224 KB of main-thread
// work per visit to initialise nothing.
//
// A dynamic import puts the SDK in its own chunk that is fetched only when
// a DSN exists. Set NEXT_PUBLIC_SENTRY_DSN and error tracking comes back on
// its own, asynchronously, without ever blocking first paint.

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Type-only: erased at compile time, so it pulls in no runtime code.
type SentryModule = typeof import("@sentry/nextjs");

let sentry: SentryModule | null = null;

if (dsn) {
  import("@sentry/nextjs")
    .then(mod => {
      mod.init({ dsn, tracesSampleRate: 0.1, sendDefaultPii: false });
      sentry = mod;
    })
    // Monitoring that fails must not take the page with it.
    .catch(() => {});
}

/** Navigation breadcrumbs. Transitions that happen before the SDK has
 *  finished loading are dropped rather than queued — a missing breadcrumb
 *  is a far smaller problem than delaying a navigation, and when no DSN is
 *  set there is nothing to send in the first place. */
export function onRouterTransitionStart(
  url: string,
  navigationType: "push" | "replace" | "traverse",
) {
  sentry?.captureRouterTransitionStart?.(url, navigationType);
}
