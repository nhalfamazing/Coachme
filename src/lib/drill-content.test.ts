import { describe, it, expect } from "vitest";
import { hasHowTo, relatedDrills, drillProgress, statKey, trackedStatFor, type LoggedDrillSession } from "./drill-content";
import { DRILLS, type Drill } from "./drills";

/* A drill shaped like the real thing but with no written content. Every
   library drill currently ships with steps, so the "nothing written"
   path only exists here — and it is the path that matters, because the
   alternative to rendering nothing is inventing technique. */
const bare = (over: Partial<Drill> = {}): Drill => ({
  id: "test-bare", sport: "Basketball", title: "Bare", cue: "", level: "beginner",
  focus: "test", coachId: "coach-farm", addedAt: "2026-01-01",
  intro: null, demo: { cdn: "", blob: "" }, poster: { cdn: "", blob: "" },
  summary: null, builds: null, equipment: null, space: null,
  steps: null, mistakes: null, trackedStat: null,
  ...over,
} as Drill);

describe("hasHowTo", () => {
  it("is false when nothing is written, so the tab is not rendered at all", () => {
    expect(hasHowTo(bare())).toBe(false);
  });

  it("is false for present-but-empty arrays (no empty section either)", () => {
    expect(hasHowTo(bare({ steps: [], mistakes: [] }))).toBe(false);
  });

  it("is true with steps only", () => {
    expect(hasHowTo(bare({ steps: [{ n: 1, title: "Go", detail: "Go now." }] }))).toBe(true);
  });

  it("is true with mistakes only — a drill can ship corrections first", () => {
    expect(hasHowTo(bare({ mistakes: [{ mistake: "Too high", fix: "Lower it." }] }))).toBe(true);
  });

  it("matches the real library", () => {
    for (const d of DRILLS) {
      expect(hasHowTo(d), d.id).toBe(!!(d.steps?.length || d.mistakes?.length));
    }
  });
});

describe("relatedDrills", () => {
  const pool = [
    bare({ id: "a", sport: "Basketball", addedAt: "2026-01-01" }),
    bare({ id: "b", sport: "Basketball", addedAt: "2026-03-01" }),
    bare({ id: "c", sport: "Soccer", addedAt: "2026-04-01" }),
  ];

  it("returns same-sport drills, newest first, never the drill itself", () => {
    expect(relatedDrills(pool[0], 4, pool).map(d => d.id)).toEqual(["b"]);
  });

  it("returns nothing rather than padding with another sport", () => {
    expect(relatedDrills(pool[2], 4, pool)).toEqual([]);
  });

  it("honours the limit", () => {
    expect(relatedDrills(DRILLS[0], 2).length).toBeLessThanOrEqual(2);
  });
});

/* Progress is per-drill and per-athlete: their own reps against their own
   past, never against anyone else's. There is nothing here that ranks. */
const day = (offset: number, over: Partial<LoggedDrillSession> = {}): LoggedDrillSession => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  d.setHours(12, 0, 0, 0);
  return { id: `s${offset}`, drillId: "bb-crossover", date: d.toISOString(), ...over };
};

describe("drillProgress", () => {
  it("is all zeroes with no sessions, so the empty state shows", () => {
    const p = drillProgress([], "bb-crossover");
    expect(p.total).toBe(0);
    expect(p.streak).toBe(0);
    expect(p.repSeries).toEqual([]);
    expect(p.bestReps).toBeNull();
  });

  it("counts only this drill's sessions", () => {
    const p = drillProgress([day(0), day(1), day(0, { id: "x", drillId: "bb-mikan" })], "bb-crossover");
    expect(p.total).toBe(2);
  });

  it("counts consecutive days, and a same-day double does not inflate the streak", () => {
    const p = drillProgress([day(0), day(0, { id: "dup" }), day(1), day(2)], "bb-crossover");
    expect(p.total).toBe(4);
    expect(p.streak).toBe(3);
  });

  it("keeps yesterday's streak alive until today is actually over", () => {
    expect(drillProgress([day(1), day(2)], "bb-crossover").streak).toBe(2);
  });

  it("breaks the streak on a missed day", () => {
    expect(drillProgress([day(0), day(3), day(4)], "bb-crossover").streak).toBe(1);
  });

  it("plots only sessions that recorded reps, oldest first", () => {
    const p = drillProgress([day(0, { reps: 30 }), day(1), day(2, { reps: 20 })], "bb-crossover");
    expect(p.repSeries.map(r => r.reps)).toEqual([20, 30]);
    expect(p.bestReps).toBe(30);
  });

  it("leaves the chart out entirely when every session was a one-tap log", () => {
    const p = drillProgress([day(0), day(1)], "bb-crossover");
    expect(p.total).toBe(2);
    expect(p.repSeries).toEqual([]);
    expect(p.bestReps).toBeNull();
  });

  it("returns sessions newest first for the history list", () => {
    const p = drillProgress([day(2), day(0), day(1)], "bb-crossover");
    expect(p.sessions.map(s => s.id)).toEqual(["s0", "s1", "s2"]);
  });

  it("ignores rows with an unparseable date instead of throwing", () => {
    const p = drillProgress([day(0), { id: "bad", drillId: "bb-crossover", date: "not a date" }], "bb-crossover");
    expect(p.total).toBe(1);
  });
});

describe("trackedStatFor", () => {
  const stats = [{ label: "60 Yd Dash", value: 7.4, unit: "s" }, { label: "Exit Velo", value: 85, unit: "mph" }];

  it("is null when the drill names no stat — the panel stays hidden", () => {
    expect(trackedStatFor({ trackedStat: null }, stats)).toBeNull();
  });

  it("is null when the athlete has not recorded that stat", () => {
    expect(trackedStatFor({ trackedStat: "pop-time" }, stats)).toBeNull();
  });

  it("matches a stat-sheet label through its normalised key", () => {
    expect(trackedStatFor({ trackedStat: "60-yd-dash" }, stats)?.value).toBe(7.4);
  });

  it("survives an athlete with no stat sheet at all", () => {
    expect(trackedStatFor({ trackedStat: "exit-velo" }, null)).toBeNull();
  });

  it("is null for every shipped drill today — no trackedStat is set yet", () => {
    for (const d of DRILLS) expect(trackedStatFor(d, stats), d.id).toBeNull();
  });
});

describe("statKey", () => {
  it("normalises stat-sheet labels", () => {
    expect(statKey("60 Yd Dash")).toBe("60-yd-dash");
    expect(statKey("  Exit  Velo ")).toBe("exit-velo");
  });
});
