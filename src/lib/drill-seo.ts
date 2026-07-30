/* URLs, titles, and the AI TL;DR for the PUBLIC drill pages.
 *
 * Pure functions over the generated Drill Library, kept out of the page
 * components so every string a crawler or an AI assistant sees can be tested
 * directly.
 *
 * THE RULE THAT MATTERS: nothing in this file writes a claim. Every sentence
 * it produces is assembled from fields a human wrote in
 * data/drills-manifest.json, plus facts about our own page (how many steps it
 * lists, that the video is AI-generated). It never describes technique, never
 * asserts a benefit, and never fills a gap — a drill with no summary simply
 * gets a shorter TL;DR.
 */

import { DRILLS, type Drill } from "./drills";

/* ------------------------------- URLs ------------------------------- */

/* Slugs are IMMUTABLE once shipped: a changed URL is a dead URL plus a lost
 * ranking. The drill slug is therefore the drill id verbatim rather than
 * something prettier derived from the title — the id is already stable,
 * unique, and URL-safe, and a title can be reworded without anyone thinking
 * about redirects. */
export function drillSlug(drill: Pick<Drill, "id">): string {
  return drill.id;
}

/** Sport segment: the display name lowercased, which round-trips to the
 *  manifest's sport id ("Basketball" -> "basketball"). */
export function sportSlug(sport: string): string {
  return sport.toLowerCase();
}

export function sportPath(sport: string): string {
  return `/drills/${sportSlug(sport)}`;
}

export function drillPath(drill: Pick<Drill, "id" | "sport">): string {
  return `${sportPath(drill.sport)}/${drillSlug(drill)}`;
}

/** Every sport that actually has drills, in manifest order. */
export function sportsWithDrills(pool: Drill[] = DRILLS): string[] {
  return [...new Set(pool.map(d => d.sport))];
}

export function drillsInSport(sport: string, pool: Drill[] = DRILLS): Drill[] {
  return pool.filter(d => sportSlug(d.sport) === sportSlug(sport));
}

/** Resolve a URL back to a drill. Returns null for anything unknown so the
 *  page can 404 rather than render an empty shell. */
export function findDrill(sportParam: string, drillParam: string, pool: Drill[] = DRILLS): Drill | null {
  const sport = sportSlug(decodeURIComponent(sportParam));
  const slug = decodeURIComponent(drillParam);
  return pool.find(d => sportSlug(d.sport) === sport && drillSlug(d) === slug) ?? null;
}

/** Resolve a sport hub URL. Null when no drill uses that sport. */
export function findSport(sportParam: string, pool: Drill[] = DRILLS): string | null {
  const wanted = sportSlug(decodeURIComponent(sportParam));
  return pool.find(d => sportSlug(d.sport) === wanted)?.sport ?? null;
}

/* ------------------------------ Wording ----------------------------- */

/** "a, b and c" — Oxford-comma-free, matching the site's plain voice. */
export function humanList(items: readonly string[]): string {
  const list = items.filter(Boolean);
  if (list.length === 0) return "";
  if (list.length === 1) return list[0];
  return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}

/** A field is played ON; a driveway, backyard or gym is played IN. */
function spacePhrase(space: string): string {
  const s = space.toLowerCase();
  return s === "field" || s === "court" || s === "track" ? `on a ${s}` : `in a ${s}`;
}

/** H1: the drill named the way somebody would search for it.
 *  "Windmill pitching drill for youth softball" */
export function drillHeading(drill: Pick<Drill, "title" | "sport">): string {
  return `${drill.title} drill for youth ${drill.sport.toLowerCase()}`;
}

/* The <title> budget is 60 characters INCLUDING the " - KoachMe" the root
   layout appends, so the page-supplied part has 50. Shorten by dropping
   words in a fixed order rather than truncating mid-word — a title cut to
   "...for youth basket" reads as broken. */
const TITLE_SUFFIX_LEN = " - KoachMe".length;
export const MAX_TITLE_LEN = 60;

