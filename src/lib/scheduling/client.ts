/* ============================================================================
   Client layer for booking, following the app's established local-first
   architecture (same as threads/messages): every read merges the server
   into a localStorage mirror, every write goes to the server first and
   falls back to the mirror when the cloud is unreachable or the
   migration is not applied yet. On a single device (the app's original
   demo mode) the whole request->accept->session flow works offline; on
   cloud-connected devices the server is the source of truth and the
   anti-double-booking checks are enforced there.

   Identity keys are 3-word codes (the app's universal cross-layer id).
   Local rows get "loc-" ids; server rows keep their uuids and win merges.
   ============================================================================ */

import {
  deriveSlots, type AvailabilityWindow, type DerivedSlot, type SessionMode,
} from "./slots";

const K = {
  availability: "coachme_availability",      // Record<coachCode, AvailabilityWindow[]>
  requests: "coachme_session_requests",      // BookingRequest[]
  sessions: "coachme_sessions",              // BookingSession[]
};

export interface BookingRequest {
  id: string;
  athleteCode: string;
  athleteName: string;
  coachCode: string;
  coachName: string;
  startIso: string;
  durationMin: number;
  mode: SessionMode;
  locationNote: string | null;
  note: string | null;
  status: "pending" | "accepted" | "declined" | "cancelled_by_athlete" | "cancelled_by_coach";
  declineReason: string | null;
  createdAt: number;
}

export interface BookingSession {
  id: string;
  requestId: string | null;
  athleteCode: string;
  athleteName: string;
  coachCode: string;
  coachName: string;
  startIso: string;
  durationMin: number;
  mode: SessionMode;
  locationNote: string | null;
  status: "scheduled" | "completed" | "no_show" | "cancelled";
  cancelReason: string | null;
}

/* ------------------------------ storage ------------------------------ */

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : (JSON.parse(raw) as T) ?? fallback;
  } catch { return fallback; }
}
function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* full */ }
}

export function localWindows(coachCode: string): AvailabilityWindow[] {
  const all = read<Record<string, AvailabilityWindow[]>>(K.availability, {});
  return all[coachCode] ?? [];
}
function writeWindows(coachCode: string, windows: AvailabilityWindow[]): void {
  const all = read<Record<string, AvailabilityWindow[]>>(K.availability, {});
  all[coachCode] = windows;
  write(K.availability, all);
}
export function localRequests(): BookingRequest[] {
  return read<BookingRequest[]>(K.requests, []);
}
function writeRequests(rows: BookingRequest[]): void { write(K.requests, rows); }
export function localSessions(): BookingSession[] {
  return read<BookingSession[]>(K.sessions, []);
}
function writeSessions(rows: BookingSession[]): void { write(K.sessions, rows); }

function upsert<T extends { id: string }>(rows: T[], row: T): T[] {
  const i = rows.findIndex(r => r.id === row.id);
  if (i >= 0) rows[i] = { ...rows[i], ...row };
  else rows.push(row);
  return rows;
}

/* ------------------------------- fetch ------------------------------- */

class Unreachable extends Error {}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch { throw new Unreachable(); }
  if (res.status === 503) throw new Unreachable();
  let payload: Record<string, unknown> = {};
  try { payload = await res.json(); } catch { /* empty */ }
  if (!res.ok) {
    const err = new Error(String(payload.message ?? payload.error ?? "error")) as Error & { code?: string; status?: number };
    err.code = String(payload.error ?? "error");
    err.status = res.status;
    throw err;
  }
  return payload as T;
}

export type BookingResult<T> =
  | { ok: true; local: boolean; value: T }
  | { ok: false; code: string; message: string };

function refusal(err: unknown): { code: string; message: string } {
  const e = err as { code?: string; message?: string };
  return {
    code: e.code ?? "error",
    message: e.message || "Something went wrong. Please try again.",
  };
}

/* ---------------------------- availability ---------------------------- */

export async function fetchWindows(coachCode: string): Promise<AvailabilityWindow[]> {
  try {
    const res = await api<{ windows: AvailabilityWindow[] }>(`/availability?coachCode=${encodeURIComponent(coachCode)}`);
    writeWindows(coachCode, res.windows);
    return res.windows;
  } catch {
    return localWindows(coachCode);
  }
}

export async function saveWindow(
  coachCode: string,
  w: Omit<AvailabilityWindow, "id"> & { id?: string },
): Promise<BookingResult<AvailabilityWindow>> {
  try {
    const res = await api<{ window: AvailabilityWindow }>("/availability", {
      method: "POST", body: JSON.stringify({ coachCode, ...w }),
    });
    writeWindows(coachCode, upsert(localWindows(coachCode), res.window));
    return { ok: true, local: false, value: res.window };
  } catch (err) {
    if (!(err instanceof Unreachable)) return { ok: false, ...refusal(err) };
    const row: AvailabilityWindow = { id: w.id ?? `loc-${Date.now()}`, ...w, active: w.active !== false };
    writeWindows(coachCode, upsert(localWindows(coachCode), row));
    return { ok: true, local: true, value: row };
  }
}

