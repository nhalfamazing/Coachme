/* Client sync layer: the prototype pages call these typed functions
   instead of talking to any database directly. Every function
   1. tries the Next.js API (server routes hold the service role key —
      this file must NEVER import supabase-js or see that key),
   2. on success writes through to the SAME localStorage keys and shapes
      the UI already reads, so page code stays unchanged,
   3. on network failure or 503 {cloud:'disabled'} falls back to
      localStorage and queues writes in 'coachme_pending_sync' for retry
      on next load (flushPendingSync).

   Server rows are snake_case; the app's shapes are the historical
   localStorage ones. The mappers below are the single place that
   translation lives. App-land ids stay the legacy deterministic ids
   (profiles.legacy_id) so existing thread keys, workout keys, and
   authorId checks keep working. */

/* ----------------------------- types ----------------------------- */

export type Role = "athlete" | "coach";

export interface ProfileRow {
  id: string;
  legacy_id: string | null;
  role: Role;
  code: string;
  first_name: string;
  last_name: string;
  sport: string | null;
  position: string | null;
  specialty: string | null;
  age: number | null;
  years_pro: number | null;
  years_coaching: number | null;
  city: string | null;
  state: string | null;
  rate_cents: number | null;
  modes: string[] | null;
  background: string | null;
  verification_status: "pending" | "verified" | "rejected";
  created_at: string;
  pending?: boolean;
}

interface MessageRow {
  id: string;
  thread_id: string;
  sender_role: Role;
  sender_id: string;
  body: string;
  created_at: string;
}

interface ThreadDto {
  thread: { id: string; legacy_key: string | null; athlete_id: string; coach_id: string; created_at: string };
  athlete: ProfileRow | null;
  coach: ProfileRow | null;
  messages: MessageRow[];
}

interface WorkoutRow {
  id: string;
  athlete_id: string;
  type: string;
  duration_min: number | null;
  intensity: number | null;
  notes: string | null;
  performed_at: string;
  created_at: string;
}

interface PostDto {
  post: { id: string; author_id: string; body: string; created_at: string };
  author: ProfileRow | null;
  likes: number;
  likedByViewer: boolean;
}

/** The app's historical athlete shape (localStorage / props). */
export interface AppAthlete {
  id: number | string;
  code?: string | null;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  initials: string;
  sport: string;
  position?: string;
  age?: number | null;
  city?: string;
  state?: string | null;
  location?: string | null;
  banner?: string | null;
  photo?: string | null;
  stats?: unknown[];
  level?: number;
  xp?: number;
  xpMax?: number;
  registeredAt?: number;
  serverPending?: boolean;
}

/** The app's historical coach shape. */
export interface AppCoach {
  id: number | string;
  code?: string | null;
  name: string;
  initials: string;
  photo?: string | null;
  cover?: string | null;
  title?: string;
  sport: string;
  years?: number | null;
  specialty?: string;
  location?: string;
  rate?: number | null;
  rating?: number | null;
  reviews?: number;
  athletes?: number;
  avgGain?: string | null;
  commits?: number;
  modes?: string[];
  badge?: string;
  bio?: string;
  color?: string;
  verified?: boolean;
  pending?: boolean;
}

export interface AppMessage { id: number | string; from: "athlete" | "coach"; text: string; ts: number }

export interface AppThread {
  id: string; // `${athleteId}::${coachId}` legacy key — the UI's thread id
  serverId?: string; // server uuid, used to send messages
  coachId: number | string;
  coachName: string;
  athlete: AppAthlete;
  messages: AppMessage[];
  updatedAt: number;
}

export interface AppWorkout {
  id: number | string;
  date: string;
  type: string;
  duration?: number | null;
  intensity?: number | null;
  notes?: string | null;
}

export interface AppPost {
  id: number | string;
  authorId?: number | string;
  author: { name: string; initials: string; sport?: string | null; position?: string | null; city?: string | null; photo?: string | null };
  text: string;
  ts: number;
  likes: number;
  liked: boolean;
}

export type LoginResult = { role: Role; athlete?: AppAthlete; coach?: AppCoach } | null;

/* --------------------------- api client -------------------------- */

