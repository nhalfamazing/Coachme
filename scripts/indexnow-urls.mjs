/* Which URLs actually changed between two commits.
 *
 * Pure functions, no I/O, so the mapping from "these files changed" to
 * "these pages changed" can be tested (see indexnow-urls.test.mjs) rather
 * than trusted. scripts/indexnow.mjs is the CLI that feeds them real git
 * data and does the submitting.
 *
 * WHY NOT JUST SUBMIT EVERYTHING: IndexNow is a claim that a URL changed.
 * Submitting all 38 on every deploy makes the claim meaningless, and the
 * protocol's own guidance is to send what changed. A CSS tweak changes
 * every page's bytes and none of their content — that is not a change
 * worth a crawler's time.
 */

/** Drill entries keyed by id, for comparing two manifest revisions. */
function drillsById(manifest) {
  const map = new Map();
  for (const d of manifest?.drills ?? []) map.set(d.id, d);
  return map;
}

/** Public path for a drill. The sport id in the manifest is already the
 *  lowercase URL segment, and slug is the public segment by definition. */
export function drillUrlPath(drill) {
  return `/drills/${drill.sport}/${drill.slug}`;
}

/* Marketing pages whose file maps 1:1 to a URL. The dynamic drill routes
   are deliberately absent: a change to those templates affects every drill
   page, and the manifest diff is the honest signal for those. */
const PAGE_FILE = /^src\/app\/\(marketing\)\/(?:([a-z0-9-]+)\/)?page\.tsx$/;

/** Static marketing URLs implied by the changed file list. */
export function changedPageUrls(changedFiles = []) {
  const urls = new Set();
  for (const file of changedFiles) {
    const m = PAGE_FILE.exec(file.replace(/\\/g, "/"));
    if (!m) continue;
    // src/app/(marketing)/page.tsx -> "/", .../about/page.tsx -> "/about"
    urls.add(m[1] ? `/${m[1]}` : "/");
  }
  return urls;
}

/**
 * Every path whose CONTENT changed between two manifest revisions plus a
 * changed-file list.
 *
 * A drill that was added or edited submits its own page, its sport hub and
 * the library index — both of those genuinely list it. A drill that was
 * REMOVED submits the hub and index but not its own URL: that page is gone,
 * and asking a crawler to look at a 404 is not a useful thing to do.
 */
export function changedPaths({ before, after, changedFiles = [] } = {}) {
  const paths = new Set(changedPageUrls(changedFiles));

  const oldDrills = drillsById(before);
  const newDrills = drillsById(after);

  // Sports whose hub listing is now different, for any reason.
  const touchedSports = new Set();

  for (const [id, drill] of newDrills) {
    const previous = oldDrills.get(id);
    if (previous && JSON.stringify(previous) === JSON.stringify(drill)) continue;
    paths.add(drillUrlPath(drill));       // added or edited
    touchedSports.add(drill.sport);
  }

  for (const [id, drill] of oldDrills) {
    if (newDrills.has(id)) continue;
    // Removed. Its hub and the index changed, but its own URL is a 404
    // now, and asking a crawler to look at one is not useful.
    touchedSports.add(drill.sport);
  }

  if (touchedSports.size) {
    paths.add("/drills");
    for (const sport of touchedSports) paths.add(`/drills/${sport}`);
  }

  return [...paths].sort();
}

/** Absolute URLs on the canonical host, which is what IndexNow requires —
 *  a submission whose host does not match the key file's host is rejected. */
export function toAbsolute(paths, siteUrl) {
  const base = siteUrl.replace(/\/$/, "");
  return paths.map(p => (p === "/" ? `${base}/` : `${base}${p}`));
}
