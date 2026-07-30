import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/* Crawler access.
 *
 * The AI crawlers are named and allowed on purpose. The drill library is the
 * clearest, most factual writing on the site, and a parent asking an
 * assistant "how do I teach my kid a crossover" should be able to reach our
 * answer. Every drill page discloses that its video is AI-generated in both
 * the visible copy and the structured data, so an assistant quoting us
 * cannot present a machine demo as a real coach by accident.
 *
 * Naming them explicitly rather than leaning on `User-Agent: *` matters:
 * several of these bots match their own name first, and Google-Extended does
 * nothing at all unless it is addressed directly.
 *
 * /app stays disallowed — per-device state, thin for crawlers.
 *
 * /coach is NO LONGER disallowed, and is noindex instead. A crawler
 * forbidden to fetch a page can never see the noindex on it, which is
 * exactly how a disallowed URL ends up indexed from an inbound link. Allow
 * the fetch and let the directive do the work.
 */

const AI_CRAWLERS = [
  "GPTBot",           // OpenAI
  "OAI-SearchBot",    // OpenAI search
  "ChatGPT-User",     // ChatGPT browsing for a user
  "ClaudeBot",        // Anthropic
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",    // Perplexity
  "Google-Extended",  // Gemini grounding; a no-op unless named
  "Applebot-Extended",
  "CCBot",            // Common Crawl, which many models train from
];

const DISALLOW = ["/app", "/api/", "/admin"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: "Googlebot", allow: "/", disallow: DISALLOW },
      { userAgent: "Bingbot", allow: "/", disallow: DISALLOW },
      ...AI_CRAWLERS.map(userAgent => ({
        userAgent,
        // Spelled out rather than inherited: the drill library is the point.
        allow: ["/", "/drills"],
        disallow: DISALLOW,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
