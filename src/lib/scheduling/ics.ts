// Minimal, valid iCalendar generation for session "Add to calendar".
// No email anywhere: the athlete's family downloads a file and their
// own calendar app takes it from there.

function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function icsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export interface IcsSession {
  id: string;
  title: string;
  startsAt: string;      // UTC ISO
  durationMin: number;
  locationNote?: string | null;
  description: string;
}

export function buildIcs(s: IcsSession): string {
  const start = new Date(s.startsAt);
  const end = new Date(start.getTime() + s.durationMin * 60000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KoachMe//Sessions//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:coachme-session-${s.id}@coachme`,
    `DTSTAMP:${icsUtc(new Date())}`,
    `DTSTART:${icsUtc(start)}`,
    `DTEND:${icsUtc(end)}`,
    `SUMMARY:${icsEscape(s.title)}`,
    ...(s.locationNote ? [`LOCATION:${icsEscape(s.locationNote)}`] : []),
    `DESCRIPTION:${icsEscape(s.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  // RFC 5545 requires CRLF line endings.
  return lines.join("\r\n") + "\r\n";
}
