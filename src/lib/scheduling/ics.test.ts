import { describe, expect, it } from "vitest";
import { buildIcs } from "./ics";

describe("buildIcs", () => {
  const ics = buildIcs({
    id: "abc-123",
    title: "Training with Coach Sam",
    startsAt: "2026-08-01T14:00:00.000Z",
    durationMin: 60,
    locationNote: "Tropical Park, field 3",
    description: "Tell your parent or guardian about this session.",
  });

  it("is a structurally valid VCALENDAR", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
    expect(ics.split("\r\n").length).toBeGreaterThan(10);
  });

  it("carries times in UTC basic format", () => {
    expect(ics).toContain("DTSTART:20260801T140000Z");
    expect(ics).toContain("DTEND:20260801T150000Z");
  });

  it("escapes commas in text fields", () => {
    expect(ics).toContain("LOCATION:Tropical Park\\, field 3");
  });

  it("includes uid, summary, and the safety description", () => {
    expect(ics).toContain("UID:coachme-session-abc-123@coachme");
    expect(ics).toContain("SUMMARY:Training with Coach Sam");
    expect(ics).toContain("DESCRIPTION:Tell your parent or guardian");
  });
});
