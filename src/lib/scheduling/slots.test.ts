import { describe, expect, it } from "vitest";
import {
  deriveSlots, isDerivableSlot, zonedTimeToUtc, zonedParts,
  type AvailabilityWindow,
} from "./slots";

// Fixed reference: Tuesday 2026-07-28 14:00 UTC = 10:00 EDT (UTC-4).
const NOW = new Date("2026-07-28T14:00:00.000Z");

const monWindow: AvailabilityWindow = {
  id: "w-mon", weekday: 1, startMinute: 540, endMinute: 720, // Mon 9:00-12:00
  mode: "in_person", locationNote: "Tropical Park, field 3", active: true,
};
const satWindow: AvailabilityWindow = {
  id: "w-sat", weekday: 6, startMinute: 600, endMinute: 780, // Sat 10:00-13:00
  mode: "live_online", active: true,
};

describe("zonedTimeToUtc", () => {
  it("maps EDT wall-clock to UTC (summer, UTC-4)", () => {
    expect(zonedTimeToUtc(2026, 7, 28, 600).toISOString()).toBe("2026-07-28T14:00:00.000Z");
  });
  it("maps EST wall-clock to UTC (winter, UTC-5)", () => {
    expect(zonedTimeToUtc(2026, 1, 12, 600).toISOString()).toBe("2026-01-12T15:00:00.000Z");
  });
  it("handles the spring-forward day sanely", () => {
    // US DST starts 2026-03-08; 10:00 local that day is EDT (UTC-4).
    expect(zonedTimeToUtc(2026, 3, 8, 600).toISOString()).toBe("2026-03-08T14:00:00.000Z");
  });
});

describe("zonedParts", () => {
  it("reads the coach-local weekday", () => {
    // 2026-08-01 03:00 UTC is still Fri Jul 31 23:00 in New York.
    const p = zonedParts(new Date("2026-08-01T03:00:00.000Z"));
    expect(p.day).toBe(31);
    expect(p.weekday).toBe(5);
  });
});