export async function removeWindow(coachCode: string, id: string): Promise<void> {
  writeWindows(coachCode, localWindows(coachCode).filter(w => w.id !== id));
  try {
    await api("/availability", { method: "DELETE", body: JSON.stringify({ coachCode, id }) });
  } catch { /* mirror already updated; server row goes when cloud returns via next save-fetch cycle */ }
}

/* ------------------------------- slots ------------------------------- */

export interface SlotsResponse {
  bookable: boolean;
  reason: "ok" | "unverified" | "banned" | "no_windows" | "blocked";
  slots: DerivedSlot[];
  local: boolean;
}

/** Derived slots for a coach, server-first. Local fallback derives from
 *  the mirror so the single-device flow works offline; the server
 *  re-validates everything at request time regardless. */
export async function fetchSlots(coachCode: string, athleteCode?: string): Promise<SlotsResponse> {
  try {
    const q = athleteCode ? `&athleteCode=${encodeURIComponent(athleteCode)}` : "";
    const res = await api<Omit<SlotsResponse, "local">>(`/sessions/slots?coachCode=${encodeURIComponent(coachCode)}${q}`);
    return { ...res, local: false };
  } catch {
    const windows = localWindows(coachCode);
    const busy = localSessions()
      .filter(s => s.coachCode === coachCode && s.status === "scheduled")
      .map(s => ({ startIso: s.startIso, durationMin: s.durationMin }));
    const slots = deriveSlots({ windows, busy, now: new Date() });
    return {
      bookable: windows.length > 0,
      reason: windows.length > 0 ? "ok" : "no_windows",
      slots,
      local: true,
    };
  }
}

/* ------------------------------ requests ------------------------------ */

export async function createRequest(params: {
  athleteCode: string; athleteName: string;
  coachCode: string; coachName: string;
  startIso: string; durationMin: number; mode: SessionMode;
  locationNote: string | null; note: string | null;
}): Promise<BookingResult<BookingRequest>> {
  try {
    const res = await api<{ request: { id: string } }>("/sessions/requests", {
      method: "POST",
      body: JSON.stringify({
        athleteCode: params.athleteCode, coachCode: params.coachCode,
        startIso: params.startIso, durationMin: params.durationMin,
        mode: params.mode, note: params.note,
      }),
    });
    const row: BookingRequest = {
      id: res.request.id, ...params,
      status: "pending", declineReason: null, createdAt: Date.now(),
    };
    writeRequests(upsert(localRequests(), row));
    return { ok: true, local: false, value: row };
  } catch (err) {
    if (!(err instanceof Unreachable)) return { ok: false, ...refusal(err) };
    // Local-first fallback: same anti-spam rule as the server.
    const mine = localRequests().filter(r =>
      r.athleteCode === params.athleteCode && r.coachCode === params.coachCode && r.status === "pending");
    if (mine.length >= 3) {
      return { ok: false, code: "too_many_pending", message: "You already have 3 requests waiting for this coach. Give them a moment to reply." };
    }
    const row: BookingRequest = {
      id: `loc-${Date.now()}`, ...params,
      status: "pending", declineReason: null, createdAt: Date.now(),
    };
    writeRequests(upsert(localRequests(), row));
    return { ok: true, local: true, value: row };
  }
}

export async function cancelRequest(athleteCode: string, requestId: string): Promise<void> {
  const rows = localRequests();
  const row = rows.find(r => r.id === requestId);
  if (row && row.status === "pending") {
    row.status = "cancelled_by_athlete";
    writeRequests(rows);
  }
  try {
    await api("/sessions/requests/cancel", {
      method: "POST", body: JSON.stringify({ athleteCode, requestId }),
    });
  } catch { /* mirror already reflects it */ }
}

export async function respondRequest(params: {
  coachCode: string; requestId: string;
  action: "accept" | "decline"; reason?: string | null;
}): Promise<BookingResult<{ session: BookingSession | null }>> {
  try {
    const res = await api<{ request: { status: string }; session: { id: string; starts_at?: string } | null }>(
      "/sessions/requests/respond",
      { method: "POST", body: JSON.stringify(params) },
    );
    // Refresh mirrors from the local row we already hold.
    const rows = localRequests();
    const row = rows.find(r => r.id === params.requestId);
    if (row) {
      row.status = params.action === "accept" ? "accepted" : "declined";
      row.declineReason = params.action === "decline" ? (params.reason ?? null) : null;
      writeRequests(rows);
      if (params.action === "accept" && res.session) {
        const session: BookingSession = {
          id: res.session.id, requestId: row.id,
          athleteCode: row.athleteCode, athleteName: row.athleteName,
          coachCode: row.coachCode, coachName: row.coachName,
          startIso: row.startIso, durationMin: row.durationMin,
          mode: row.mode, locationNote: row.locationNote,
          status: "scheduled", cancelReason: null,
        };
        writeSessions(upsert(localSessions(), session));
        return { ok: true, local: false, value: { session } };
      }
    }
    return { ok: true, local: false, value: { session: null } };
  } catch (err) {
    if (!(err instanceof Unreachable)) return { ok: false, ...refusal(err) };
    // Local fallback: mutate mirrors with the same rules as the server.
    const rows = localRequests();
    const row = rows.find(r => r.id === params.requestId);
    if (!row || row.status !== "pending") {
      return { ok: false, code: "not_pending", message: "This request was already handled." };
    }
    if (params.action === "decline") {
      row.status = "declined";
      row.declineReason = params.reason ?? null;
      writeRequests(rows);
      return { ok: true, local: true, value: { session: null } };
    }
    row.status = "accepted";
    // Same-slot pendings for this coach are declined as slot_taken.
    for (const other of rows) {
      if (other.id !== row.id && other.coachCode === row.coachCode &&
          other.status === "pending" && other.startIso === row.startIso) {
        other.status = "declined";
        other.declineReason = "slot_taken";
      }
    }
    writeRequests(rows);
    const session: BookingSession = {
      id: `loc-${Date.now()}`, requestId: row.id,
      athleteCode: row.athleteCode, athleteName: row.athleteName,
      coachCode: row.coachCode, coachName: row.coachName,
      startIso: row.startIso, durationMin: row.durationMin,
      mode: row.mode, locationNote: row.locationNote,
      status: "scheduled", cancelReason: null,
    };
    writeSessions(upsert(localSessions(), session));
    return { ok: true, local: true, value: { session } };
  }
}