/** Cloud unreachable (network down) or intentionally disabled (503). */
export class CloudUnavailableError extends Error {
  constructor(msg = "cloud unavailable") { super(msg); this.name = "CloudUnavailableError"; }
}
/** The server answered with a definite error (4xx) — do not retry. */
export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message?: string) {
    super(message || code);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new CloudUnavailableError("network failure");
  }
  if (res.status === 503) throw new CloudUnavailableError("cloud disabled");
  let payload: Record<string, unknown> = {};
  try { payload = await res.json(); } catch { /* non-JSON error body */ }
  if (!res.ok) {
    throw new ApiError(res.status, String(payload.error ?? "error"), payload.message as string | undefined);
  }
  return payload as T;
}

/* ------------------------- local storage ------------------------- */

const K = {
  athletes: "coachme_athletes",
  coaches: "coachme_coaches",
  threads: "coachme_threads",
  posts: "coachme_posts",
  queue: "coachme_pending_sync",
  workouts: (athleteAppId: number | string) => `coachme_workouts::${athleteAppId}`,
  imported: (code: string) => `coachme_imported::${code}`,
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch { return fallback; }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* full/blocked */ }
}

/* ----------------------------- mappers --------------------------- */

const COACH_COLORS = ["#FF6B3D", "#5DA9FF", "#C5FF3D", "#B17CFF", "#FF9BCD", "#FFB347"];

function stableHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** App-land id for a server row: the legacy deterministic id when we have
 *  one (all app-registered profiles do), else the row uuid. */
function appId(row: ProfileRow): number | string {
  if (row.legacy_id != null && row.legacy_id !== "") {
    const n = Number(row.legacy_id);
    return Number.isFinite(n) ? n : row.legacy_id;
  }
  return row.id;
}

export function rowToAthlete(row: ProfileRow): AppAthlete {
  const first = row.first_name || "";
  const last = row.last_name || "";
  return {
    id: appId(row),
    code: row.code,
    firstName: first || null,
    lastName: last || null,
    name: last ? `${first[0] ?? ""}. ${last}` : first,
    initials: ((first[0] ?? "") + (last[0] ?? first[1] ?? "")).toUpperCase(),
    sport: row.sport ?? "",
    position: row.position ?? "",
    age: row.age,
    city: row.city ?? "",
    state: row.state ?? null,
    location: row.city ? `${row.city}${row.state ? `, ${row.state}` : ""}` : "",
    banner: row.sport === "Baseball" ? "/banner.jpg" : null,
    photo: null,
    stats: [],
    level: 1, xp: 0, xpMax: 500,
  };
}

export function rowToCoach(row: ProfileRow): AppCoach {
  const first = row.first_name || "";
  const last = row.last_name || "";
  const name = `${first} ${last}`.trim();
  return {
    id: appId(row),
    code: row.code,
    name,
    initials: ((first[0] ?? "") + (last[0] ?? first[1] ?? "")).toUpperCase(),
    photo: null, cover: null,
    title: row.specialty ?? "",
    sport: row.sport ?? "",
    years: row.years_coaching,
    specialty: row.specialty ?? "",
    location: row.city ? `${row.city}${row.state ? `, ${row.state}` : ""}` : "",
    rate: row.rate_cents != null ? row.rate_cents / 100 : null,
    rating: null, reviews: 0, athletes: 0, avgGain: null, commits: 0,
    modes: row.modes ?? ["in_person"],
    badge: row.background || "NEW COACH",
    bio: "", // bio is not stored server-side in this phase (data minimization)
    color: COACH_COLORS[stableHash(row.code) % COACH_COLORS.length],
    verified: row.verification_status === "verified",
    pending: row.verification_status !== "verified",
  };
}

function threadDtoToRecord(dto: ThreadDto): AppThread | null {
  if (!dto.athlete || !dto.coach) return null;
  const athlete = rowToAthlete(dto.athlete);
  const coach = rowToCoach(dto.coach);
  const messages: AppMessage[] = dto.messages.map(m => ({
    id: m.id,
    from: m.sender_role,
    text: m.body,
    ts: Date.parse(m.created_at) || Date.now(),
  }));
  const last = messages[messages.length - 1];
  return {
    id: dto.thread.legacy_key || `${athlete.id}::${coach.id}`,
    serverId: dto.thread.id,
    coachId: coach.id,
    coachName: coach.name,
    athlete,
    messages,
    updatedAt: last ? last.ts : Date.parse(dto.thread.created_at) || Date.now(),
  };
}