describe("deriveSlots", () => {
  it("derives hourly slots inside windows over the horizon", () => {
    const slots = deriveSlots({ windows: [monWindow, satWindow], busy: [], now: NOW });
    // 14-day horizon from Tue Jul 28: Sat Aug 1, Mon Aug 3, Sat Aug 8, Mon Aug 10.
    const mondays = slots.filter(s => s.mode === "in_person");
    const saturdays = slots.filter(s => s.mode === "live_online");
    expect(mondays.length).toBe(6);   // 2 Mondays x 3 slots (9,10,11)
    expect(saturdays.length).toBe(6); // 2 Saturdays x 3 slots (10,11,12)
    expect(slots[0].startIso).toBe(zonedTimeToUtc(2026, 8, 1, 600).toISOString());
  });

  it("carries the window's location note and mode onto slots", () => {
    const slots = deriveSlots({ windows: [monWindow], busy: [], now: NOW });
    expect(slots[0].locationNote).toBe("Tropical Park, field 3");
    expect(slots[0].mode).toBe("in_person");
  });

  it("skips inactive windows", () => {
    const slots = deriveSlots({ windows: [{ ...monWindow, active: false }], busy: [], now: NOW });
    expect(slots).toHaveLength(0);
  });

  it("removes slots that conflict with busy sessions", () => {
    const mon10 = zonedTimeToUtc(2026, 8, 3, 600).toISOString(); // Mon Aug 3, 10:00 ET
    const slots = deriveSlots({
      windows: [monWindow],
      busy: [{ startIso: mon10, durationMin: 60 }],
      now: NOW,
    });
    expect(slots.some(s => s.startIso === mon10)).toBe(false);
    // 9:00 and 11:00 that day survive.
    expect(slots.some(s => s.startIso === zonedTimeToUtc(2026, 8, 3, 540).toISOString())).toBe(true);
    expect(slots.some(s => s.startIso === zonedTimeToUtc(2026, 8, 3, 660).toISOString())).toBe(true);
  });

  it("removes partial overlaps, not just exact matches", () => {
    // A 90-minute busy block starting 9:30 kills both the 9:00 and 10:00 slots.
    const busyStart = zonedTimeToUtc(2026, 8, 3, 570).toISOString();
    const slots = deriveSlots({
      windows: [monWindow],
      busy: [{ startIso: busyStart, durationMin: 90 }],
      now: NOW,
    });
    const day = slots.filter(s => s.startIso.startsWith("2026-08-03"));
    expect(day).toHaveLength(1); // only 11:00 remains
  });

  it("enforces the minimum lead time", () => {
    // Window on Tuesday (today), 10:00-13:00 ET; now is 10:00 ET.
    const tueWindow: AvailabilityWindow = {
      id: "w-tue", weekday: 2, startMinute: 600, endMinute: 780, mode: "in_person", active: true,
    };
    const slots = deriveSlots({ windows: [tueWindow], busy: [], now: NOW, days: 1, minLeadMinutes: 120 });
    // 10:00 and 11:00 are within lead; only 12:00 qualifies.
    expect(slots).toHaveLength(1);
    expect(slots[0].startIso).toBe(zonedTimeToUtc(2026, 7, 28, 720).toISOString());
  });

  it("respects slot length when stepping windows", () => {
    const slots = deriveSlots({
      windows: [{ ...monWindow, startMinute: 540, endMinute: 630 }], // 9:00-10:30
      busy: [], now: NOW,
    });
    // Only 9:00 fits a 60-minute slot inside 90 minutes.
    const perDay = slots.filter(s => s.startIso.startsWith("2026-08-03"));
    expect(perDay).toHaveLength(1);
  });

  it("returns sorted slots", () => {
    const slots = deriveSlots({ windows: [monWindow, satWindow], busy: [], now: NOW });
    const sorted = [...slots].sort((a, b) => a.startIso.localeCompare(b.startIso));
    expect(slots).toEqual(sorted);
  });

  it("crosses the fall-back DST boundary at stable wall-clock times", () => {
    // US DST ends Sun 2026-11-01. A Sunday 10:00 window before and after
    // the switch stays 10:00 local: 14:00Z before, 15:00Z after.
    const sunWindow: AvailabilityWindow = {
      id: "w-sun", weekday: 0, startMinute: 600, endMinute: 660, mode: "async", active: true,
    };
    const nearSwitch = new Date("2026-10-26T12:00:00.000Z"); // Mon before
    const slots = deriveSlots({ windows: [sunWindow], busy: [], now: nearSwitch, days: 14 });
    expect(slots.some(s => s.startIso === "2026-11-01T15:00:00.000Z")).toBe(true);
    expect(slots.some(s => s.startIso === "2026-11-08T15:00:00.000Z")).toBe(true);
  });
});

describe("isDerivableSlot", () => {
  const opts = { windows: [monWindow], busy: [], now: NOW };
  it("accepts an exact derivable slot", () => {
    const mon9 = zonedTimeToUtc(2026, 8, 3, 540).toISOString();
    expect(isDerivableSlot(mon9, "in_person", opts)).toBe(true);
  });
  it("rejects a time outside any window", () => {
    const mon14 = zonedTimeToUtc(2026, 8, 3, 840).toISOString();
    expect(isDerivableSlot(mon14, "in_person", opts)).toBe(false);
  });
  it("rejects a mode mismatch", () => {
    const mon9 = zonedTimeToUtc(2026, 8, 3, 540).toISOString();
    expect(isDerivableSlot(mon9, "live_online", opts)).toBe(false);
  });
  it("rejects a taken slot", () => {
    const mon9 = zonedTimeToUtc(2026, 8, 3, 540).toISOString();
    expect(isDerivableSlot(mon9, "in_person", { ...opts, busy: [{ startIso: mon9, durationMin: 60 }] })).toBe(false);
  });
});
