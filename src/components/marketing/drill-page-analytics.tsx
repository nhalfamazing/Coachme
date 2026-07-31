"use client";

// The only client JavaScript on a public drill page.
//
// Phase B got these pages to zero page-specific client JS, so adding any
// back needs justifying: without it we cannot tell a drill page that gets
// traffic and converts from one that gets traffic and does nothing, which
// is the single question the whole drill library was built to answer.
// It is one small island, it renders nothing, and it attaches a listener to
// the server-rendered <video> rather than turning the video into a
// component — so the markup, the poster, and the zero-byte preload="none"
// behaviour are all untouched.
//
// PRIVACY: event props carry the drill, the sport, and a COARSE referrer
// CLASS. Never the referrer URL, never a query string — a search referrer
// can contain what somebody typed, and that is not ours to collect.

import { useEffect } from "react";
import { track } from "@vercel/analytics";
import { trackWhenReady } from "@/lib/analytics";

/* Did we arrive here by client-side navigation rather than a document load?
 *
 * It matters because `document.referrer` belongs to the DOCUMENT, not the
 * route: after an App Router soft navigation it still holds whatever
 * referred the original page, or nothing at all. A visitor who browsed a
 * sport hub and clicked into a drill would otherwise be recorded as
 * "direct", which is the one bucket that should mean "typed or bookmarked".
 *
 * The navigation timing entry keeps the URL the document actually loaded,
 * so comparing it to the current path separates the two cleanly. */
function isSoftNavigation(): boolean {
  try {
    const [nav] = performance.getEntriesByType("navigation");
    if (!nav?.name) return false;
    return new URL(nav.name).pathname !== window.location.pathname;
  } catch {
    return false;
  }
}

/** Coarse bucket for where a visitor came from. Deliberately lossy. */
function referrerType(referrer: string, host: string): string {
  if (isSoftNavigation()) return "internal";
  if (!referrer) return "direct";
  let url: URL;
  try {
    url = new URL(referrer);
  } catch {
    return "other";
  }
  if (url.host === host) return "internal";
  const h = url.host.replace(/^www\./, "");
  if (/^(google|bing|duckduckgo|yahoo|ecosia|brave|yandex)\./.test(h)) return "search";
  if (/^(chat\.openai\.com|chatgpt\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com)$/.test(h)) return "ai";
  if (/^(facebook|instagram|x|twitter|t|reddit|tiktok|youtube|linkedin|pinterest)\./.test(h)) return "social";
  return "other";
}

export function DrillPageAnalytics({
  drillId,
  sport,
  videoId,
}: {
  drillId: string;
  sport: string;
  videoId: string;
}) {
  useEffect(() => {
    // trackWhenReady, not track: a mount-time event fires before the
    // analytics queue exists and is silently discarded. See src/lib/analytics.ts.
    return trackWhenReady("drill_page_viewed", {
      drillId,
      sport,
      referrerType: referrerType(document.referrer, window.location.host),
    });
  }, [drillId, sport]);

  useEffect(() => {
    const video = document.getElementById(videoId);
    if (!(video instanceof HTMLVideoElement)) return;
    // `play` fires on every resume; this is "did they ever start it", which
    // is the interesting signal on a page whose whole job is the video.
    let played = false;
    const onPlay = () => {
      if (played) return;
      played = true;
      track("drill_video_played", { drillId, sport });
    };
    video.addEventListener("play", onPlay);
    return () => video.removeEventListener("play", onPlay);
  }, [drillId, sport, videoId]);

  return null;
}
