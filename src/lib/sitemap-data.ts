/* What goes in the sitemaps, and when each page last actually changed.
 *
 * The rule: lastmod describes CONTENT, not deploys. The old sitemap stamped
 * every URL with the build time, which meant all six claimed to change on
 * every push — a signal that trains crawlers to ignore the field entirely.
 *
 * Drill and hub dates come from the data (addedAt in the manifest). Static
 * marketing pages carry an explicit date below, because only a human knows
 * whether an edit changed the meaning of the page or moved a div. Refresh one
 * when you meaningfully change that page:
 *
 *   git log -1 --format=%cs -- "src/app/(marketing)/about/page.tsx"
 *
 * Nothing that is noindex belongs in here. A sitemap is a request to index;
 * asking for a page we have told crawlers to skip is a contradiction, and
 * Search Console reports it as one.
 */

import { DRILLS } from "./drills";
import { drillPath, sportPath, sportsWithDrills, drillsInSport } from "./drill-seo";

export interface SitemapEntry {
  path: string;
  lastModified: string;
  changeFrequency?: "daily" | "weekly" | "monthly" | "yearly";
  priority?: number;
}

/** Static marketing pages. /app, /coach and /admin are absent on purpose:
 *  they are noindex product surfaces. */
const STATIC_PAGES: SitemapEntry[] = [
  { path: "/", lastModified: "2026-07-30", changeFrequency: "weekly", priority: 1 },
  { path: "/become-a-coach", lastModified: "2026-07-29", changeFrequency: "monthly", priority: 0.8 },
  { path: "/about", lastModified: "2026-07-28", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", lastModified: "2026-07-28", changeFrequency: "yearly", priority: 0.4 },
  { path: "/privacy", lastModified: "2026-07-28", changeFrequency: "monthly", priority: 0.3 },
  { path: "/terms", lastModified: "2026-07-28", changeFrequency: "monthly", priority: 0.3 },
];

export function pageEntries(): SitemapEntry[] {
  return STATIC_PAGES;
}

/** Newest addedAt among a set of drills — the honest "last changed" for a
 *  page whose content is those drills. */
function newestOf(drills: typeof DRILLS): string {
  return drills.reduce((latest, d) => (d.addedAt > latest ? d.addedAt : latest), drills[0]?.addedAt ?? "");
}

/** The library index, every sport hub, and every drill page. */
export function drillEntries(): SitemapEntry[] {
  const index: SitemapEntry = {
    path: "/drills",
    lastModified: newestOf(DRILLS),
    changeFrequency: "weekly",
    priority: 0.9,
  };
  const hubs = sportsWithDrills().map(sport => ({
    path: sportPath(sport),
    lastModified: newestOf(drillsInSport(sport)),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  const drills = DRILLS.map(d => ({
    path: drillPath(d),
    lastModified: d.addedAt,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  return [index, ...hubs, ...drills];
}

/** The child sitemaps the index points at. */
export const SITEMAP_CHILDREN = ["pages", "drills"] as const;
export type SitemapChild = (typeof SITEMAP_CHILDREN)[number];

export function entriesFor(child: SitemapChild): SitemapEntry[] {
  return child === "pages" ? pageEntries() : drillEntries();
}

/** Newest lastModified in a child sitemap, for the index's own lastmod. */
export function newestLastModified(entries: SitemapEntry[]): string {
  return entries.reduce((latest, e) => (e.lastModified > latest ? e.lastModified : latest), "");
}
