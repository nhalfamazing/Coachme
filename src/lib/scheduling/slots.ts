/* ============================================================================
   Slot derivation: recurring weekly availability windows -> concrete
   bookable start times.

   TIMEZONE ASSUMPTIONS (documented, deliberate for this phase):
   - Coach windows are minutes-from-midnight in the coach's local zone,
     assumed America/New_York (launch market is Miami). COACH_TZ is the
     single constant to change when per-coach zones arrive.
   - Concrete instants (requests, sessions) are stored as UTC ISO
     strings and rendered in the viewer's browser-local time.
   - DST is handled by computing the zone offset per date via Intl (the
     two-pass correction below); a window that spans a DST switch day
     yields slots at the wall-clock times a person would expect.

   Pure functions only: no storage, no fetch. Unit tests in
   slots.test.ts are the spec.
   ============================================================================ */

export const COACH_TZ = "America/New_York";

export type SessionMode = "in_person" | "live_online" | "async";

export interface AvailabilityWindow {
  id: string;
  weekday: number;        // 0 = Sunday ... 6 = Saturday (coach-local)
  startMinute: number;    // minutes from midnight, coach-local
  endMinute: number;      // exclusive
  mode: SessionMode;
  locationNote?: string | null;
  active?: boolean;
}

export interface BusyInterval {
  startIso: string;
  durationMin: number;
}

export interface DerivedSlot {
  startIso: string;       // UTC instant
  durationMin: number;
  mode: SessionMode;
  locationNote: string | null;
}

/** Zone offset (minutes east of UTC) for an instant, via Intl. */
function tzOffsetMinutes(utcDate: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(utcDate)) parts[p.type] = p.value;
  const asUtc = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour) % 24, Number(parts.minute), Number(parts.second),
  );
  return (asUtc - utcDate.getTime()) / 60000;
}

/** The UTC instant of (year, month, day, minuteOfDay) wall-clock time in
 *  timeZone. Two-pass offset correction handles DST transition days. */
export function zonedTimeToUtc(
  year: number, month: number, day: number, minuteOfDay: number,
  timeZone: string = COACH_TZ,
): Date {
  const wallUtc = Date.UTC(year, month - 1, day, 0, minuteOfDay);
  let guess = new Date(wallUtc);
  for (let i = 0; i < 2; i++) {
    const offset = tzOffsetMinutes(guess, timeZone);
    guess = new Date(wallUtc - offset * 60000);
  }
  return guess;
}

/** Calendar date + weekday of an instant, as seen in timeZone. */
export function zonedParts(date: Date, timeZone: string = COACH_TZ): {
  year: number; month: number; day: number; weekday: number;
} {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) parts[p.type] = p.value;
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: weekdays.indexOf(parts.weekday),
  };
}

export function intervalsOverlap(
  aStartMs: number, aEndMs: number, bStartMs: number, bEndMs: number,
): boolean {
  return aStartMs < bEndMs && bStartMs < aEndMs;
}

export interface DeriveOptions {
  windows: AvailabilityWindow[];
  busy: BusyInterval[];
  now: Date;
  days?: number;          // horizon, default 14
  slotMinutes?: number;   // slot length and step, default 60
  minLeadMinutes?: number;// no last-second bookings, default 120
  timeZone?: string;
}

/** All bookable start times in the horizon: active windows, minus busy
 *  conflicts, minus anything sooner than the lead time. Sorted. */
export function deriveSlots(opts: DeriveOptions): DerivedSlot[] {
  const {
    windows, busy, now,
    days = 14, slotMinutes = 60, minLeadMinutes = 120,
    timeZone = COACH_TZ,
  } = opts;

  const active = windows.filter(w => w.active !== false);
  if (active.length === 0) return [];

  const busyMs = busy.map(b => {
    const start = new Date(b.startIso).getTime();
    return { start, end: start + b.durationMin * 60000 };
  });
  const earliest = now.getTime() + minLeadMinutes * 60000;

  // Anchor each horizon day at coach-local noon so DST shifts can't
  // slip a day, then read its coach-local calendar date.
  const startParts = zonedParts(now, timeZone);
  const noonAnchor = zonedTimeToUtc(startParts.year, startParts.month, startParts.day, 720, timeZone);

  const slots: DerivedSlot[] = [];
  for (let i = 0; i < days; i++) {
    const dayParts = zonedParts(new Date(noonAnchor.getTime() + i * 86400000), timeZone);
    for (const w of active) {
      if (w.weekday !== dayParts.weekday) continue;
      for (let m = w.startMinute; m + slotMinutes <= w.endMinute; m += slotMinutes) {
        const start = zonedTimeToUtc(dayParts.year, dayParts.month, dayParts.day, m, timeZone);
        const startMs = start.getTime();
        const endMs = startMs + slotMinutes * 60000;
        if (startMs < earliest) continue;
        if (busyMs.some(b => intervalsOverlap(startMs, endMs, b.start, b.end))) continue;
        slots.push({
          startIso: start.toISOString(),
          durationMin: slotMinutes,
          mode: w.mode,
          locationNote: w.locationNote ?? null,
        });
      }
    }
  }
  slots.sort((a, b) => a.startIso.localeCompare(b.startIso));
  return slots;
}

/** True when a requested instant is one of the currently derivable
 *  slots (same start, mode). The strictest honest validation: it
 *  re-enforces lead time and conflicts for free. */
export function isDerivableSlot(
  startIso: string, mode: SessionMode, opts: DeriveOptions,
): boolean {
  const want = new Date(startIso).getTime();
  return deriveSlots(opts).some(
    s => new Date(s.startIso).getTime() === want && s.mode === mode,
  );
}
