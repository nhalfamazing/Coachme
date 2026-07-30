/* These tests guard the strings that go into search results, into AI
   answers, and into URLs that must never change. */

import { describe, it, expect } from "vitest";
import { DRILLS, type Drill } from "./drills";
import {
  MAX_DESCRIPTION_LEN, MAX_TITLE_LEN,
  drillDescription, drillHeading, drillPath, drillSlug, drillTitle, drillTldr,
  drillsInSport, findDrill, findSport, humanList, relatedForPublic,
  humanListOr, libraryTldr, libraryTotals, sportDescription, sportTitle, sportTldr,
  sportPath, sportSlug, sportsWithDrills, wordCount,
} from "./drill-seo";

const SUFFIX = " - KoachMe";

describe("URLs", () => {
  it("uses the drill id as the slug, so a retitled drill keeps its URL", () => {
    for (const d of DRILLS) expect(drillSlug(d)).toBe(d.id);
  });

  it("builds paths under /drills/<sport>/<drill>", () => {
    const d = DRILLS.find(x => x.id === "sb-windmill")!;
    expect(drillPath(d)).toBe("/drills/softball/sb-windmill");
    expect(sportPath(d.sport)).toBe("/drills/softball");
  });

  it("gives every drill a unique path", () => {
    const paths = DRILLS.map(drillPath);
    expect(new Set(paths).size).toBe(DRILLS.length);
  });

  it("produces lowercase, URL-safe paths with no encoding needed", () => {
    for (const d of DRILLS) {
      const p = drillPath(d);
      expect(p, d.id).toBe(p.toLowerCase());
      expect(encodeURI(p), d.id).toBe(p);
      expect(p, d.id).toMatch(/^\/drills\/[a-z0-9-]+\/[a-z0-9-]+$/);
    }
  });

  it("round-trips every drill through its own URL", () => {
    for (const d of DRILLS) {
      const [, , sport, slug] = drillPath(d).split("/");
      expect(findDrill(sport, slug)?.id, d.id).toBe(d.id);
    }
  });

  it("returns null for unknown URLs rather than a near match", () => {
    expect(findDrill("basketball", "does-not-exist")).toBeNull();
    expect(findDrill("quidditch", "bb-crossover")).toBeNull();
    // Right drill, wrong sport segment: still a miss, so one drill cannot
    // be reached at several URLs.
    expect(findDrill("soccer", "bb-crossover")).toBeNull();
    expect(findSport("quidditch")).toBeNull();
  });

  it("resolves sport hubs case-insensitively", () => {
    expect(findSport("basketball")).toBe("Basketball");
    expect(findSport("BASKETBALL")).toBe("Basketball");
  });

  it("counts sports and drills from the data, never a constant", () => {
    const sports = sportsWithDrills();
    expect(sports.length).toBe(new Set(DRILLS.map(d => d.sport)).size);
    const total = sports.reduce((n, s) => n + drillsInSport(s).length, 0);
    expect(total).toBe(DRILLS.length);
  });
});

/* The URLs shipped on 2026-07-30. A failure here means a live page has
   silently moved, which costs its ranking and breaks every inbound link.
   Changing this list is a redirect decision, not a test fix. */
describe("slug stability", () => {
  const SHIPPED = [
    "/drills/basketball/bb-crossover",
    "/drills/basketball/bb-form-shooting",
    "/drills/basketball/bb-two-ball",
    "/drills/basketball/bb-mikan",
    "/drills/soccer/so-inside-pass",
    "/drills/soccer/so-first-touch",
    "/drills/soccer/so-cone-dribble",
    "/drills/soccer/so-juggling",
    "/drills/soccer/so-laces-shot",
    "/drills/soccer/so-sole-rolls",
    "/drills/baseball/ba-tee-work",
    "/drills/baseball/ba-ready-position",
    "/drills/baseball/ba-tee-drive",
    "/drills/baseball/ba-ground-balls",
    "/drills/football/fb-catch-triangle",
    "/drills/football/fb-stance-start",
    "/drills/track/tr-sprint-start",
    "/drills/track/tr-arm-drive",
    "/drills/track/tr-a-skip",
    "/drills/track/tr-bounding",
    "/drills/volleyball/vb-forearm-pass",
    "/drills/volleyball/vb-setting",
    "/drills/softball/sb-windmill",
    "/drills/softball/sb-soft-toss",
  ];

  it("still serves every URL that shipped", () => {
    const live = new Set(DRILLS.map(drillPath));
    for (const url of SHIPPED) expect(live.has(url), `${url} has moved or gone`).toBe(true);
  });
});

