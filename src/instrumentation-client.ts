// Client-side Sentry init. Next 16 builds with Turbopack, where the old
// sentry.client.config.ts is not picked up — this file is its successor.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// No DSN (local dev) -> skip init entirely so nothing warns or crashes.
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
