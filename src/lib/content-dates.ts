/* When a page's CONTENT last changed — for the visible "Updated" line and
 * for datePublished / dateModified in structured data.
 *
 * THE RULE: never a build timestamp. A date that moves on every deploy tells
 * a reader nothing and teaches a crawler to ignore the field — the same
 * mistake the sitemap made before Phase 3 (see src/lib/sitemap-data.ts).
 * Every date here comes from `addedAt` in the manifest, which a human wrote.
 *
 * HONEST LIMIT: we do not track edits to a drill after it lands, so a
 * drill's modified date is its added date. That is a true statement about
 * data we hold, and it is the reason dateModified is not simply "today":
 * claiming a page changed when it did not is the fabrication this codebase
 * refuses everywhere else.
 *
 * A collection page (sport hub, library index) is genuinely published when
 * its oldest drill landed and genuinely modified when its newest one did —
 * adding a drill to a hub really does change that hub.
 */

import type { Drill } from "./drills";

export interface ContentDates {
  /** ISO yyyy-mm-dd. */
  published: string;
  /** ISO yyyy-mm-dd. Never earlier than `published`. */
  modified: string;
}

/** A single drill. Both dates are its addedAt until we track edits. */
export function drillDates(drill: Pick<Drill, "addedAt">): ContentDates {
  return { published: drill.addedAt, modified: drill.addedAt };
}

/** A hub or index: oldest drill it lists to newest. Returns null for an
 *  empty set rather than inventing a date for a page about nothing. */
export function collectionDates(drills: Pick<Drill, "addedAt">[]): ContentDates | null {
  const dates = drills.map(d => d.addedAt).filter(Boolean).sort();
  if (!dates.length) return null;
  return { published: dates[0], modified: dates[dates.length - 1] };
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2026-07-29" -> "29 July 2026".
 *
 *  Formatted by hand rather than with toLocaleDateString: that depends on
 *  the ICU data of whatever machine runs the build, so the same commit can
 *  render a different string on a laptop and on Vercel. Returns null for
 *  anything that is not a plain ISO date, so a malformed value renders no
 *  line at all instead of "Invalid Date". */
export function formatUpdated(iso: string | null | undefined): string | null {
  if (typeof iso !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const [, y, mo, d] = m;
  const month = MONTHS[Number(mo) - 1];
  if (!month) return null;
  const day = Number(d);
  if (day < 1 || day > 31) return null;
  return `${day} ${month} ${y}`;
}