function rowToWorkout(row: WorkoutRow): AppWorkout {
  return {
    id: row.id,
    date: row.performed_at,
    type: row.type,
    duration: row.duration_min,
    intensity: row.intensity,
    notes: row.notes ?? "",
  };
}

function postDtoToApp(dto: PostDto): AppPost | null {
  if (!dto.author) return null;
  const a = dto.author.role === "athlete" ? rowToAthlete(dto.author) : rowToCoach(dto.author);
  return {
    id: dto.post.id,
    authorId: appId(dto.author),
    author: {
      name: a.name,
      initials: a.initials,
      sport: a.sport,
      position: (a as AppAthlete).position ?? null,
      city: (a as AppAthlete).city ?? null,
      photo: null,
    },
    text: dto.post.body,
    ts: Date.parse(dto.post.created_at) || Date.now(),
    likes: dto.likes,
    liked: dto.likedByViewer,
  };
}

/* ----------------------- write-through merges --------------------- */

/** Merge server-sourced profiles into a local directory list. Local
 *  entries win on presentation fields (photo, stats, xp...) because the
 *  server intentionally stores less; server fills in anything new. */
function mergeDirectory<T extends { id: number | string; code?: string | null }>(
  key: string, incoming: T[],
): T[] {
  const local = readJson<T[]>(key, []);
  const merged = [...local];
  for (const item of incoming) {
    const i = merged.findIndex(x =>
      (x.code && item.code && x.code === item.code) || String(x.id) === String(item.id));
    if (i >= 0) merged[i] = { ...item, ...merged[i], code: merged[i].code ?? item.code };
    else merged.push(item);
  }
  writeJson(key, merged);
  return merged;
}

/** Server thread wins when it knows at least as many messages, so a
 *  locally-queued (not yet flushed) message is never wiped. */
function mergeThreads(records: AppThread[]): AppThread[] {
  const local = readJson<AppThread[]>(K.threads, []);
  const byId = new Map(local.map(t => [t.id, t]));
  for (const rec of records) {
    const existing = byId.get(rec.id);
    if (!existing || rec.messages.length >= (existing.messages?.length ?? 0)) {
      byId.set(rec.id, { ...existing, ...rec });
    } else if (existing && !existing.serverId) {
      byId.set(rec.id, { ...existing, serverId: rec.serverId });
    }
  }
  const merged = [...byId.values()];
  writeJson(K.threads, merged);
  return merged;
}

function mergeWorkouts(athleteAppId: number | string, incoming: AppWorkout[]): AppWorkout[] {
  const key = K.workouts(athleteAppId);
  const local = readJson<AppWorkout[]>(key, []);
  const serverIds = new Set(incoming.map(w => String(w.id)));
  // keep local-only entries (numeric ids = created locally, possibly queued)
  const localOnly = local.filter(w => !serverIds.has(String(w.id)) && typeof w.id === "number");
  const merged = [...incoming, ...localOnly]
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  writeJson(key, merged);
  return merged;
}

function mergePosts(incoming: AppPost[]): AppPost[] {
  const local = readJson<AppPost[]>(K.posts, []);
  const serverIds = new Set(incoming.map(p => String(p.id)));
  const localOnly = local.filter(p => !serverIds.has(String(p.id)) && typeof p.id === "number");
  const merged = [...localOnly, ...incoming].sort((a, b) => b.ts - a.ts);
  writeJson(K.posts, merged);
  return merged;
}

/* -------------------------- pending queue ------------------------- */

type QueueItem =
  | { kind: "register"; role: Role; payload: Record<string, unknown> }
  | { kind: "message"; athleteCode: string; coachCode: string; senderCode: string; body: string; legacyKey?: string }
  | { kind: "workout"; athleteCode: string; athleteAppId: number | string; localId: number | string; payload: Record<string, unknown> }
  | { kind: "post"; authorCode: string; localId: number | string; body: string }
  | { kind: "like"; postId: string; code: string }
  | { kind: "deletePost"; postId: string; code: string };

function queuePush(item: QueueItem): void {
  const q = readJson<QueueItem[]>(K.queue, []);
  q.push(item);
  writeJson(K.queue, q);
}

/** Replay queued writes in order. Stops at the first cloud outage (the
 *  rest stays queued); drops items the server definitively rejects. */