describe("titles and descriptions", () => {
  it("fits every title in 60 chars including the brand suffix", () => {
    for (const d of DRILLS) {
      expect(drillTitle(d).length + SUFFIX.length, `${d.id}: "${drillTitle(d)}"`)
        .toBeLessThanOrEqual(MAX_TITLE_LEN);
    }
  });

  it("keeps every description within 155 chars", () => {
    for (const d of DRILLS) {
      expect(drillDescription(d).length, `${d.id}: "${drillDescription(d)}"`)
        .toBeLessThanOrEqual(MAX_DESCRIPTION_LEN);
    }
  });

  it("gives every drill a distinct title and description", () => {
    expect(new Set(DRILLS.map(drillTitle)).size).toBe(DRILLS.length);
    expect(new Set(DRILLS.map(drillDescription)).size).toBe(DRILLS.length);
  });

  it("shortens rather than truncating mid-word", () => {
    const long = { title: "A very long drill name that will not fit anywhere", sport: "Volleyball" };
    const t = drillTitle(long);
    expect(t.endsWith("…")).toBe(false);
    expect(long.title.startsWith(t.split(" drill")[0])).toBe(true);
  });

  it("names the sport in the H1", () => {
    const d = DRILLS.find(x => x.id === "sb-windmill")!;
    expect(drillHeading(d)).toBe("Windmill pitching drill for youth softball");
  });

  it("says the video is AI-generated in every description", () => {
    for (const d of DRILLS) expect(drillDescription(d), d.id).toMatch(/AI-generated/);
  });
});

describe("AI TL;DR", () => {
  it("lands in the 60-90 word band for every drill that has content", () => {
    for (const d of DRILLS) {
      const w = wordCount(drillTldr(d));
      expect(w, `${d.id}: ${w} words — "${drillTldr(d)}"`).toBeGreaterThanOrEqual(60);
      expect(w, `${d.id}: ${w} words`).toBeLessThanOrEqual(90);
    }
  });

  it("always discloses that the video is AI-generated", () => {
    for (const d of DRILLS) expect(drillTldr(d), d.id).toContain("AI-generated");
  });

  it("quotes the human-written summary verbatim", () => {
    for (const d of DRILLS) {
      if (d.summary) expect(drillTldr(d), d.id).toContain(d.summary);
    }
  });

  it("states counts that match the page", () => {
    for (const d of DRILLS) {
      const t = drillTldr(d);
      if (d.steps?.length) expect(t, d.id).toContain(`${d.steps.length} numbered steps`);
      if (d.mistakes?.length) expect(t, d.id).toContain(`${d.mistakes.length} common mistakes`);
    }
  });

  it("shrinks instead of inventing when content is missing", () => {
    const bare = {
      ...DRILLS[0], id: "bare", summary: null, builds: null,
      equipment: null, space: null, steps: null, mistakes: null,
    } as Drill;
    const t = drillTldr(bare);
    expect(t).toBe(`${bare.title} is a beginner-level basketball drill. The demonstration video is AI-generated.`);
    expect(t).not.toMatch(/undefined|null|NaN/);
  });

  it("never emits a placeholder or a dangling list", () => {
    for (const d of DRILLS) {
      const t = drillTldr(d);
      expect(t, d.id).not.toMatch(/undefined|null|NaN|\s,|,\./);
      expect(t.trim(), d.id).toMatch(/\.$/);
    }
  });

  it("says no equipment rather than listing 'none' as a thing you need", () => {
    const d = DRILLS.find(x => x.equipment?.length === 1 && x.equipment[0] === "none")!;
    expect(d).toBeTruthy();
    expect(drillTldr(d)).toContain("It needs no equipment");
    expect(drillTldr(d)).not.toMatch(/needs none/);
  });
});

describe("humanList", () => {
  it("joins the way a person writes", () => {
    expect(humanList(["a"])).toBe("a");
    expect(humanList(["a", "b"])).toBe("a and b");
    expect(humanList(["a", "b", "c"])).toBe("a, b and c");
    expect(humanList([])).toBe("");
  });
});