export async function updateSession(params: {
  coachCode: string; sessionId: string;
  action: "cancel" | "complete" | "no_show"; reason?: string | null;
}): Promise<BookingResult<null>> {
  const apply = () => {
    const rows = localSessions();
    const row = rows.find(s => s.id === params.sessionId);
    if (row) {
      row.status = params.action === "cancel" ? "cancelled" : params.action === "complete" ? "completed" : "no_show";
      row.cancelReason = params.action === "cancel" ? (params.reason ?? null) : null;
      writeSessions(rows);
    }
  };
  try {
    await api("/sessions/update", { method: "POST", body: JSON.stringify(params) });
    apply();
    return { ok: true, local: false, value: null };
  } catch (err) {
    if (!(err instanceof Unreachable)) return { ok: false, ...refusal(err) };
    if (params.action === "no_show") {
      const row = localSessions().find(s => s.id === params.sessionId);
      if (row && new Date(row.startIso).getTime() > Date.now()) {
        return { ok: false, code: "too_early", message: "You can mark a no-show after the session start time." };
      }
    }
    apply();
    return { ok: true, local: true, value: null };
  }
}

/* ------------------------------- reads ------------------------------- */

interface ServerRequestRow {
  id: string; requested_start: string; duration_min: number; mode: SessionMode;
  note: string | null; status: BookingRequest["status"]; decline_reason: string | null;
  created_at: string;
  athlete: { code: string; first_name: string; last_name: string } | null;
  coach: { code: string; first_name: string; last_name: string } | null;
  location_note?: string | null;
}
interface ServerSessionRow {
  id: string; request_id: string | null; starts_at: string; duration_min: number;
  mode: SessionMode; location_note: string | null; status: BookingSession["status"];
  cancel_reason: string | null;
  athlete: { code: string; first_name: string; last_name: string } | null;
  coach: { code: string; first_name: string; last_name: string } | null;
}

const personName = (p: { first_name: string; last_name: string } | null) =>
  p ? `${p.first_name} ${p.last_name}`.trim() : "";

export async function fetchRequests(code: string): Promise<BookingRequest[]> {
  try {
    const res = await api<{ requests: ServerRequestRow[] }>(`/sessions/requests?code=${encodeURIComponent(code)}`);
    let rows = localRequests();
    for (const r of res.requests) {
      // Server request rows carry no location note (it lives on the
      // window/session); keep the one the device saw at request time.
      const existing = rows.find(x => x.id === r.id);
      rows = upsert(rows, {
        id: r.id,
        athleteCode: r.athlete?.code ?? "", athleteName: personName(r.athlete),
        coachCode: r.coach?.code ?? "", coachName: personName(r.coach),
        startIso: r.requested_start, durationMin: r.duration_min, mode: r.mode,
        locationNote: r.location_note ?? existing?.locationNote ?? null, note: r.note,
        status: r.status, declineReason: r.decline_reason,
        createdAt: new Date(r.created_at).getTime(),
      });
    }
    writeRequests(rows);
    return rows;
  } catch {
    return localRequests();
  }
}

export async function fetchSessions(code: string): Promise<BookingSession[]> {
  try {
    const res = await api<{ sessions: ServerSessionRow[] }>(`/sessions?code=${encodeURIComponent(code)}`);
    let rows = localSessions();
    for (const s of res.sessions) {
      rows = upsert(rows, {
        id: s.id, requestId: s.request_id,
        athleteCode: s.athlete?.code ?? "", athleteName: personName(s.athlete),
        coachCode: s.coach?.code ?? "", coachName: personName(s.coach),
        startIso: s.starts_at, durationMin: s.duration_min, mode: s.mode,
        locationNote: s.location_note, status: s.status, cancelReason: s.cancel_reason,
      });
    }
    writeSessions(rows);
    return rows;
  } catch {
    return localSessions();
  }
}
