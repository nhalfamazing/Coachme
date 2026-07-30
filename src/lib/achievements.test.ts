import { describe, it, expect } from "vitest";
import { ACHIEVEMENT_DEFS, XP_PER_LEVEL, achievementState, achievementXp } from "./achievements";

describe("achievementState", () => {
  it("starts a brand-new athlete at nothing earned, 0 XP, level 1", () => {
    const s = achievementState({});
    expect(s.earnedCount).toBe(0);
    expect(s.xp).toBe(0);
    expect(s.level).toBe(1);
    expect(s.xpInLevel).toBe(0);
    expect(s.xpMax).toBe(XP_PER_LEVEL);
  });

  it("awards XP for a logged drill through the same system as everything else", () => {
    const before = achievementState({ totalDrillSessions: 0 });
    const after = achievementState({ totalDrillSessions: 1 });
    expect(before.earned.first_drill).toBe(false);
    expect(after.earned.first_drill).toBe(true);
    expect(after.xp - before.xp).toBe(achievementXp("first_drill"));
  });

  it("unlocks the 10-drill achievement only at 10", () => {
    expect(achievementState({ totalDrillSessions: 9 }).earned.drills_10).toBe(false);
    expect(achievementState({ totalDrillSessions: 10 }).earned.drills_10).toBe(true);
  });

  it("does not let drill logging unlock workout achievements", () => {
    const s = achievementState({ totalDrillSessions: 50 });
    expect(s.earned.first_workout).toBe(false);
    expect(s.earned.workouts_10).toBe(false);
    expect(s.earned.streak_3).toBe(false);
  });

  it("rolls the level over at 500 XP and keeps the bar showing progress into it", () => {
    const everything = achievementState({
      totalWorkouts: 50, workoutStreak: 7, totalDrillSessions: 10,
      hasPosts: true, hasStats: true, hasTrainers: true, hasMessagedCoach: true,
    });
    const totalXp = ACHIEVEMENT_DEFS.reduce((n, a) => n + a.xp, 0);
    expect(everything.earnedCount).toBe(ACHIEVEMENT_DEFS.length);
    expect(everything.xp).toBe(totalXp);
    expect(everything.level).toBe(Math.floor(totalXp / XP_PER_LEVEL) + 1);
    expect(everything.xpInLevel).toBe(totalXp % XP_PER_LEVEL);
  });

  it("unlocks Coached Up from either a booking or a message", () => {
    expect(achievementState({ hasTrainers: true }).earned.first_trainer).toBe(true);
    expect(achievementState({ hasMessagedCoach: true }).earned.first_trainer).toBe(true);
    expect(achievementState({}).earned.first_trainer).toBe(false);
  });

  it("has an entry in earned for every definition, and no strays", () => {
    const s = achievementState({});
    expect(Object.keys(s.earned).sort()).toEqual(ACHIEVEMENT_DEFS.map(a => a.id).sort());
  });
});