export async function flushPendingSync(): Promise<void> {
  const q = readJson<QueueItem[]>(K.queue, []);
  if (!q.length) return;
  const remaining: QueueItem[] = [];
  for (let i = 0; i < q.length; i++) {
    const item = q[i];
    try {
      await replayQueueItem(item);
    } catch (err) {
      if (err instanceof CloudUnavailableError) {
        remaining.push(...q.slice(i));
        break;
      }
      // 4xx: definitively rejected, dropping is the only safe move.
    }
  }
  writeJson(K.queue, remaining);
}

async function replayQueueItem(item: QueueItem): Promise<void> {
  switch (item.kind) {
    case "register":
      await api("/profiles/register", { method: "POST", body: JSON.stringify(item.payload) });
      return;
    case "message": {
      const dto = await api<ThreadDto>("/threads/open", {
        method: "POST",
        body: JSON.stringify({ athleteCode: item.athleteCode, coachCode: item.coachCode, legacyKey: item.legacyKey }),
      });
      await api("/messages", {
        method: "POST",
        body: JSON.stringify({ threadId: dto.thread.id, senderCode: item.senderCode, body: item.body }),
      });
      return;
    }
    case "workout": {
      const res = await api<{ workout: WorkoutRow }>("/workouts", {
        method: "POST", body: JSON.stringify(item.payload),
      });
      // Replace the locally-created entry with the server row so the next
      // fetch does not show a duplicate.
      const key = K.workouts(item.athleteAppId);
      const list = readJson<AppWorkout[]>(key, []);
      writeJson(key, list.map(w => (String(w.id) === String(item.localId) ? rowToWorkout(res.workout) : w)));
      return;
    }
    case "post": {
      const res = await api<{ post: PostDto["post"]; author: ProfileRow }>("/posts", {
        method: "POST", body: JSON.stringify({ authorCode: item.authorCode, body: item.body }),
      });
      const list = readJson<AppPost[]>(K.posts, []);
      writeJson(K.posts, list.map(p => (String(p.id) === String(item.localId)
        ? { ...p, id: res.post.id, ts: Date.parse(res.post.created_at) || p.ts }
        : p)));
      return;
    }
    case "like":
      await api(`/posts/${item.postId}/like`, { method: "POST", body: JSON.stringify({ code: item.code }) });
      return;
    case "deletePost":
      await api(`/posts/${encodeURIComponent(item.postId)}?code=${encodeURIComponent(item.code)}`, { method: "DELETE" });
      return;
  }
}

/* --------------------------- public API --------------------------- */

function athleteToRegisterPayload(a: AppAthlete): Record<string, unknown> {
  return {
    role: "athlete",
    code: a.code,
    legacyId: a.id,
    firstName: a.firstName || a.name || "Player",
    lastName: a.lastName ?? "",
    sport: a.sport || null,
    position: a.position || null,
    age: typeof a.age === "number" ? a.age : null,
    city: a.city || null,
    state: a.state || null,
  };
}

function coachToRegisterPayload(c: AppCoach & { years?: number | null }): Record<string, unknown> {
  const [first, ...rest] = String(c.name || "Coach").split(" ");
  const [city, state] = String(c.location || "").split(",").map(s => s.trim());
  return {
    role: "coach",
    code: c.code,
    legacyId: c.id,
    firstName: first,
    lastName: rest.join(" "),
    sport: c.sport || null,
    specialty: c.specialty || null,
    yearsCoaching: typeof c.years === "number" ? c.years : null,
    city: city || null,
    state: state || null,
    rateCents: typeof c.rate === "number" ? Math.round(c.rate * 100) : null,
    modes: Array.isArray(c.modes) && c.modes.length ? c.modes : null,
    background: c.badge || null,
  };
}

const lastRegistered = new Map<string, string>();

