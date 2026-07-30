/* Pure helpers over the generated Drill Library (src/lib/drills.ts).

   These live outside the app page so they can be tested directly. The
   rule they all encode: a drill with no written content renders NO
   section — never an empty heading, never a placeholder. Absence is
   answered with absence, not with a guess. */

import { DRILLS, type Drill } from "./drills";

/** Does this drill have anything to show on the HOW TO tab?
 *  False means the tab is not rendered at all — an empty tab is a worse
 *  answer than a missing one, and inventing steps is not an option. */
export function hasHowTo(drill: Pick<Drill, "steps" | "mistakes">): boolean {
  return (drill.steps?.length ?? 0) > 0 || (drill.mistakes?.length ?? 0) > 0;
}

/** Other drills in the same sport, newest first. Returns fewer than
 *  `limit` (or none) rather than padding the row with unrelated drills. */
export function relatedDrills(drill: Drill, limit = 4, pool: Drill[] = DRILLS): Drill[] {
  return pool
    .filter(d => d.id !== drill.id && d.sport === drill.sport)
    .sort((a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt))
    .slice(0, limit);
}
