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

/* ============================================================
   PER-DRILL PROGRESS

   Everything below is derived from the athlete's own logged
   sessions. Nothing is compared against other athletes: there is
   no leaderboard and no ranking here by design.
   ============================================================ */

/** The shape the app stores per logged session. Mirrors sync.AppDrillSession;
 *  kept structural so this module stays dependency-free. */
export interface LoggedDrillSession {
  id: number | string;
  drillId: string;
  /** ISO timestamp of when the athlete trained (not when it synced). */
  date: string;
  reps?: number | null;
  notes?: string | null;
}

export interface DrillProgress {
  /** How many times this drill has been logged. */
  total: number;
  /** Consecutive days ending today (or yesterday, if today is not
   *  logged yet — a streak should survive until the day is actually
   *  over). */
  streak: number;
  /** Newest first. */
  sessions: LoggedDrillSession[];
  /** Oldest first, only sessions that recorded a rep count — this is
   *  what the reps chart plots. Empty when nobody logged reps. */
  repSeries: { date: string; reps: number }[];
  /** Highest rep count ever logged for this drill, or null. */
  bestReps: number | null;
}

function dayKey(iso: string): string {
  return new Date(iso).toDateString();
}

export function drillProgress(sessions: LoggedDrillSession[], drillId: string): DrillProgress {
  const mine = (sessions ?? [])
    .filter(s => s && s.drillId === drillId && !Number.isNaN(Date.parse(s.date)))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

  const days = new Set(mine.map(s => dayKey(s.date)));
  let streak = 0;
  const cursor = new Date();
  if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const withReps = mine.filter(s => typeof s.reps === "number" && s.reps > 0);
  const repSeries = withReps
    .map(s => ({ date: s.date, reps: s.reps as number }))
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

  return {
    total: mine.length,
    streak,
    sessions: mine,
    repSeries,
    bestReps: withReps.length ? Math.max(...withReps.map(s => s.reps as number)) : null,
  };
}

/** An entry on the athlete's stat sheet, as the app stores it. */
export interface AthleteStat {
  label: string;
  value: number | string;
  unit?: string | null;
  verified?: string | null;
}

/** Normalised stat key: "60 Yd Dash" -> "60-yd-dash". trackedStat in the
 *  manifest is written in this form, so a drill can point at a stat
 *  without the manifest having to know the app's display strings. */
export function statKey(label: string): string {
  return String(label ?? "")
    .trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** The athlete's own best on the stat this drill trains, or null.
 *  Null whenever the drill has no trackedStat OR the athlete has not
 *  recorded that stat — both cases hide the panel rather than showing
 *  an empty or invented number. */
export function trackedStatFor(
  drill: Pick<Drill, "trackedStat">,
  stats: AthleteStat[] | null | undefined,
): AthleteStat | null {
  if (!drill.trackedStat) return null;
  const want = statKey(drill.trackedStat);
  return (stats ?? []).find(s => s && statKey(s.label) === want) ?? null;
}