/** Upsert this profile on the server. Queues on outage. */
export async function registerProfile(profile: AppAthlete | AppCoach, role: Role): Promise<ProfileRow | null> {
  if (!profile.code) return null; // codes are issued at signup/backfill; nothing to key on yet
  const payload = role === "athlete"
    ? athleteToRegisterPayload(profile as AppAthlete)
    : coachToRegisterPayload(profile as AppCoach);
  const fingerprint = JSON.stringify(payload);
  if (lastRegistered.get(profile.code) === fingerprint) return null; // no change since last push
  try {
    const res = await api<{ profile: ProfileRow }>("/profiles/register", {
      method: "POST", body: JSON.stringify(payload),
    });
    lastRegistered.set(profile.code, fingerprint);
    return res.profile;
  } catch (err) {
    if (err instanceof CloudUnavailableError) {
      queuePush({ kind: "register", role, payload });
      return null;
    }
    if (err instanceof ApiError) return null; // rejected: keep local-only
    throw err;
  }
}

/** Cross-device login. Server first; null means "not known to the server
 *  or server unreachable" — the caller falls back to local word-decode. */
export async function loginByCode(code: string): Promise<LoginResult> {
  try {
    const res = await api<{ profile: ProfileRow }>(`/profiles/by-code/${encodeURIComponent(code)}`);
    const row = res.profile;
    if (row.role === "athlete") {
      const athlete = rowToAthlete(row);
      mergeDirectory(K.athletes, [{ ...athlete, registeredAt: Date.now() }]);
      return { role: "athlete", athlete };
    }
    const coach = rowToCoach(row);
    mergeDirectory(K.coaches, [coach]);
    return { role: "coach", coach };
  } catch {
    return null; // 404, outage — either way the local decoder takes over
  }
}

export async function fetchCoaches(): Promise<AppCoach[] | null> {
  try {
    const res = await api<{ profiles: ProfileRow[] }>("/profiles?role=coach");
    return mergeDirectory(K.coaches, res.profiles.map(rowToCoach));
  } catch { return null; }
}

export async function fetchAthletes(): Promise<AppAthlete[] | null> {
  try {
    const res = await api<{ profiles: ProfileRow[] }>("/profiles?role=athlete");
    return mergeDirectory(K.athletes, res.profiles.map(rowToAthlete));
  } catch { return null; }
}

/** Find-or-create the thread for an athlete/coach pair and pull its
 *  messages. Used on chat open and by the 5s poll. */
export async function openThread(params: { athleteCode: string; coachCode: string; legacyKey?: string }): Promise<AppThread | null> {
  try {
    const dto = await api<ThreadDto>("/threads/open", { method: "POST", body: JSON.stringify(params) });
    const rec = threadDtoToRecord(dto);
    if (rec) mergeThreads([rec]);
    return rec;
  } catch { return null; }
}

/** Outcome of a send. `refused` covers the safety layer saying no
 *  (hard-blocked content, banned sender, blocked pair, thread rate
 *  limit): the message must NOT be kept locally or retried, and
 *  `message` is kid-readable copy to show the sender. */
export type SendMessageResult =
  | { status: "sent" }
  | { status: "queued" }
  | { status: "refused"; code: string; message: string }
  | { status: "failed" };

const REFUSAL_CODES = new Set(["message_blocked", "sender_banned", "recipient_unavailable", "blocked", "rate_limited_thread"]);

/** Send a message. The local thread copy is written by the page (as
 *  today); this pushes it to the server or queues it. */
export async function sendMessage(params: {
  athleteCode: string; coachCode: string; senderCode: string; body: string; legacyKey?: string;
}): Promise<SendMessageResult> {
  try {
    const dto = await api<ThreadDto>("/threads/open", {
      method: "POST",
      body: JSON.stringify({ athleteCode: params.athleteCode, coachCode: params.coachCode, legacyKey: params.legacyKey }),
    });
    await api("/messages", {
      method: "POST",
      body: JSON.stringify({ threadId: dto.thread.id, senderCode: params.senderCode, body: params.body }),
    });
    return { status: "sent" };
  } catch (err) {
    if (err instanceof CloudUnavailableError) {
      queuePush({ kind: "message", ...params });
      return { status: "queued" };
    }
    if (err instanceof ApiError && REFUSAL_CODES.has(err.code)) {
      return { status: "refused", code: err.code, message: err.message };
    }
    return { status: "failed" };
  }
}

/** File a report against the other party of a conversation. Not queued
 *  for retry: the caller shows success or asks the user to try again. */
