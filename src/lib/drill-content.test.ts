import { describe, it, expect } from "vitest";
import { hasHowTo, relatedDrills } from "./drill-content";
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
