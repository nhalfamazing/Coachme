/* Achievements and XP.

   ONE system, derived state only. Nothing here is ever "awarded" and
   stored — every achievement is recomputed from what the athlete has
   actually done, so a wrong write can never leave a kid holding a badge
   they did not earn (or lose one they did). XP is the sum of the
   achievements currently earned, which is why drill logging feeds this
   module rather than incrementing a counter of its own.

   Icons live at the callsite (src/app/app/page.tsx) keyed by id; this
   module stays free of React so it can be tested directly. */

export interface AchievementDef {
  id: string;
  label: string;
  hint: string;
  /** Awarded while the achievement is earned. */
  xp: number;
}

/** 500 XP per level, matching the xpMax the app has always displayed. */
export const XP_PER_LEVEL = 500;

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: "first_workout", label: "First Workout", hint: "Log your first training session.", xp: 50 },
  { id: "streak_3", label: "3-Day Streak", hint: "Train 3 days in a row.", xp: 75 },
  { id: "streak_7", label: "Week Warrior", hint: "Train 7 days in a row.", xp: 150 },
  { id: "workouts_10", label: "10 Workouts", hint: "Log 10 total workouts.", xp: 100 },
  { id: "workouts_50", label: "50 Workouts", hint: "Log 50 total workouts.", xp: 300 },
  { id: "first_drill", label: "First Drill", hint: "Log a drill from the library.", xp: 50 },
  { id: "drills_10", label: "10 Drills", hint: "Log 10 drill sessions.", xp: 100 },
  { id: "first_post", label: "First Post", hint: "Share something in the Feed.", xp: 50 },
  { id: "first_pr", label: "First PR", hint: "Add a starting stat to your profile.", xp: 50 },
  { id: "first_trainer", label: "Coached Up", hint: "Connect with a real trainer.", xp: 100 },
];

/** What the athlete has actually done. Every field is a real count or a
 *  real boolean — there is no "assume" branch in here. */
export interface AchievementSignals {
  totalWorkouts: number;
  /** Consecutive training days across all workouts. */
  workoutStreak: number;
  totalDrillSessions: number;
  hasPosts: boolean;
  hasStats: boolean;
  hasTrainers: boolean;
  hasMessagedCoach: boolean;
}

export interface AchievementState {
  earned: Record<string, boolean>;
  earnedCount: number;
  /** Total XP from every earned achievement. */
  xp: number;
  level: number;
  /** XP into the current level, and the size of a level. */
  xpInLevel: number;
  xpMax: number;
}

export function achievementState(signals: Partial<AchievementSignals>): AchievementState {
  const s: AchievementSignals = {
    totalWorkouts: 0, workoutStreak: 0, totalDrillSessions: 0,
    hasPosts: false, hasStats: false, hasTrainers: false, hasMessagedCoach: false,
    ...signals,
  };
  const earned: Record<string, boolean> = {
    first_workout: s.totalWorkouts >= 1,
    streak_3: s.workoutStreak >= 3,
    streak_7: s.workoutStreak >= 7,
    workouts_10: s.totalWorkouts >= 10,
    workouts_50: s.totalWorkouts >= 50,
    first_drill: s.totalDrillSessions >= 1,
    drills_10: s.totalDrillSessions >= 10,
    first_post: s.hasPosts,
    first_pr: s.hasStats,
    // Unlocks on EITHER booking a session OR messaging any coach, since
    // booking needs real trainer calendars to be wired in.
    first_trainer: s.hasTrainers || s.hasMessagedCoach,
  };
  const xp = ACHIEVEMENT_DEFS.reduce((sum, a) => sum + (earned[a.id] ? a.xp : 0), 0);
  return {
    earned,
    earnedCount: Object.values(earned).filter(Boolean).length,
    xp,
    level: Math.floor(xp / XP_PER_LEVEL) + 1,
    xpInLevel: xp % XP_PER_LEVEL,
    xpMax: XP_PER_LEVEL,
  };
}

/** XP a single achievement is worth, for "+50 XP" style feedback. */
export function achievementXp(id: string): number {
  return ACHIEVEMENT_DEFS.find(a => a.id === id)?.xp ?? 0;
}