export async function fileReport(params: {
  reporterCode: string; subjectCode: string; messageId?: string | null;
  reason: "uncomfortable" | "personal_info" | "move_off_platform" | "other";
  details?: string | null;
}): Promise<{ ok: boolean; message?: string }> {
  try {
    await api("/reports", { method: "POST", body: JSON.stringify(params) });
    return { ok: true };
  } catch (err) {
    if (err instanceof ApiError) return { ok: false, message: err.message };
    return { ok: false, message: "We couldn't send this right now. Please try again in a bit." };
  }
}

/** Block a profile server-side. The caller also records the block
 *  locally so the UI hides the thread immediately either way. */
export async function blockProfile(params: {
  blockerCode: string; blockedCode: string;
}): Promise<{ ok: boolean; message?: string }> {
  try {
    await api("/blocks", { method: "POST", body: JSON.stringify(params) });
    return { ok: true };
  } catch (err) {
    if (err instanceof ApiError) return { ok: false, message: err.message };
    return { ok: false, message: "We couldn't finish this right now. Please try again in a bit." };
  }
}

/** All threads for a profile, merged into coachme_threads. */
export async function fetchThreads(code: string): Promise<AppThread[] | null> {
  try {
    const res = await api<{ threads: ThreadDto[] }>(`/threads/for/${encodeURIComponent(code)}`);
    const records = res.threads.map(threadDtoToRecord).filter((r): r is AppThread => r != null);
    return mergeThreads(records);
  } catch { return null; }
}

export async function logWorkout(params: {
  athleteCode: string; athleteAppId: number | string; localId: number | string;
  type: string; durationMin?: number | null; intensity?: number | null; notes?: string | null; performedAt: string;
}): Promise<boolean> {
  const payload = {
    athleteCode: params.athleteCode,
    type: params.type,
    durationMin: params.durationMin ?? null,
    intensity: params.intensity ?? null,
    notes: params.notes ?? null,
    performedAt: params.performedAt,
  };
  try {
    const res = await api<{ workout: WorkoutRow }>("/workouts", { method: "POST", body: JSON.stringify(payload) });
    const key = K.workouts(params.athleteAppId);
    const list = readJson<AppWorkout[]>(key, []);
    writeJson(key, list.map(w => (String(w.id) === String(params.localId) ? rowToWorkout(res.workout) : w)));
    return true;
  } catch (err) {
    if (err instanceof CloudUnavailableError) {
      queuePush({ kind: "workout", athleteCode: params.athleteCode, athleteAppId: params.athleteAppId, localId: params.localId, payload });
    }
    return false;
  }
}

export async function fetchWorkouts(code: string, athleteAppId: number | string): Promise<AppWorkout[] | null> {
  try {
    const res = await api<{ workouts: WorkoutRow[] }>(`/workouts/for/${encodeURIComponent(code)}`);
    return mergeWorkouts(athleteAppId, res.workouts.map(rowToWorkout));
  } catch { return null; }
}

export async function createPost(params: { authorCode: string; localId: number | string; body: string }): Promise<boolean> {
  try {
    const res = await api<{ post: PostDto["post"] }>("/posts", {
      method: "POST", body: JSON.stringify({ authorCode: params.authorCode, body: params.body }),
    });
    const list = readJson<AppPost[]>(K.posts, []);
    writeJson(K.posts, list.map(p => (String(p.id) === String(params.localId)
      ? { ...p, id: res.post.id, ts: Date.parse(res.post.created_at) || p.ts }
      : p)));
    return true;
  } catch (err) {
    if (err instanceof CloudUnavailableError) {
      queuePush({ kind: "post", authorCode: params.authorCode, localId: params.localId, body: params.body });
    }
    return false;
  }
}

export async function fetchPosts(viewerCode?: string | null): Promise<AppPost[] | null> {
  try {
    const res = await api<{ posts: PostDto[] }>(`/posts${viewerCode ? `?viewer=${encodeURIComponent(viewerCode)}` : ""}`);
    const posts = res.posts.map(postDtoToApp).filter((p): p is AppPost => p != null);
    return mergePosts(posts);
  } catch { return null; }
}

export async function toggleLike(postId: number | string, code: string): Promise<void> {
  if (typeof postId === "number") return; // local-only post: nothing on the server yet
  try {
    await api(`/posts/${encodeURIComponent(postId)}/like`, { method: "POST", body: JSON.stringify({ code }) });
  } catch (err) {
    if (err instanceof CloudUnavailableError) queuePush({ kind: "like", postId, code });
  }
}