describe("related drills", () => {
  it("prefers the same sport", () => {
    const d = DRILLS.find(x => x.id === "so-juggling")!;
    for (const r of relatedForPublic(d, 3)) expect(r.sport).toBe("Soccer");
  });

  it("never returns the drill itself", () => {
    for (const d of DRILLS) {
      expect(relatedForPublic(d, 3).some(r => r.id === d.id), d.id).toBe(false);
    }
  });

  it("falls back to the same coach when a sport is thin", () => {
    // Football has 2 drills; its coach also teaches elsewhere, so the
    // same-coach tier can top the row up past what the sport alone offers.
    const d = DRILLS.find(x => x.id === "fb-catch-triangle")!;
    const related = relatedForPublic(d, 3);
    expect(related.length).toBeGreaterThan(1);
    for (const r of related) {
      expect(r.sport === d.sport || r.coachId === d.coachId, r.id).toBe(true);
    }
  });

  it("returns fewer than asked rather than padding with unrelated drills", () => {
    // Volleyball has exactly 2 drills and both belong to the same coach, so
    // one related drill is the honest maximum. Onward navigation on that
    // page comes from the sport hub and library links instead — labelling a
    // soccer drill "related" to a volleyball drill would be a small lie for
    // a small SEO gain.
    const d = DRILLS.find(x => x.id === "vb-setting")!;
    const related = relatedForPublic(d, 3);
    expect(related.length).toBe(1);
    expect(related[0].sport).toBe("Volleyball");
  });

  it("returns no duplicates", () => {
    for (const d of DRILLS) {
      const ids = relatedForPublic(d, 3).map(r => r.id);
      expect(new Set(ids).size, d.id).toBe(ids.length);
    }
  });

  it("gives every drill at least one way onward", () => {
    for (const d of DRILLS) expect(relatedForPublic(d, 3).length, d.id).toBeGreaterThan(0);
  });
});

describe("sportSlug", () => {
  it("lowercases the display name", () => {
    expect(sportSlug("Basketball")).toBe("basketball");
    expect(sportSlug("Softball")).toBe("softball");
  });
});

describe("library totals", () => {
  it("computes every count from the data", () => {
    const t = libraryTotals();
    expect(t.drills).toBe(DRILLS.length);
    expect(t.sports).toBe(new Set(DRILLS.map(d => d.sport)).size);
    expect(t.steps).toBe(DRILLS.reduce((n, d) => n + (d.steps?.length ?? 0), 0));
    expect(t.mistakes).toBe(DRILLS.reduce((n, d) => n + (d.mistakes?.length ?? 0), 0));
  });

  it("splits cleanly by sport, with nothing lost or double-counted", () => {
    const perSport = sportsWithDrills().map(s => libraryTotals(drillsInSport(s)));
    expect(perSport.reduce((n, t) => n + t.drills, 0)).toBe(DRILLS.length);
    expect(perSport.reduce((n, t) => n + t.steps, 0)).toBe(libraryTotals().steps);
  });
});

describe("sport hub copy", () => {
  it("lands in the 60-90 word band for every sport", () => {
    for (const s of sportsWithDrills()) {
      const w = wordCount(sportTldr(s));
      expect(w, `${s}: ${w} words — "${sportTldr(s)}"`).toBeGreaterThanOrEqual(60);
      expect(w, `${s}: ${w} words`).toBeLessThanOrEqual(90);
    }
  });

  it("states the real drill count for the sport", () => {
    for (const s of sportsWithDrills()) {
      expect(sportTldr(s), s).toContain(`${drillsInSport(s).length} free ${s.toLowerCase()}`);
    }
  });

  it("discloses AI generation on every hub", () => {
    for (const s of sportsWithDrills()) expect(sportTldr(s), s).toContain("AI-generated");
  });

  it("keeps hub titles and descriptions within budget", () => {
    for (const s of sportsWithDrills()) {
      expect(sportTitle(s).length + " - KoachMe".length, s).toBeLessThanOrEqual(MAX_TITLE_LEN);
      expect(sportDescription(s).length, `${s}: "${sportDescription(s)}"`).toBeLessThanOrEqual(MAX_DESCRIPTION_LEN);
    }
  });

  it("uses the right preposition for each kind of space", () => {
    const soccer = sportTldr("Soccer");
    expect(soccer).toMatch(/on a field/);
    expect(soccer).not.toMatch(/in a field/);
  });

  it("never emits a placeholder", () => {
    for (const s of sportsWithDrills()) {
      expect(sportTldr(s), s).not.toMatch(/undefined|null|NaN|\s,|,\./);
    }
  });
});

describe("library index copy", () => {
  it("lands in the 60-90 word band", () => {
    const w = wordCount(libraryTldr());
    expect(w, `${w} words — "${libraryTldr()}"`).toBeGreaterThanOrEqual(60);
    expect(w).toBeLessThanOrEqual(90);
  });

  it("states real totals and names every sport that has drills", () => {
    const t = libraryTotals();
    const text = libraryTldr();
    expect(text).toContain(`${t.drills} free drills across ${t.sports} sports`);
    expect(text).toContain(`${t.steps} numbered steps`);
    for (const s of sportsWithDrills()) expect(text, s).toContain(s.toLowerCase());
  });

  it("says the coaches are AI characters, not real people", () => {
    expect(libraryTldr()).toMatch(/AI characters rather than real people/);
  });
});

describe("humanListOr", () => {
  it("joins alternatives with or", () => {
    expect(humanListOr(["a", "b", "c"])).toBe("a, b or c");
    expect(humanListOr(["a"])).toBe("a");
    expect(humanListOr([])).toBe("");
  });
});
