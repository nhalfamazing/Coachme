import { describe, it, expect } from "vitest";
import { DRILLS } from "./drills";
import { drillsInSport, sportsWithDrills } from "./drill-seo";
import { collectionDates, drillDates, formatUpdated } from "./content-dates";

describe("formatUpdated", () => {
  it("renders a plain readable date", () => {
    expect(formatUpdated("2026-07-29")).toBe("29 July 2026");
    expect(formatUpdated("2026-01-01")).toBe("1 January 2026");
    expect(formatUpdated("2026-12-31")).toBe("31 December 2026");
  });

  it("does not depend on the host's locale data", () => {
    // Same commit must render the same string on a laptop and on Vercel;
    // toLocaleDateString would not guarantee that.
    const before = process.env.TZ;
    process.env.TZ = "Pacific/Kiritimati";
    expect(formatUpdated("2026-07-29")).toBe("29 July 2026");
    process.env.TZ = before;
  });

  it("renders nothing rather than 'Invalid Date'", () => {
    for (const bad of ["", "not-a-date", "2026-7-9", "2026-13-01", "2026-07-32", null, undefined]) {
      expect(formatUpdated(bad as string), String(bad)).toBeNull();
    }
  });
});

describe("drillDates", () => {
  it("uses the human-written addedAt, never a build timestamp", () => {
    for (const d of DRILLS) {
      const { published, modified } = drillDates(d);
      expect(published, d.id).toBe(d.addedAt);
      expect(modified, d.id).toBe(d.addedAt);
    }
  });

  it("never claims a page changed after it was published", () => {
    for (const d of DRILLS) {
      const { published, modified } = drillDates(d);
      expect(modified >= published, d.id).toBe(true);
    }
  });
});

describe("collectionDates", () => {
  it("spans the oldest and newest drill a hub lists", () => {
    for (const sport of sportsWithDrills()) {
      const drills = drillsInSport(sport);
      const dates = collectionDates(drills)!;
      const all = drills.map(d => d.addedAt).sort();
      expect(dates.published, sport).toBe(all[0]);
      expect(dates.modified, sport).toBe(all[all.length - 1]);
      expect(dates.modified >= dates.published, sport).toBe(true);
    }
  });

  it("covers the whole library on the index", () => {
    const dates = collectionDates(DRILLS)!;
    const all = DRILLS.map(d => d.addedAt).sort();
    expect(dates.published).toBe(all[0]);
    expect(dates.modified).toBe(all[all.length - 1]);
  });

  it("returns null for an empty collection rather than inventing a date", () => {
    expect(collectionDates([])).toBeNull();
  });

  it("formats every real date it produces", () => {
    for (const sport of sportsWithDrills()) {
      const d = collectionDates(drillsInSport(sport))!;
      expect(formatUpdated(d.modified), sport).toMatch(/^\d{1,2} [A-Z][a-z]+ \d{4}$/);
    }
  });
});