export async function deletePost(postId: number | string, code: string): Promise<void> {
  if (typeof postId === "number") {
    // Local-only post: if its create is still queued, cancel it.
    const q = readJson<QueueItem[]>(K.queue, []);
    writeJson(K.queue, q.filter(i => !(i.kind === "post" && String(i.localId) === String(postId))));
    return;
  }
  try {
    await api(`/posts/${encodeURIComponent(postId)}?code=${encodeURIComponent(code)}`, { method: "DELETE" });
  } catch (err) {
    if (err instanceof CloudUnavailableError) queuePush({ kind: "deletePost", postId, code });
  }
}

/* ---------------------- import on first connect -------------------- */

/** One-time push of a device-local history the server has never seen:
 *  profile, then (athletes) workouts, authored posts, and threads. Runs
 *  once per code — the marker is only written after a reachable server
 *  answered, so an offline first run retries next load. Legacy ids ride
 *  along in legacy_id / legacy_key for migration matching.
 *  Known limits (documented, acceptable for Phase 1): server assigns
 *  fresh created_at to imported posts/messages, and threads whose other
 *  party has no code on this device are skipped. */
export async function importOnFirstConnect(profile: AppAthlete | AppCoach, role: Role): Promise<void> {
  if (typeof window === "undefined" || !profile.code) return;
  if (localStorage.getItem(K.imported(profile.code))) return;
  try {
    let known = true;
    try {
      await api(`/profiles/by-code/${encodeURIComponent(profile.code)}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) known = false;
      else throw err;
    }

    if (!known) {
      const payload = role === "athlete"
        ? athleteToRegisterPayload(profile as AppAthlete)
        : coachToRegisterPayload(profile as AppCoach);
      await api("/profiles/register", { method: "POST", body: JSON.stringify(payload) });

      if (role === "athlete") {
        const workouts = readJson<AppWorkout[]>(K.workouts(profile.id), []);
        for (const w of workouts) {
          try {
            await api("/workouts", {
              method: "POST",
              body: JSON.stringify({
                athleteCode: profile.code, type: w.type,
                durationMin: w.duration ?? null, intensity: w.intensity ?? null,
                notes: w.notes ?? null, performedAt: new Date(w.date).toISOString(),
              }),
            });
          } catch (err) { if (err instanceof CloudUnavailableError) throw err; }
        }
        const posts = readJson<AppPost[]>(K.posts, []).filter(p => String(p.authorId) === String(profile.id));
        for (const p of posts.sort((a, b) => a.ts - b.ts)) {
          try {
            await api("/posts", { method: "POST", body: JSON.stringify({ authorCode: profile.code, body: p.text }) });
          } catch (err) { if (err instanceof CloudUnavailableError) throw err; }
        }
      }

      // Threads: replay both sides' messages in order. Needs the other
      // party's code; threads whose counterpart is unknown on this device
      // are skipped (nothing to address them by).
      const threads = readJson<AppThread[]>(K.threads, []);
      const coachesDir = readJson<AppCoach[]>(K.coaches, []);
      const mine = role === "athlete"
        ? threads.filter(t => String(t.id).startsWith(`${profile.id}::`))
        : threads.filter(t => String(t.coachId) === String(profile.id));
      for (const t of mine) {
        const athleteCode = role === "athlete" ? profile.code : t.athlete?.code;
        const coachCode = role === "coach"
          ? profile.code
          : coachesDir.find(c => String(c.id) === String(t.coachId))?.code;
        if (!athleteCode || !coachCode) continue;
        try {
          const dto = await api<ThreadDto>("/threads/open", {
            method: "POST",
            body: JSON.stringify({ athleteCode, coachCode, legacyKey: t.id }),
          });
          if (dto.messages.length >= t.messages.length) continue; // already imported/current
          for (const m of [...t.messages].sort((a, b) => a.ts - b.ts)) {
            await api("/messages", {
              method: "POST",
              body: JSON.stringify({
                threadId: dto.thread.id,
                senderCode: m.from === "athlete" ? athleteCode : coachCode,
                body: m.text,
              }),
            });
          }
        } catch (err) { if (err instanceof CloudUnavailableError) throw err; }
      }
    }

    localStorage.setItem(K.imported(profile.code), String(Date.now()));
  } catch {
    // Cloud unreachable: no marker, so the import retries on a later load.
  }
}