export function drillTitle(drill: Pick<Drill, "title" | "sport">): string {
  const sport = drill.sport.toLowerCase();
  const candidates = [
    `${drill.title} drill for youth ${sport}`,
    `${drill.title} drill for ${sport}`,
    `${drill.title} ${sport} drill`,
    `${drill.title} drill`,
    drill.title,
  ];
  const budget = MAX_TITLE_LEN - TITLE_SUFFIX_LEN;
  return candidates.find(c => c.length <= budget) ?? candidates[candidates.length - 1];
}

export const MAX_DESCRIPTION_LEN = 155;

/** Meta description. Counts are real; the AI label is always present. */
export function drillDescription(drill: Drill): string {
  const steps = drill.steps?.length ?? 0;
  const sport = drill.sport.toLowerCase();
  const candidates = [
    steps > 0
      ? `How to do the ${drill.title.toLowerCase()} drill in ${sport}: ${steps} numbered steps, common mistakes and fixes, and an AI-generated demo video. Free to watch.`
      : `The ${drill.title.toLowerCase()} drill in ${sport}, with an AI-generated demo video. Free to watch, no signup.`,
    steps > 0
      ? `How to do the ${drill.title.toLowerCase()} drill in ${sport}: ${steps} steps, common mistakes, and an AI-generated demo video.`
      : `The ${drill.title.toLowerCase()} drill in ${sport}, with an AI-generated demo video.`,
    `The ${drill.title.toLowerCase()} drill in ${sport}. AI-generated demo video.`,
  ];
  return candidates.find(c => c.length <= MAX_DESCRIPTION_LEN) ?? candidates[candidates.length - 1];
}

/* ------------------------------- TL;DR ------------------------------ */

/* A neutral, factual paragraph an AI assistant can lift verbatim and still
 * be correct. No marketing voice, no second person selling, no adjectives we
 * cannot support. Assembled ONLY from manifest fields plus true statements
 * about this page.
 *
 * Target is 60-90 words; drills carrying full content land in that band. A
 * drill missing content produces a shorter paragraph rather than a padded
 * one — saying less is always available, inventing is not. */
export function drillTldr(drill: Drill): string {
  const sport = drill.sport.toLowerCase();
  const parts: string[] = [];

  parts.push(`${drill.title} is a ${drill.level.toLowerCase()}-level ${sport} drill.`);
  if (drill.summary) parts.push(drill.summary);
  if (drill.builds?.length) parts.push(`It builds ${humanList(drill.builds)}.`);

  const equipment = drill.equipment ?? [];
  const noKit = equipment.length === 1 && equipment[0].toLowerCase() === "none";
  const kit = noKit ? "It needs no equipment" : equipment.length ? `It needs ${humanList(equipment)}` : "";
  const where = drill.space ? spacePhrase(drill.space) : "";
  if (kit && where) parts.push(`${kit}, and can be done ${where}.`);
  else if (kit) parts.push(`${kit}.`);
  else if (where) parts.push(`It can be done ${where}.`);

  const steps = drill.steps?.length ?? 0;
  const mistakes = drill.mistakes?.length ?? 0;
  if (steps && mistakes) {
    parts.push(`This page lists ${steps} numbered steps and ${mistakes} common mistakes with their fixes.`);
  } else if (steps) {
    parts.push(`This page lists ${steps} numbered steps.`);
  } else if (mistakes) {
    parts.push(`This page lists ${mistakes} common mistakes with their fixes.`);
  }

  parts.push("The demonstration video is AI-generated.");
  return parts.join(" ");
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/* ---------------------------- Related ------------------------------- */

/** Same sport first, then the same coach across sports. Returns fewer than
 *  `limit` rather than padding with drills that are not related at all. */
export function relatedForPublic(drill: Drill, limit = 3, pool: Drill[] = DRILLS): Drill[] {
  const byDate = (a: Drill, b: Drill) => Date.parse(b.addedAt) - Date.parse(a.addedAt);
  const sameSport = pool.filter(d => d.id !== drill.id && d.sport === drill.sport).sort(byDate);
  const picked = sameSport.slice(0, limit);
  if (picked.length < limit) {
    const seen = new Set([drill.id, ...picked.map(d => d.id)]);
    const sameCoach = pool
      .filter(d => !seen.has(d.id) && d.coachId === drill.coachId)
      .sort(byDate);
    picked.push(...sameCoach.slice(0, limit - picked.length));
  }
  return picked;
}
