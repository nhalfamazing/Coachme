"use client";
/* eslint-disable @next/next/no-img-element, react/no-unknown-property */
// @ts-nocheck
// This is a single-file UI prototype for the KoachMe app. Kept untyped on
// purpose so it lands intact. We'll refactor and add proper types in a
// follow-up phase.

import { useState, useEffect, useRef } from 'react';
import { track } from '@vercel/analytics';
import { trackWhenReady } from '@/lib/analytics';
import * as sync from '@/lib/sync';
import * as bookingApi from '@/lib/scheduling/client';
import { checkHardBlock, BLOCK_MESSAGE } from '@/lib/safety/patterns';
import { generateAthleteCode, decodeAnyCode } from '@/lib/codes';
import { DRILLS, COACHES, SPORT_META, coachFor } from '@/lib/drills';
import { hasHowTo, relatedDrills, drillProgress, trackedStatFor } from '@/lib/drill-content';
import { ACHIEVEMENT_DEFS, achievementState, achievementXp } from '@/lib/achievements';
import { OFFER, foundingSentence } from '@/lib/offer';
import { FieldGeo, hasFieldGeo } from '@/components/marketing/field-lines';
import {
  CheckCircle2, MapPin, Video, Send, Calendar as CalIcon, Star,
  TrendingUp, Search, User as UserIcon, MessageCircle,
  ChevronRight, ChevronLeft, ChevronDown, X, ArrowRight,
  Plus, Mic, MicOff, VideoOff, PhoneOff, Camera,
  Send as SendIcon, MoreHorizontal, Inbox, UserPlus,
  Users, Heart, Dumbbell, Flame, Zap, Award, Trophy, Target, Clock, Lock,
  Play, Package, Gauge
} from 'lucide-react';

/* ============================================================
   CONSTANTS
   ============================================================ */
// Real trainers go here once they're verified and onboarded. Until then
// the list stays empty so the app never shows fabricated people or stats.
// Schema (for when we add real ones):
//   id, name, initials, photo (real), cover, title, sport, years,
//   specialty, location, rate, rating, reviews, athletes, avgGain,
//   commits, modes, badge, bio, color
const TRAINERS: any[] = [];

const SPORTS = [
  { name: 'Baseball', icon: '⚾' },
  { name: 'Basketball', icon: '🏀' },
  { name: 'Football', icon: '🏈' },
  { name: 'Soccer', icon: '⚽' },
  { name: 'Softball', icon: '🥎' },
  { name: 'Tennis', icon: '🎾' },
  { name: 'Track', icon: '🏃' },
  { name: 'Volleyball', icon: '🏐' },
  { name: 'Wrestling', icon: '🤼' },
];

const POSITIONS_BY_SPORT: Record<string, string[]> = {
  Baseball: ['Pitcher', 'Catcher', '1st Base', '2nd Base', '3rd Base', 'Shortstop', 'Left Field', 'Center Field', 'Right Field', 'Utility'],
  Basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
  Football: ['Quarterback', 'Running Back', 'Wide Receiver', 'Tight End', 'Offensive Line', 'Defensive Line', 'Linebacker', 'Safety', 'Cornerback', 'Kicker', 'Punter'],
  Soccer: ['Goalkeeper', 'Center Back', 'Fullback', 'Defensive Midfielder', 'Central Midfielder', 'Attacking Midfielder', 'Winger', 'Striker'],
  // Softball is NOT in codes.ts SPORTS_CANON (the login-code word table
  // has no room for a 9th canon sport without breaking existing custom-
  // sport codes); it rides the custom bucket, so cold-device code
  // restores show sport "Other". Profile data on known devices is exact.
  Softball: ['Pitcher', 'Catcher', '1st Base', '2nd Base', '3rd Base', 'Shortstop', 'Left Field', 'Center Field', 'Right Field', 'Utility'],
  Tennis: ['Singles', 'Doubles', 'Both'],
  Track: ['Sprints', 'Middle Distance', 'Long Distance', 'Hurdles', 'Throws', 'Jumps', 'Multi-Events'],
  Volleyball: ['Setter', 'Outside Hitter', 'Middle Blocker', 'Opposite Hitter', 'Libero', 'Defensive Specialist'],
  Wrestling: ['Wrestler'],
};

const AGES = Array.from({ length: 20 }, (_, i) => 6 + i); // 6-25

const US_STATES = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];

const CITY_SUGGESTIONS = [
  'Miami', 'Tampa', 'Orlando', 'Jacksonville', 'Fort Lauderdale', 'Coral Gables', 'Doral', 'Hialeah',
  'Los Angeles', 'San Diego', 'San Francisco', 'San Jose', 'Sacramento', 'Long Beach', 'Oakland',
  'New York', 'Brooklyn', 'Queens', 'Buffalo',
  'Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth',
  'Atlanta', 'Savannah',
  'Charlotte', 'Raleigh', 'Durham',
  'Philadelphia', 'Pittsburgh',
  'Chicago', 'Naperville',
  'Boston', 'Cambridge',
  'Seattle', 'Tacoma',
  'Phoenix', 'Tucson',
  'Denver', 'Colorado Springs',
  'Detroit', 'Grand Rapids',
  'Newark', 'Jersey City',
  'Washington',
  'Las Vegas',
  'Nashville', 'Memphis',
  'Portland',
  'Minneapolis',
  'New Orleans',
];

const BASEBALL_BANNER = '/banner.jpg';

const MODE_META = {
  in_person: { label: 'In Person', icon: MapPin, color: '#C5FF3D' },
  live_online: { label: 'Live Online', icon: Video, color: '#5DA9FF' },
  async: { label: 'Async', icon: Send, color: '#FF9BCD' },
};

/* Clay = earned on the field (design-system.md): every level above
   self-reported wears the verification color. Self stays muted - it is
   the not-yet-earned state. */
const VERIFY_META = {
  event: { label: 'EVENT', color: '#C96F4A' },
  facility: { label: 'FACILITY', color: '#C96F4A' },
  trainer: { label: 'TRAINER', color: '#C96F4A' },
  self: { label: 'SELF', color: '#5F636B' },
};

const BASEBALL_STAT_DEFS = [
  { key: 'exitVelo', label: 'Exit Velo', unit: 'mph', placeholder: '85' },
  { key: 'sixtyYd', label: '60 Yd Dash', unit: 's', placeholder: '7.4' },
  { key: 'throwVelo', label: 'Throw Velo', unit: 'mph', placeholder: '75' },
  { key: 'popTime', label: 'Pop Time', unit: 's', placeholder: '2.20' },
];

/* Drill Library data now lives in src/lib/drills.ts (typed, shared with
   scripts/mirror-drills.mjs). Each asset carries { cdn, blob } URLs. */

const WORKOUT_TYPES = [
  { key: 'practice',     label: 'Practice',         color: '#C5FF3D' },
  { key: 'strength',     label: 'Strength',         color: '#FF6B3D' },
  { key: 'skills',       label: 'Skills work',      color: '#5DA9FF' },
  { key: 'conditioning', label: 'Conditioning',     color: '#FF9BCD' },
  { key: 'game',         label: 'Game / Scrimmage', color: '#B17CFF' },
  { key: 'film',         label: 'Film study',       color: '#FFB347' },
  { key: 'recovery',     label: 'Recovery',         color: '#7DD3C0' },
];

const INTENSITY_LABELS = ['Light', 'Easy', 'Medium', 'Hard', 'All-out'];

/* Achievements are checked against derived state, never fake-awarded.
   Definitions and XP live in src/lib/achievements.ts (testable, no
   React); only the icons are chosen here. Drill logging earns XP
   through this same system — there is no second XP path. */
const ACHIEVEMENT_ICONS: Record<string, unknown> = {
  first_workout: Flame,
  streak_3: Zap,
  streak_7: Flame,
  workouts_10: Dumbbell,
  workouts_50: Trophy,
  first_drill: Target,
  drills_10: Video,
  first_post: Users,
  first_pr: TrendingUp,
  first_trainer: Award,
};
const ACHIEVEMENTS = ACHIEVEMENT_DEFS.map(a => ({ ...a, icon: ACHIEVEMENT_ICONS[a.id] ?? Award }));

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function calcStreak(workouts) {
  if (!workouts || workouts.length === 0) return 0;
  const days = new Set(workouts.map(w => new Date(w.date).toDateString()));
  let streak = 0;
  const cursor = new Date();
  // If today is logged, start streak today; otherwise check from yesterday.
  if (!days.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function countThisWeek(workouts) {
  if (!workouts || workouts.length === 0) return 0;
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return workouts.filter(w => new Date(w.date) >= start).length;
}

/* ============================================================
   PER-ATHLETE WORKOUT STORAGE
   Workouts live under 'coachme_workouts::<athleteId>' so two kids
   sharing one browser get separate logs, streaks, and achievements.
   The pre-namespacing shared key 'coachme_workouts' is claimed once
   by the first athlete to log in after this shipped.
   ============================================================ */
const LEGACY_WORKOUTS_KEY = 'coachme_workouts';
function workoutsKey(athleteId) { return `coachme_workouts::${athleteId}`; }

function loadWorkoutsFor(athleteId) {
  try {
    const saved = JSON.parse(localStorage.getItem(workoutsKey(athleteId)) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch { return []; }
}

// One-time claim of the legacy shared log: copy it to the active
// athlete's namespaced key, then prepend a {migrated: true} marker to
// the legacy key so no other athlete on the device claims it too. The
// legacy key is intentionally NOT deleted — a second profile on the
// device may need its entries manually attributed later.
function migrateLegacyWorkouts(athleteId) {
  try {
    const raw = localStorage.getItem(LEGACY_WORKOUTS_KEY);
    if (raw == null) return;
    if (localStorage.getItem(workoutsKey(athleteId)) != null) return;
    let legacy;
    try { legacy = JSON.parse(raw); } catch { return; }
    if (!Array.isArray(legacy)) return;
    if (legacy.some(w => w && w.migrated === true)) return;
    localStorage.setItem(workoutsKey(athleteId), JSON.stringify(legacy));
    localStorage.setItem(LEGACY_WORKOUTS_KEY, JSON.stringify([{ migrated: true }, ...legacy]));
  } catch {}
}

/* ============================================================
   PER-DRILL SESSION STORAGE
   Drill logs live under 'coachme_drill_sessions::<athleteId>',
   namespaced per athlete for the same reason workouts are: two kids
   on one browser must not share a training history. New key, so
   there is no legacy shape to claim.
   ============================================================ */
function drillSessionsKey(athleteId) { return `coachme_drill_sessions::${athleteId}`; }

function loadDrillSessionsFor(athleteId) {
  try {
    const saved = JSON.parse(localStorage.getItem(drillSessionsKey(athleteId)) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch { return []; }
}

/* ============================================================
   SHARED MESSAGE THREADS (athlete <-> coach)
   Single source of truth in localStorage 'coachme_threads', read and
   written by BOTH the athlete app and the coach dashboard at /coach.
   Stopgap until Supabase realtime lands in Phase 1.
   ============================================================ */
function loadThreads() {
  try {
    const t = JSON.parse(localStorage.getItem('coachme_threads') || '[]');
    return Array.isArray(t) ? t : [];
  } catch { return []; }
}
function saveThreads(threads) {
  try { localStorage.setItem('coachme_threads', JSON.stringify(threads)); } catch {}
}
function makeThreadId(athleteId, coachId) { return `${athleteId}::${coachId}`; }
function athleteSnapshot(a) {
  return {
    id: a.id, name: a.name, firstName: a.firstName || null,
    lastName: a.lastName || null, code: a.code || null,
    initials: a.initials, sport: a.sport,
    position: a.position, age: a.age ?? null, city: a.city,
    state: a.state || null, location: a.location || null,
    banner: a.banner || null, photo: a.photo || null,
    level: a.level || 1, xp: a.xp || 0, xpMax: a.xpMax || 500,
    stats: Array.isArray(a.stats) ? a.stats : [],
  };
}
// The server refused a message (safety block, ban, blocked pair, or
// rate limit): remove the optimistic local copy so the kid never
// believes it sent. Matched by sender+text from the end, because the
// local id was minted separately from the push.
function removeLastLocalAthleteMessage(athleteId, coachId, text) {
  const threads = loadThreads();
  const t = threads.find(x => x.id === makeThreadId(athleteId, coachId));
  if (!t) return;
  for (let i = t.messages.length - 1; i >= 0; i--) {
    if (t.messages[i].from === 'athlete' && t.messages[i].text === text) {
      t.messages.splice(i, 1);
      break;
    }
  }
  saveThreads(threads);
}

// Athlete sends a message to a coach: upsert the thread, append it.
function pushAthleteMessage(athlete, coachId, coachName, text) {
  const threads = loadThreads();
  const id = makeThreadId(athlete.id, coachId);
  let t = threads.find(x => x.id === id);
  if (!t) {
    t = { id, coachId, coachName, athlete: athleteSnapshot(athlete), messages: [], updatedAt: Date.now() };
    threads.push(t);
  }
  t.athlete = athleteSnapshot(athlete);
  t.coachName = coachName;
  t.messages.push({ id: Date.now(), from: 'athlete', text, ts: Date.now() });
  t.updatedAt = Date.now();
  saveThreads(threads);
  // The server copy is pushed by sync.sendMessage at the call site.
}
/* ============================================================
   LOCAL BLOCK LIST
   Blocks are enforced server-side (the message route refuses both
   directions); this device-local list makes the UI honest instantly:
   blocked threads disappear from Messages and the composer is
   replaced. Keyed per athlete so siblings sharing a device don't
   share blocks.
   ============================================================ */
function blockedKey(athleteId) { return `coachme_blocked::${athleteId}`; }
function loadBlockedIds(athleteId) {
  try {
    const b = JSON.parse(localStorage.getItem(blockedKey(athleteId)) || '[]');
    return Array.isArray(b) ? b : [];
  } catch { return []; }
}
function addBlockedId(athleteId, coachId) {
  const list = loadBlockedIds(athleteId);
  if (!list.includes(coachId)) {
    list.push(coachId);
    try { localStorage.setItem(blockedKey(athleteId), JSON.stringify(list)); } catch {}
  }
  return list;
}

// Directory of every athlete who has signed up in this browser's app.
// The Coach Console browses this list so coaches can find kids to train
// and message them first. Moves to Supabase in Phase 1.
function registerAthlete(a) {
  try {
    const raw = JSON.parse(localStorage.getItem('coachme_athletes') || '[]');
    const list = Array.isArray(raw) ? raw : [];
    const snap = { ...athleteSnapshot(a), registeredAt: Date.now() };
    const i = list.findIndex(x => x.id === a.id);
    if (i >= 0) list[i] = { ...list[i], ...snap };
    else list.push(snap);
    localStorage.setItem('coachme_athletes', JSON.stringify(list));
    // Share with every device so coaches can find them anywhere.
    sync.registerProfile(snap, 'athlete');
  } catch {}
}

function loadAthleteDir() {
  try {
    const d = JSON.parse(localStorage.getItem('coachme_athletes') || '[]');
    return Array.isArray(d) ? d : [];
  } catch { return []; }
}
function loadCoachList() {
  try {
    const c = JSON.parse(localStorage.getItem('coachme_coaches') || '[]');
    return Array.isArray(c) ? c : [];
  } catch { return []; }
}
function upsertCoach(c) {
  try {
    const list = loadCoachList();
    const i = list.findIndex(x => x.id === c.id);
    if (i >= 0) list[i] = { ...list[i], ...c };
    else list.push(c);
    localStorage.setItem('coachme_coaches', JSON.stringify(list));
    sync.registerProfile(c, 'coach');
  } catch {}
}
// Login codes now live in src/lib/codes.ts: three short words per person
// (athletes: alex-tiger-moon, coaches: sam-coach-tiger). Old CM1/CM2/CH1/
// CH2 codes still decode there so nobody gets locked out.

// Convert a stored thread's messages into the athlete UI's shape.
function threadToConversation(athleteId, coachId) {
  const threads = loadThreads();
  const t = threads.find(x => x.id === makeThreadId(athleteId, coachId));
  if (!t) return [];
  return t.messages.map(m => ({
    id: m.id,
    from: m.from === 'athlete' ? 'me' : 'trainer',
    text: m.text,
    ts: new Date(m.ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
  }));
}

// Real availability comes from the trainer's calendar once trainers exist.
// Empty until that integration ships.
const SLOTS: any[] = [];

const QUICK_REPLIES = ['Thanks coach', 'See you then', 'Send drill plan', 'When works for you?'];

/* ============================================================
   AVATAR + COVER PHOTO
   ============================================================ */
function Avatar({ photo, initials, size = 48, color = '#C5FF3D', square = false, ring = false }) {
  const [failed, setFailed] = useState(false);
  const r = square ? Math.max(10, size * 0.22) : '50%';
  const showPhoto = photo && !failed;
  return (
    <div style={{
      width: size, height: size, borderRadius: r,
      background: `linear-gradient(135deg, ${color}30 0%, ${color}10 100%)`,
      border: `1px solid ${color}50`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', flexShrink: 0, position: 'relative',
      boxShadow: ring ? `0 0 0 3px #0A0A0B, 0 0 0 4px ${color}` : 'none',
    }}>
      {showPhoto ? (
        <img src={photo} alt={initials} referrerPolicy="no-referrer" loading="eager"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={() => setFailed(true)}/>
      ) : (
        <span className="display" style={{ fontSize: size * 0.42, color, lineHeight: 1 }}>{initials}</span>
      )}
    </div>
  );
}

function CoverPhoto({ src, height = 120, overlay, color = '#C5FF3D', children, blur = 0 }) {
  const [failed, setFailed] = useState(false);
  // No src at all (e.g. a form-signup coach with no cover photo) gets the
  // same branded gradient fallback as a broken image, instead of a
  // transparent block that leaves a visible seam.
  const showFallback = !src || failed;
  return (
    <div style={{
      height, position: 'relative', overflow: 'hidden',
      background: showFallback
        ? `linear-gradient(135deg, ${color}30 0%, var(--km-card) 80%), repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.02) 10px, rgba(255,255,255,0.02) 20px)`
        : 'transparent',
    }}>
      {!showFallback && (
        <img src={src} alt="" referrerPolicy="no-referrer" loading="eager"
          onError={() => setFailed(true)}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            position: 'absolute', top: 0, left: 0,
            filter: blur ? `blur(${blur}px) saturate(0.85)` : 'none',
            transform: blur ? 'scale(1.1)' : 'none',
          }}/>
      )}
      {overlay && <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: overlay }}/>}
      {children && <div style={{ position: 'relative', zIndex: 2, height: '100%' }}>{children}</div>}
    </div>
  );
}

/* ============================================================
   MAIN APP
   ============================================================ */
export default function CoachMeApp() {
  const [athlete, setAthlete] = useState(null);

  // A signed-out athlete stays saved on the device so Log in can restore them.
  const [savedAthlete, setSavedAthlete] = useState(null);

  // Every profile that has ever logged in on this device, for the
  // landing page's WHO'S PLAYING picker. Opening the app ALWAYS shows
  // the landing page first; picking your name is one tap.
  const [deviceAthletes, setDeviceAthletes] = useState([]);
  const [deviceCoaches, setDeviceCoaches] = useState([]);

  useEffect(() => {
    if (athlete) return; // only needed while the landing page is showing
    try {
      const saved = JSON.parse(localStorage.getItem('coachme_athlete') || 'null');
      if (saved && saved.id) setSavedAthlete(saved);
      const dir = loadAthleteDir();
      const lastId = saved && saved.id;
      // Last active person first, then most recently joined.
      const sorted = [...dir].sort((a, b) => {
        if (a.id === lastId) return -1;
        if (b.id === lastId) return 1;
        return (b.registeredAt || 0) - (a.registeredAt || 0);
      });
      // Older devices may have a saved athlete not yet in the directory.
      if (saved && saved.id && !sorted.some(a => a.id === saved.id)) sorted.unshift(saved);
      setDeviceAthletes(sorted);
      setDeviceCoaches(loadCoachList());
    } catch {}
  }, [athlete]);

  const pickDeviceAthlete = (a) => completeSignup({ level: 1, xp: 0, xpMax: 500, ...a });
  const pickDeviceCoach = (c) => {
    try { sessionStorage.setItem('coachme_active_coach', JSON.stringify(c)); } catch {}
    window.location.href = '/coach';
  };

  const completeSignup = (a) => {
    const withId = { id: a.id || Date.now(), ...a };
    // Issue their 3-word login code the moment the account exists, and
    // remember it on the profile forever.
    if (!withId.code) {
      withId.code = generateAthleteCode(withId, loadAthleteDir().map(x => x.code));
    }
    setAthlete(withId);
    setSavedAthlete(null);
    try {
      localStorage.setItem('coachme_athlete', JSON.stringify(withId));
      localStorage.removeItem('coachme_signed_out');
    } catch {}
  };

  // Keep this athlete listed in the shared directory coaches browse.
  useEffect(() => {
    if (athlete) registerAthlete(athlete);
  }, [athlete]);

  // Backfill: athletes created before 3-word codes existed get one the
  // next time they open the app, and it sticks.
  useEffect(() => {
    if (!athlete || athlete.code) return;
    const withCode = { ...athlete, code: generateAthleteCode(athlete, loadAthleteDir().map(x => x.code)) };
    if (!withCode.code) return;
    setAthlete(withCode);
    try { localStorage.setItem('coachme_athlete', JSON.stringify(withCode)); } catch {}
  }, [athlete]);

  const loginSavedAthlete = () => {
    if (!savedAthlete) return;
    setAthlete(savedAthlete);
    setSavedAthlete(null);
    try { localStorage.removeItem('coachme_signed_out'); } catch {}
  };

  const signOut = () => {
    try { localStorage.setItem('coachme_signed_out', '1'); } catch {}
    setSavedAthlete(athlete);
    setAthlete(null);
    setTab('profile');
    setTrainerOpen(null);
    setChatOpen(null);
    setCallOpen(null);
    setBooking(null);
  };

  const [tab, setTab] = useState('profile');
  const [trainerOpen, setTrainerOpen] = useState(null);
  const [booking, setBooking] = useState(null);
  const [tabAnim, setTabAnim] = useState(false);

  const [conversations, setConversations] = useState({});
  const [trainerIds, setTrainerIds] = useState([]);
  const [chatOpen, setChatOpen] = useState(null);
  const [callOpen, setCallOpen] = useState(null);

  // Coaches this athlete has blocked (device-local mirror of the
  // server-side block; see LOCAL BLOCK LIST above).
  const [blockedIds, setBlockedIds] = useState([]);
  useEffect(() => {
    setBlockedIds(athlete ? loadBlockedIds(athlete.id) : []);
  }, [athlete?.id]);
  const blockCoach = (coachId) => {
    if (!athlete) return;
    setBlockedIds(addBlockedId(athlete.id, coachId));
    setChatOpen(null);
    const coach = allTrainers.find(t => t.id === coachId);
    if (athlete.code && coach?.code) {
      sync.blockProfile({ blockerCode: athlete.code, blockedCode: coach.code });
    }
  };

  // Coaches who signed themselves up via /become-a-coach. A coach only
  // needs to have signed up ONCE to appear for athletes; they do not
  // need to be logged in. Refreshes on tab switches and live when a
  // coach signs up in another tab.
  const [submittedTrainers, setSubmittedTrainers] = useState([]);
  const refreshCoaches = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('coachme_coaches') || '[]');
      setSubmittedTrainers(Array.isArray(saved) ? saved : []);
    } catch {
      setSubmittedTrainers([]);
    }
  };
  useEffect(() => { refreshCoaches(); }, [tab]);
  useEffect(() => {
    const handler = (e) => { if (e.key === 'coachme_coaches') refreshCoaches(); };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Coaches from the server registry, so a trainer who signed up on ANY
  // device shows in every athlete's Trainers tab. sync.fetchCoaches also
  // merges them into coachme_coaches (offline cache); it returns null
  // when the cloud is disabled and the app stays device-local.
  const [cloudTrainers, setCloudTrainers] = useState([]);
  useEffect(() => {
    let live = true;
    sync.fetchCoaches().then(remote => {
      if (live && Array.isArray(remote)) {
        setCloudTrainers(remote.filter(c => c && c.id != null && c.name && c.sport));
      }
    });
    return () => { live = false; };
  }, [tab]);

  const allTrainers = (() => {
    const map = new Map();
    [...TRAINERS, ...submittedTrainers, ...cloudTrainers].forEach(t => {
      if (t && t.id != null && !map.has(String(t.id))) map.set(String(t.id), t);
    });
    return [...map.values()];
  })();

  // Workout log (athlete's daily training). Persisted to localStorage.
  const [workouts, setWorkouts] = useState([]);
  const [logWorkoutOpen, setLogWorkoutOpen] = useState(false);
  const [drillOpen, setDrillOpen] = useState(null);
  // Load on login/resume, keyed to the active athlete. Runs the one-time
  // legacy-key migration first so a pre-namespacing log is claimed by the
  // first athlete to sign in, and only them.
  useEffect(() => {
    if (!athlete) { setWorkouts([]); return; }
    migrateLegacyWorkouts(athlete.id);
    setWorkouts(loadWorkoutsFor(athlete.id));
    // Pull this athlete's server log too (merged into the same local key),
    // so a device switch brings their history with them.
    if (athlete.code) {
      let live = true;
      sync.fetchWorkouts(athlete.code, athlete.id).then(merged => {
        if (live && merged) setWorkouts(merged);
      });
      return () => { live = false; };
    }
  }, [athlete?.id]);
  const saveWorkouts = (next) => {
    if (!athlete) return;
    setWorkouts(next);
    try { localStorage.setItem(workoutsKey(athlete.id), JSON.stringify(next)); } catch {}
  };
  const addWorkout = (w) => {
    const entry = { id: Date.now(), ...w };
    // The other half of activation: the first workout an athlete ever logs.
    // Checked before the save so `workouts` is still the pre-write list.
    if (workouts.length === 0) track('first_workout_logged', { type: entry.type ?? null });
    saveWorkouts([entry, ...workouts]);
    if (athlete && athlete.code) {
      sync.logWorkout({
        athleteCode: athlete.code, athleteAppId: athlete.id, localId: entry.id,
        type: entry.type, durationMin: entry.duration ?? null,
        intensity: entry.intensity ?? null, notes: entry.notes ?? null,
        performedAt: new Date(entry.date || Date.now()).toISOString(),
      });
    }
  };
  const removeWorkout = (id) => saveWorkouts(workouts.filter(w => w.id !== id));

  /* Per-drill log. Same local-first shape as workouts: written to
     localStorage immediately so the progress tab updates on the tap,
     pushed to the server after, queued for retry when offline. */
  const [drillSessions, setDrillSessions] = useState([]);
  useEffect(() => {
    if (!athlete) { setDrillSessions([]); return; }
    setDrillSessions(loadDrillSessionsFor(athlete.id));
    if (athlete.code) {
      let live = true;
      sync.fetchDrillSessions(athlete.code, athlete.id).then(merged => {
        if (live && merged) setDrillSessions(merged);
      });
      return () => { live = false; };
    }
  }, [athlete?.id]);
  const logDrillSession = ({ drillId, reps, notes }) => {
    if (!athlete) return;
    // Both fields optional: one tap with nothing filled in is a real log.
    const entry = {
      id: Date.now(), drillId,
      date: new Date().toISOString(),
      reps: reps ?? null,
      notes: notes?.trim() ? notes.trim() : null,
    };
    const next = [entry, ...drillSessions];
    setDrillSessions(next);
    try { localStorage.setItem(drillSessionsKey(athlete.id), JSON.stringify(next)); } catch {}
    if (athlete.code) {
      sync.logDrillSession({
        athleteCode: athlete.code, athleteAppId: athlete.id, localId: entry.id,
        drillId: entry.drillId, reps: entry.reps, notes: entry.notes,
        completedAt: entry.date,
      });
    }
  };

  // Detect what the athlete has done so achievements can unlock honestly.
  // The feed is shared across athletes on the device, so First Post only
  // counts posts THIS athlete authored. Legacy posts with no authorId
  // stay unattributed and count for nobody.
  const [hasPosts, setHasPosts] = useState(false);
  useEffect(() => {
    if (!athlete) { setHasPosts(false); return; }
    try {
      const posts = JSON.parse(localStorage.getItem('coachme_posts') || '[]');
      setHasPosts(Array.isArray(posts) && posts.some(p => p && p.authorId === athlete.id));
    } catch {}
  }, [tab, athlete?.id]); // re-check when switching tabs

  // Hydrate "has messaged a coach" from the persisted threads so the
  // Coached Up achievement stays unlocked across page reloads, not just
  // while a conversation is open in memory.
  const [messagedCoachEver, setMessagedCoachEver] = useState(false);
  useEffect(() => {
    if (!athlete) { setMessagedCoachEver(false); return; }
    try {
      const threads = loadThreads();
      setMessagedCoachEver(threads.some(t =>
        typeof t.id === 'string' && t.id.startsWith(`${athlete.id}::`) &&
        Array.isArray(t.messages) && t.messages.some(m => m.from === 'athlete')
      ));
    } catch {}
  }, [athlete, conversations, tab]);

  // On login or reload, pull this athlete's threads into the Messages tab
  // so coach messages (including brand-new "I want to coach you" intros)
  // are waiting for them with an unread badge. With the cloud on, threads
  // from other devices merge in too.
  useEffect(() => {
    if (!athlete) return;
    const hydrate = () => {
      try {
        const threads = loadThreads().filter(t => typeof t.id === 'string' && t.id.startsWith(`${athlete.id}::`));
        if (!threads.length) return;
        setConversations(prev => {
          const next = { ...prev };
          threads.forEach(t => {
            const messages = t.messages.map(m => ({
              id: m.id,
              from: m.from === 'athlete' ? 'me' : 'trainer',
              text: m.text,
              ts: new Date(m.ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
            }));
            let unread = 0;
            for (let i = messages.length - 1; i >= 0; i--) {
              if (messages[i].from === 'trainer') unread++;
              else break;
            }
            next[t.coachId] = { trainerId: t.coachId, online: false, unread, messages };
          });
          return next;
        });
      } catch {}
    };
    hydrate();
    // Server sync: one-time import of this device's pre-cloud history,
    // retry of queued offline writes, then pull threads from the server
    // (sync merges them into coachme_threads) and re-hydrate.
    if (athlete.code) {
      (async () => {
        try {
          await sync.importOnFirstConnect(athlete, 'athlete');
          await sync.flushPendingSync();
          const merged = await sync.fetchThreads(athlete.code);
          if (merged) hydrate();
        } catch {}
      })();
    }
  }, [athlete]);

  const switchTab = (t) => {
    if (t === tab) return;
    setTabAnim(true);
    setTimeout(() => { setTab(t); setTabAnim(false); }, 150);
  };

  const openTrainer = (id) => setTrainerOpen(id);
  const closeTrainer = () => setTrainerOpen(null);

  const startBook = (trainer, mode) => {
    setBooking({ trainer, mode: mode || (trainer.modes && trainer.modes[0]) });
  };

  const openChat = (trainerId) => {
    setChatOpen(trainerId);
    setTrainerOpen(null);
    // Hydrate from the shared thread store so any coach replies show up.
    const stored = athlete ? threadToConversation(athlete.id, trainerId) : [];
    setConversations(prev => {
      const existing = prev[trainerId];
      return {
        ...prev,
        [trainerId]: {
          trainerId,
          // Default offline. Real presence comes with Supabase Phase 1.
          online: existing?.online ?? false,
          unread: 0,
          messages: stored.length ? stored : (existing?.messages || []),
        },
      };
    });
  };

  const sendMessage = (trainerId, text) => {
    const newMsg = {
      id: Date.now(),
      from: 'me',
      text,
      ts: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    };
    setConversations(prev => {
      const conv = prev[trainerId] || { trainerId, online: false, unread: 0, messages: [] };
      return { ...prev, [trainerId]: { ...conv, messages: [...conv.messages, newMsg] } };
    });
    // Persist to the shared store so the coach sees it in their dashboard.
    if (athlete) {
      const coach = allTrainers.find(t => t.id === trainerId);
      pushAthleteMessage(athlete, trainerId, coach?.name || 'Coach', text);
      // Push to the server so the coach gets it on ANY device. Queued for
      // retry automatically when offline or the cloud is disabled. If the
      // safety layer refuses it, take the local copy back and explain
      // calmly in the thread.
      if (athlete.code && coach?.code) {
        sync.sendMessage({
          athleteCode: athlete.code, coachCode: coach.code,
          senderCode: athlete.code, body: text,
          legacyKey: makeThreadId(athlete.id, trainerId),
        }).then(res => {
          if (res && res.status === 'refused') {
            removeLastLocalAthleteMessage(athlete.id, trainerId, text);
            setConversations(prev => {
              const conv = prev[trainerId];
              if (!conv) return prev;
              return {
                ...prev,
                [trainerId]: {
                  ...conv,
                  messages: conv.messages
                    .filter(m => !(m.id === newMsg.id && m.text === text))
                    .concat({ id: `notice-${Date.now()}`, type: 'safety_notice', text: res.message }),
                },
              };
            });
          }
        });
      }
    }
    // Real replies come from the coach on the other end (via /coach). No fake auto-reply.
  };

  // Cross-device replies: while a conversation is open, poll the server
  // thread every 5 seconds (no client-side supabase, no Realtime — plain
  // polling against our API is enough for this phase).
  useEffect(() => {
    if (!chatOpen || !athlete || !athlete.code) return;
    const coach = allTrainers.find(t => t.id === chatOpen);
    if (!coach?.code) return;
    let live = true;
    const poll = async () => {
      const rec = await sync.openThread({
        athleteCode: athlete.code, coachCode: coach.code,
        legacyKey: makeThreadId(athlete.id, chatOpen),
      });
      if (!live || !rec) return;
      const messages = rec.messages.map(m => ({
        id: m.id,
        from: m.from === 'athlete' ? 'me' : 'trainer',
        text: m.text,
        ts: new Date(m.ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      }));
      setConversations(prev => {
        const existing = prev[chatOpen];
        if (existing && existing.messages.length >= messages.length) return prev;
        return {
          ...prev,
          [chatOpen]: { trainerId: chatOpen, online: existing?.online ?? false, unread: 0, messages },
        };
      });
    };
    poll();
    const timer = setInterval(poll, 5000);
    return () => { live = false; clearInterval(timer); };
  }, [chatOpen, athlete]);

  // Live sync: when the coach replies in another tab, refresh every
  // conversation for this athlete (not just the open chat) so the
  // Messages tab last-message preview and the open chat both update.
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== 'coachme_threads' || !athlete) return;
      const threads = loadThreads();
      const myThreads = threads.filter(t => typeof t.id === 'string' && t.id.startsWith(`${athlete.id}::`));
      setConversations(prev => {
        const next = { ...prev };
        myThreads.forEach(t => {
          const messages = t.messages.map(m => ({
            id: m.id,
            from: m.from === 'athlete' ? 'me' : 'trainer',
            text: m.text,
            ts: new Date(m.ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          }));
          const existing = prev[t.coachId];
          let unread = 0;
          for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].from === 'trainer') unread++;
            else break;
          }
          next[t.coachId] = {
            trainerId: t.coachId,
            online: existing?.online ?? false,
            unread: chatOpen === t.coachId ? 0 : unread,
            messages,
          };
        });
        return next;
      });
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [athlete, chatOpen]);

  const startCall = (trainerId) => {
    setCallOpen(trainerId);
    setTrainerOpen(null);
    setChatOpen(null);
    if (!conversations[trainerId]) {
      setConversations(prev => ({
        ...prev,
        [trainerId]: { trainerId, online: true, unread: 0, messages: [] },
      }));
    }
  };

  const totalUnread = Object.values(conversations).reduce((s, c) => s + (c.unread || 0), 0);

  const phoneStyles = `
    * { -webkit-tap-highlight-color: transparent; }
    .display { font-family: var(--font-display), sans-serif; letter-spacing: -0.01em; font-weight: 600; }
    .body { font-family: var(--font-body), system-ui, sans-serif; }
    .mono { font-family: var(--font-mono), 'JetBrains Mono', monospace; }
  .wide { font-family: var(--font-wide), sans-serif; letter-spacing: 0.14em; text-transform: uppercase; }
    /* Verification stamp: the scouting-report chip (docs/design-system.md).
       Clay = earned verification; the app inherits voice, not costume. */
    .stamp {
      font-family: var(--font-wide), sans-serif;
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 8.5px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
      border: 1px solid currentColor; border-radius: 3px;
      padding: 4px 8px; line-height: 1; transform: rotate(-1.4deg);
      color: rgba(242, 239, 230, 0.62);
    }
    .stamp--flat { transform: none; }
    .stamp--clay { color: #C96F4A; }
    .stamp--lime { color: #C5FF3D; }
    .phone { -webkit-font-smoothing: antialiased; touch-action: manipulation; }
    .phone *::selection { background: #C5FF3D; color: #000; }
    .phone-scroll::-webkit-scrollbar { display: none; }
    .phone-scroll { -ms-overflow-style: none; scrollbar-width: none; overscroll-behavior: contain; }

    /* Full-viewport app shell at every width. The document never scrolls;
       the app scrolls inside .phone-scroll. Safe-area insets (notches) are
       owned by the shell, so the body padding from the root layout is
       zeroed while this app is mounted. */
    body { padding: 0 !important; }
    .phone {
      min-height: 100vh; min-height: 100dvh;
      height: 100vh; height: 100dvh;
      padding-top: env(safe-area-inset-top);
      padding-bottom: env(safe-area-inset-bottom);
    }
    /* Real phones: 16px inputs stop iPhones from zooming in on every field. */
    @media (max-width: 480px) {
      .phone input, .phone select, .phone textarea { font-size: 16px !important; }
    }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes slideUpMsg { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes slideRight { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes pulseRing { 0% { box-shadow: 0 0 0 0 rgba(197,255,61,0.5); } 70% { box-shadow: 0 0 0 14px rgba(197,255,61,0); } 100% { box-shadow: 0 0 0 0 rgba(197,255,61,0); } }
    @keyframes pulseRingRed { 0% { box-shadow: 0 0 0 0 rgba(255,68,68,0.5); } 70% { box-shadow: 0 0 0 12px rgba(255,68,68,0); } 100% { box-shadow: 0 0 0 0 rgba(255,68,68,0); } }
    @keyframes confetti { 0% { transform: translate(0,0) rotate(0deg); opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)) rotate(var(--r)); opacity: 0; } }
    @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }
    @keyframes typingDot { 0%, 60%, 100% { opacity: 0.3; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }
    @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
    .fade-up { animation: fadeUp 0.4s ease-out both; }
    .fade-in { animation: fadeIn 0.5s ease-out both; }
    .slide-up { animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
    .slide-up-msg { animation: slideUpMsg 0.25s ease-out both; }
    .slide-right { animation: slideRight 0.3s ease-out both; }
    .pulse-ring { animation: pulseRing 2s infinite; }
    .pulse-ring-red { animation: pulseRingRed 1.5s infinite; }
    .pulse-dot { animation: pulseDot 1.8s infinite; }
    .typing-dot { animation: typingDot 1.2s infinite; }
    .tab-fade { transition: opacity 0.15s ease; }
    .tab-fade.out { opacity: 0; }

    /* ============================================================
       RESPONSIVE TIERS
       phone <=640px | tablet 641-1023px | desktop >=1024px
       ============================================================ */

    /* Signed-in shell: scroll area + nav. Column (nav = bottom bar) on
       phone/tablet, row (nav = left sidebar) on desktop. */
    .app-body { flex: 1; min-height: 0; display: flex; flex-direction: column; }

    /* Per-tab content container. */
    .view { width: 100%; margin: 0 auto; }

    /* Tab title (FIND A TRAINER etc). */
    .view-title { font-size: 36px; line-height: 1; margin-bottom: 4px; }

    /* Horizontal-scroll card rows (featured trainers, drill library).
       Base = phone/tablet swipe rows; desktop reflows them. */
    .featured-row { display: flex; gap: 12px; overflow-x: auto; padding: 12px 16px 16px; }
    .drill-row { display: flex; gap: 10px; overflow-x: auto; padding: 10px 16px 18px; }
    /* Drill library browse grid: 2-up on phone/tablet, 3-up on desktop. */
    .drill-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 4px 16px 18px; }

    /* 44px-ish touch targets for small icon buttons (close, delete):
       the negative margin keeps the visual footprint where it was. */
    .tap {
      padding: 12px; margin: -8px;
      background: none; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    /* Landing (signed-out welcome). Stacked banner-over-content on
       phone/tablet, split hero (content left, stadium right) on desktop. */
    .landing { flex: 1; min-height: 0; display: flex; flex-direction: column; position: relative; overflow: hidden; }
    .landing-media { height: 300px; position: relative; flex-shrink: 0; }
    .landing-body { flex: 1; display: flex; flex-direction: column; padding: 20px 24px 28px; overflow-y: auto; }
    .landing-title { font-size: 48px; line-height: 0.92; text-transform: uppercase; margin-bottom: 12px; }

    /* Nav: base = bottom tab bar. */
    .app-nav {
      flex-shrink: 0; display: flex;
      border-top: 1px solid #1F1F25;
      background: rgba(10,10,11,0.92);
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    }
    .app-nav-brand, .app-nav-signout { display: none; }
    .app-nav-tabs { flex: 1; min-width: 0; display: flex; justify-content: space-around; padding: 12px 2px 18px; }
    .app-nav-btn {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      background: none; border: none; cursor: pointer; padding: 6px;
      color: #5F636B; position: relative; transition: color 0.15s, background 0.15s; min-width: 0;
      font-size: 9px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    }
    .app-nav-btn.is-active { color: #C5FF3D; }
    .app-nav-ind { position: absolute; bottom: -12px; width: 20px; height: 2px; background: #C5FF3D; border-radius: 2px; }

    /* Sheets: bottom sheets on phone/tablet, centered dialogs on desktop. */
    .sheet-backdrop {
      position: absolute; inset: 0; background: rgba(0,0,0,0.6);
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      display: flex; align-items: flex-end;
    }
    .sheet-panel {
      width: 100%; background: var(--km-card); position: relative;
      border-top-left-radius: 24px; border-top-right-radius: 24px;
      border-top: 1px solid #2A2A30;
    }
    .sheet-handle {
      position: absolute; top: 8px; left: 50%; transform: translateX(-50%);
      width: 36px; height: 4px; background: #3A3A42; border-radius: 999px;
    }

    /* Full-screen overlays (trainer detail, chat): whole screen on
       phone/tablet, centered modal over a dimmed backdrop on desktop. */
    .modal-backdrop { position: absolute; inset: 0; }
    .modal-panel {
      position: absolute; inset: 0; background: #0A0A0B;
      display: flex; flex-direction: column; overflow: hidden;
    }

    @media (min-width: 641px) {
      .view { max-width: 720px; }
      .view-title { font-size: 44px; }
      .landing-media { height: 340px; }
      .landing-body { width: 100%; max-width: 640px; margin: 0 auto; }
      .su-step { width: 100%; max-width: 560px; margin: 0 auto; }
    }

    @media (min-width: 1024px) {
      .view { max-width: 1100px; }
      .view--feed { max-width: 600px; }
      .view--messages, .view--sessions { max-width: 700px; }
      .view-title { font-size: 52px; }

      .app-body { flex-direction: row; }
      .app-nav {
        order: -1; flex-direction: column; width: 230px;
        border-top: none; border-right: 1px solid #1F1F25;
        padding: 22px 14px 18px; gap: 10px;
      }
      .app-nav-brand { display: block; font-size: 30px; line-height: 1; padding: 4px 12px 16px; }
      .app-nav-tabs { flex-direction: column; justify-content: flex-start; gap: 4px; padding: 0; }
      .app-nav-btn { flex-direction: row; gap: 12px; width: 100%; padding: 12px; border-radius: 12px; font-size: 11px; }
      .app-nav-btn.is-active { background: rgba(197,255,61,0.08); }
      .app-nav-ind { display: none; }
      .app-nav-signout {
        display: flex; align-items: center; gap: 12px; width: 100%;
        background: none; border: 1px solid #2A2A30; border-radius: 12px;
        padding: 12px; color: #5F636B; cursor: pointer;
        font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;
        transition: color 0.15s, border-color 0.15s;
      }

      .profile-name { font-size: 40px !important; }

      /* Grids that widen on desktop. */
      .stats-grid { grid-template-columns: repeat(4, 1fr) !important; }
      .ach-grid { grid-template-columns: repeat(4, 1fr) !important; }
      .trainer-list { display: grid !important; grid-template-columns: 1fr 1fr; align-items: start; }
      .featured-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); overflow: visible; }
      .drill-row { flex-wrap: wrap; overflow: visible; }
      .drill-grid { grid-template-columns: repeat(3, 1fr); gap: 12px; }

      .sheet-backdrop { align-items: center; justify-content: center; padding: 32px; }
      .sheet-panel { max-width: 560px; border-radius: 24px; border: 1px solid #2A2A30; }
      .sheet-panel--wide { max-width: 660px; }
      .sheet-handle { display: none; }
      /* Centered dialogs fade in; sliding from the bottom is a sheet move. */
      .sheet-panel.slide-up { animation-name: fadeUp; animation-duration: 0.25s; }

      .modal-backdrop {
        background: rgba(0,0,0,0.6);
        backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
      }
      .modal-panel {
        inset: auto; position: relative;
        width: min(680px, 92vw); height: min(860px, 90vh);
        border-radius: 24px; border: 1px solid #2A2A30;
        box-shadow: 0 40px 120px rgba(0,0,0,0.7);
      }
      /* Sliding up from the bottom of a centered modal looks wrong;
         fade the panel in instead on desktop. */
      .modal-panel.slide-up { animation-name: fadeUp; animation-duration: 0.25s; }
    }

    @media (min-width: 1024px) {
      /* Split hero: content column left, stadium media right. */
      .landing { display: grid; grid-template-columns: minmax(500px, 46%) 1fr; grid-template-rows: minmax(0, 1fr); }
      .landing-media { grid-column: 2; grid-row: 1; height: 100%; }
      .landing-media::after {
        content: ''; position: absolute; inset: 0; z-index: 2; pointer-events: none;
        background: linear-gradient(90deg, #0A0A0B 0%, rgba(10,10,11,0) 40%);
      }
      .landing-body { grid-column: 1; grid-row: 1; align-self: center; justify-self: center; max-width: 560px; padding: 48px; }
      .landing-title { font-size: 72px; }
    }

    /* ============================================================
       DRILL DETAIL
       Depth comes from surface steps, never borders or shadows
       (docs/design-system.md): panel km-raised -> block km-card ->
       card km-high. Headlines Clash, eyebrows/labels Panchang,
       numbers Mono, prose Archivo.
       ============================================================ */

    /* The app does not load marketing.css; FieldGeo needs its wrapper
       positioned here too. Keep in sync with .mk-geo there. */
    .mk-geo { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
    .mk-geo svg { position: absolute; }

    /* Own scroll container: the desktop sticky video sticks to this. */
    .sheet-panel--drill { background: var(--km-raised); max-height: 92%; overflow-y: auto; }
    .drill-inner { position: relative; z-index: 1; padding: 18px 16px 24px; }

    .drill-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .drill-head-side { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .drill-eyebrow { font-size: 9.5px; color: #9CA0A8; letter-spacing: 0.1em; margin-bottom: 7px; }
    .drill-title { font-size: 30px; line-height: 0.95; text-transform: uppercase; margin: 0; }

    /* Tabs: a surface step, not a bordered strip. */
    .drill-tabbar {
      display: flex; gap: 4px; margin: 18px 0 4px; padding: 4px;
      background: var(--km-card); border-radius: 12px;
    }
    /* Tighter than the .wide default so all three labels fit unclipped
       across a 390px phone — "MY PROGRESS" is the constraint. */
    .drill-tab {
      flex: 1; min-width: 0; padding: 10px 4px; border: none; border-radius: 9px;
      background: none; color: #9CA0A8; cursor: pointer;
      font-size: 8.5px; letter-spacing: 0.1em; line-height: 1; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis; transition: background 0.15s, color 0.15s;
    }
    .drill-tab.is-active { background: var(--km-high); color: var(--km-chalk); }

    .drill-media { margin-top: 18px; }
    .drill-cliplabel { font-size: 10px; color: #9CA0A8; letter-spacing: 0.14em; margin: 14px 0 8px; }
    .drill-cliplabel:first-child { margin-top: 0; }
    .drill-video {
      width: 100%; aspect-ratio: 16 / 9; display: block; padding: 0;
      border: none; border-radius: 14px; background: #000; overflow: hidden;
      object-fit: contain;
    }
    .drill-poster { position: relative; cursor: pointer; }
    .drill-poster img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .drill-play {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 52px; height: 52px; border-radius: 50%; background: rgba(197,255,61,0.94);
      display: flex; align-items: center; justify-content: center; padding-left: 3px;
    }

    /* Pro gate: the clips lock, the written how-to never does. */
    .drill-locked { position: relative; border-radius: 14px; overflow: hidden; }
    .drill-locked img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; display: block; filter: blur(3px) brightness(0.45); }
    .drill-locked-body {
      position: absolute; inset: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 10px; padding: 20px; text-align: center;
    }
    .drill-locked-icon {
      width: 44px; height: 44px; border-radius: 50%; background: rgba(197,255,61,0.92);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; /* the column squashes it into an ellipse otherwise */
    }

    .drill-coach { display: flex; align-items: center; gap: 10px; margin-top: 14px; }
    .drill-coach img { width: 38px; height: 38px; border-radius: 11px; object-fit: cover; display: block; flex-shrink: 0; }
    .drill-coach-name { display: block; font-size: 13px; line-height: 1; text-transform: uppercase; color: var(--km-chalk); }
    .drill-coach-style { display: block; font-size: 8.5px; color: #5F636B; letter-spacing: 0.08em; margin-top: 4px; }
    .drill-ai-note { font-size: 11px; color: #9CA0A8; line-height: 1.45; margin: 10px 0 0; }

    .drill-panels { margin-top: 20px; }
    .drill-summary { font-size: 14px; color: #D4D6DA; line-height: 1.6; margin: 0 0 22px; }

    /* Every section is one raised block; the gap between blocks is the
       separator, so no rules or borders are needed. */
    .drill-block { background: var(--km-card); border-radius: 16px; padding: 18px 16px; margin-bottom: 14px; }
    .drill-section-head { margin-bottom: 14px; }
    .drill-section-title { font-size: 19px; line-height: 1; text-transform: uppercase; margin: 9px 0 0; color: var(--km-chalk); }

    .drill-chips { display: flex; flex-wrap: wrap; gap: 8px; }

    .drill-facts { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .drill-fact { display: flex; align-items: flex-start; gap: 9px; background: var(--km-high); border-radius: 12px; padding: 11px 12px; }
    .drill-fact-icon { display: flex; align-items: center; justify-content: center; width: 18px; flex-shrink: 0; margin-top: 1px; }
    .drill-fact-label { display: block; font-size: 8px; color: #5F636B; }
    .drill-fact-value { display: block; font-size: 11.5px; color: var(--km-chalk); margin-top: 5px; line-height: 1.35; word-break: break-word; }
    /* Manifest values are written lowercase ("beginner", "backyard");
       sentence-case them for display without touching the data. */
    .drill-fact-value::first-letter { text-transform: uppercase; }

    /* Stepper: the numeral is the anchor, so it gets the Mono weight. */
    .drill-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
    .drill-step { display: flex; gap: 13px; background: var(--km-high); border-radius: 12px; padding: 14px; }
    .drill-step-n { font-size: 22px; line-height: 1; color: #C5FF3D; font-weight: 700; flex-shrink: 0; width: 30px; }
    .drill-step-title { display: block; font-size: 15px; line-height: 1; text-transform: uppercase; color: var(--km-chalk); }
    .drill-step-detail { display: block; font-size: 13px; color: #9CA0A8; line-height: 1.55; margin-top: 7px; }

    .drill-mistakes { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
    .drill-mistake { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; background: var(--km-high); border-radius: 12px; overflow: hidden; }
    .drill-mistake-side { padding: 13px; display: block; min-width: 0; }
    .drill-mistake-side--fix { background: rgba(197,255,61,0.07); }
    .drill-mistake-label { display: block; font-size: 8px; color: #5F636B; }
    .drill-mistake-label--fix { color: #C5FF3D; }
    .drill-mistake-text { display: block; font-size: 12.5px; color: #9CA0A8; line-height: 1.5; margin-top: 7px; }
    .drill-mistake-text--fix { color: var(--km-chalk); font-weight: 600; }

    .drill-related { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .drill-related-card {
      display: block; text-align: left; padding: 0 0 11px; cursor: pointer;
      background: var(--km-high); border: 1px solid transparent; border-radius: 12px; overflow: hidden;
    }
    .drill-related-card img { width: 100%; aspect-ratio: 2 / 1; object-fit: cover; display: block; margin-bottom: 9px; }
    .drill-related-title { display: block; padding: 0 10px; font-size: 14px; line-height: 1.05; text-transform: uppercase; color: var(--km-chalk); }
    .drill-related-meta { display: block; padding: 0 10px; font-size: 8px; color: #5F636B; letter-spacing: 0.1em; margin-top: 5px; }

    /* Logging: one primary action, always reachable, never plan-gated. */
    .drill-actions { margin-top: 16px; }
    .drill-log-btn {
      width: 100%; background: #C5FF3D; color: #000; border: none;
      padding: 14px; border-radius: 999px; font-weight: 700; font-size: 14px; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    }
    .drill-logged {
      display: flex; align-items: center; gap: 8px; margin-top: 10px;
      padding: 10px 12px; border-radius: 10px; background: rgba(197,255,61,0.09);
      font-size: 12.5px; color: var(--km-chalk); line-height: 1.4;
    }
    .drill-logged-xp { color: #C5FF3D; font-size: 10px; letter-spacing: 0.1em; margin-left: 8px; font-weight: 700; }

    /* Progress numbers: Mono, because they are stats. */
    .drill-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .drill-stat { background: var(--km-high); border-radius: 12px; padding: 14px 10px; text-align: center; }
    .drill-stat-value { display: block; font-size: 26px; line-height: 1; color: #C5FF3D; font-weight: 700; }
    .drill-stat-label { display: block; font-size: 8px; color: #5F636B; margin-top: 8px; }

    .drill-pb { background: var(--km-high); border-radius: 12px; padding: 16px; }
    .drill-pb-value { display: block; font-size: 32px; line-height: 1; color: var(--km-chalk); font-weight: 700; }
    .drill-pb-unit { font-size: 14px; color: #9CA0A8; margin-left: 4px; }
    .drill-pb-label { display: block; font-size: 8.5px; color: #C96F4A; margin-top: 9px; }

    .drill-log { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    .drill-log-row { display: flex; gap: 12px; background: var(--km-high); border-radius: 10px; padding: 11px 12px; }
    .drill-log-date { font-size: 9.5px; color: #5F636B; letter-spacing: 0.1em; width: 52px; flex-shrink: 0; padding-top: 2px; }
    .drill-log-reps { display: block; font-size: 11px; color: var(--km-chalk); letter-spacing: 0.1em; font-weight: 700; }
    .drill-log-note { display: block; font-size: 12px; color: #9CA0A8; line-height: 1.45; margin-top: 5px; }

    .drill-empty { text-align: center; padding: 34px 20px; }
    .drill-empty-icon {
      width: 52px; height: 52px; border-radius: 16px; background: var(--km-high);
      display: inline-flex; align-items: center; justify-content: center; margin-bottom: 14px;
    }
    .drill-empty-title { font-size: 19px; line-height: 1; text-transform: uppercase; }
    .drill-empty-sub { font-size: 13px; color: #9CA0A8; line-height: 1.5; margin: 9px auto 0; max-width: 280px; }

    /* Tier 2 — tablet: the sheet gets room, facts go four-up. */
    @media (min-width: 641px) {
      .drill-inner { padding: 20px 22px 28px; }
      .drill-title { font-size: 36px; }
      .drill-facts { grid-template-columns: repeat(4, 1fr); }
      .drill-related { grid-template-columns: repeat(4, 1fr); }
      .drill-tab { font-size: 10px; letter-spacing: 0.14em; padding: 11px 8px; }
    }

    /* Tier 3 — desktop: two columns, video sticky on the left while the
       tab content scrolls beside it. The media block is always visible
       here; on phone/tablet it belongs to the Overview tab. */
    @media (min-width: 1024px) {
      .sheet-panel--drill { max-width: 1040px; }
      .drill-inner { padding: 26px 30px 32px; }
      .drill-title { font-size: 42px; }
      .drill-detail {
        display: grid; grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
        column-gap: 28px; align-items: start; margin-top: 6px;
      }
      .drill-aside { grid-column: 1; grid-row: 1 / span 2; margin-top: 8px; position: sticky; top: 8px; }
      .drill-media { margin-top: 0; }
      .drill-tabbar { grid-column: 2; grid-row: 1; margin-top: 0; }
      .drill-panels { grid-column: 2; grid-row: 2; margin-top: 16px; }
      .drill-facts { grid-template-columns: 1fr 1fr; }
      .drill-related { grid-template-columns: 1fr 1fr; }
      .drill-step-n { font-size: 26px; width: 34px; }
    }

    /* Phone/tablet: the video belongs to Overview, but the log action
       stays put on every tab. Desktop shows both always (rules above),
       so this is scoped away from wide screens. */
    @media (max-width: 1023px) {
      .drill-detail:not([data-tab="overview"]) .drill-media { display: none; }
      .drill-detail:not([data-tab="overview"]) .drill-aside { margin-bottom: 4px; }
    }

    /* Pointer feedback on devices that hover, consistent with the
       existing pressed states. */
    @media (hover: hover) {
      .card-hover { transition: border-color 0.15s, background 0.15s; }
      .card-hover:hover { border-color: #4A4A54 !important; }
      .app-nav-btn:hover { color: var(--km-chalk); background: rgba(255,255,255,0.05); }
      .app-nav-btn.is-active:hover { color: #C5FF3D; background: rgba(197,255,61,0.08); }
      .app-nav-signout:hover { color: var(--km-chalk); border-color: #3A3A42; }
      .drill-tab:hover { color: var(--km-chalk); }
      .drill-related-card:hover { border-color: #4A4A54; }
      .drill-poster:hover .drill-play { background: #C5FF3D; }
    }
  `;

  return (
    <div className="phone-stage" style={{ background: '#0A0A0B', minHeight: '100vh', display: 'flex', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <style>{phoneStyles}</style>

      <div className="phone" style={{
        width: '100%', background: '#0A0A0B',
        position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        color: 'var(--km-chalk)',
      }}>
        {!athlete ? (
          <SignUpFlow onComplete={completeSignup} savedAthlete={savedAthlete} onLogin={loginSavedAthlete} onCodeLogin={completeSignup} deviceAthletes={deviceAthletes} deviceCoaches={deviceCoaches} onPickAthlete={pickDeviceAthlete} onPickCoach={pickDeviceCoach} />
        ) : (
          <>
            <div className="app-body">
              <div className="phone-scroll" style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
                <div className={`tab-fade ${tabAnim ? 'out' : ''}`}>
                  {tab === 'profile' && <ProfileView athlete={athlete} trainerIds={trainerIds} trainers={allTrainers} workouts={workouts} drillSessions={drillSessions} hasPosts={hasPosts} hasMessagedCoach={messagedCoachEver} onOpenTrainer={openTrainer} onGoToTrainers={() => switchTab('trainers')} onOpenChat={openChat} onLogWorkout={() => setLogWorkoutOpen(true)} onRemoveWorkout={removeWorkout} onSignOut={signOut}/>}
                  {tab === 'trainers' && <TrainersView onOpenTrainer={openTrainer} athlete={athlete} trainers={allTrainers} onOpenDrill={setDrillOpen}/>}
                  {tab === 'community' && <CommunityView athlete={athlete}/>}
                  {tab === 'messages' && <MessagesView conversations={conversations} trainers={allTrainers} blockedIds={blockedIds} onOpenChat={openChat} onGoToTrainers={() => switchTab('trainers')}/>}
                  {tab === 'sessions' && <SessionsView athlete={athlete} onGoToTrainers={() => switchTab('trainers')}/>}
                </div>
              </div>

              <AppNav tab={tab} switchTab={switchTab} unread={totalUnread} onSignOut={signOut} />
            </div>

            {trainerOpen && (
              <TrainerDetail
                trainer={allTrainers.find(t => t.id === trainerOpen)}
                onClose={closeTrainer}
                onBook={startBook}
                onMessage={openChat}
                onCall={startCall}
              />
            )}

            {chatOpen && (
              <ChatView
                trainer={allTrainers.find(t => t.id === chatOpen)}
                conversation={conversations[chatOpen]}
                athlete={athlete}
                blocked={blockedIds.includes(chatOpen)}
                onBlock={() => blockCoach(chatOpen)}
                onClose={() => setChatOpen(null)}
                onSend={(text) => sendMessage(chatOpen, text)}
                onCall={() => startCall(chatOpen)}
              />
            )}

            {callOpen && (
              <VideoCallView
                trainer={allTrainers.find(t => t.id === callOpen)}
                athlete={athlete}
                onClose={() => setCallOpen(null)}
              />
            )}

            {booking && (
              <BookingFlow
                booking={booking}
                athlete={athlete}
                onClose={() => setBooking(null)}
                onMessageCoach={(coachId) => { setBooking(null); openChat(coachId); }}
              />
            )}

            {drillOpen && (
              /* key: opening a related drill swaps the drill in place, and
                 the tab/player state must reset with it. */
              <DrillSheet
                key={drillOpen.id}
                drill={drillOpen}
                athleteId={athlete?.id}
                athleteStats={athlete?.stats}
                sessions={drillSessions}
                onLogDrill={logDrillSession}
                onOpenDrill={setDrillOpen}
                onClose={() => setDrillOpen(null)}
              />
            )}

            {logWorkoutOpen && (
              <LogWorkoutModal
                onClose={() => setLogWorkoutOpen(false)}
                onSave={(w) => { addWorkout(w); setLogWorkoutOpen(false); }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   SIGN UP FLOW
   ============================================================ */
function SignUpFlow({ onComplete, savedAthlete, onLogin, onCodeLogin, deviceAthletes, deviceCoaches, onPickAthlete, onPickCoach }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    firstName: '', lastName: '',
    sport: 'Baseball', position: '',
    age: '',
    city: '', state: 'FL',
    exitVelo: '', sixtyYd: '', throwVelo: '', popTime: '',
  });

  const upd = (field, value) => setForm(f => ({ ...f, [field]: value }));

  // The marketing site's "Get started free" links to /app?signup=1: jump
  // straight to the first form step (one tap shorter than landing on the
  // welcome screen first).
  //
  // Public drill pages add &sport=softball, so an athlete who arrived from
  // a search for one drill does not have to re-answer a question the URL
  // already knows. The value is matched against the real SPORTS list rather
  // than trusted — an unknown ?sport= leaves the default alone instead of
  // putting an invalid sport in the form.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const wanted = (params.get('sport') || '').toLowerCase();
      const matched = SPORTS.find(s => s.name.toLowerCase() === wanted);
      if (matched) setForm(f => ({ ...f, sport: matched.name }));
      if (params.get('signup') === '1') {
        setStep(s => (s === 0 ? 1 : s));
        // trackWhenReady, not track: this fires on mount, before the
        // analytics queue exists, and plain track() is silently discarded
        // there — which is why this event had never actually been
        // recorded. See src/lib/analytics.ts.
        return trackWhenReady('signup_started', {
          source: params.get('from') === 'drill' ? 'drill_page' : 'landing_cta',
          ...(matched ? { sport: matched.name } : {}),
        });
      }
    } catch {}
  }, []);

  const totalSteps = 5;
  const next = () => {
    if (step === 0) track('signup_started', { source: 'app_welcome' });
    // Which step someone abandons on is the only thing that tells us WHERE
    // the form loses people; signup_started and signup_completed together
    // only say that it happened.
    else track('signup_step_completed', { step });
    setStep(s => s + 1);
  };
  const back = () => setStep(s => Math.max(0, s - 1));

  const finish = () => {
    track('signup_completed');
    const initials = (form.firstName[0] || '?') + (form.lastName[0] || '');
    const stats = [];
    BASEBALL_STAT_DEFS.forEach(d => {
      if (form[d.key]) {
        stats.push({
          label: d.label,
          value: parseFloat(form[d.key]),
          unit: d.unit,
          delta: null,
          pct: null,
          verified: 'self',
        });
      }
    });
    onComplete({
      firstName: form.firstName,
      lastName: form.lastName,
      name: `${form.firstName[0]}. ${form.lastName}`,
      initials,
      sport: form.sport,
      position: form.position,
      age: form.age ? parseInt(String(form.age)) : null,
      city: form.city,
      state: form.state,
      location: `${form.city}, ${form.state}`,
      photo: null,
      banner: form.sport === 'Baseball' ? BASEBALL_BANNER : null,
      stats,
      level: 1,
      xp: 0,
      xpMax: 500,
    });
  };

  const nameValid = form.firstName.trim() && form.lastName.trim();
  const sportValid = form.sport && form.position.trim() && form.age;
  const locValid = form.city.trim() && form.state;

  return (
    <div className="fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {step === 0 && <SUWelcome onNext={next} savedAthlete={savedAthlete} onLogin={onLogin} onCodeLogin={onCodeLogin} deviceAthletes={deviceAthletes} deviceCoaches={deviceCoaches} onPickAthlete={onPickAthlete} onPickCoach={onPickCoach}/>}
      {step === 1 && <SUStep title="Who are you?" sub="The basics. We'll fill in the rest." idx={1} total={totalSteps - 1}
        canContinue={nameValid} onNext={next} onBack={back}>
        <SUInput label="FIRST NAME" placeholder="Noah" value={form.firstName} onChange={v => upd('firstName', v)} autoFocus/>
        <SUInput label="LAST NAME" placeholder="Scarlett" value={form.lastName} onChange={v => upd('lastName', v)}/>
      </SUStep>}
      {step === 2 && <SUStep title="What's your sport?" sub="Pick from the list, or choose Other and type your own." idx={2} total={totalSteps - 1}
        canContinue={sportValid} onNext={next} onBack={back}>
        <SUSelectOrType
          label="SPORT"
          value={form.sport}
          onChange={v => { upd('sport', v); upd('position', ''); }}
          options={SPORTS.map(s => ({ value: s.name, label: `${s.icon}  ${s.name}` }))}
          typePlaceholder="What's your sport?"
        />
        {form.sport && (
          POSITIONS_BY_SPORT[form.sport] ? (
            <SUSelectOrType
              key={form.sport}
              label="POSITION"
              value={form.position}
              onChange={v => upd('position', v)}
              options={POSITIONS_BY_SPORT[form.sport].map(p => ({ value: p, label: p }))}
              placeholder="Pick your position"
              typePlaceholder="What position do you play?"
            />
          ) : (
            <SUAutocomplete
              label="POSITION"
              value={form.position}
              onChange={v => upd('position', v)}
              options={[]}
              placeholder="What do you play?"
            />
          )
        )}
        <SUSelectOrType
          label="HOW OLD ARE YOU?"
          value={form.age ? String(form.age) : ''}
          onChange={v => upd('age', v)}
          options={AGES.map(a => ({ value: String(a), label: `${a} years old` }))}
          placeholder="Pick your age"
          typePlaceholder="Your age"
          numeric
        />
      </SUStep>}
      {step === 3 && <SUStep title="Where are you?" sub="Helps us match you with local trainers." idx={3} total={totalSteps - 1}
        canContinue={locValid} onNext={next} onBack={back}>
        <SUAutocomplete
          label="CITY"
          value={form.city}
          onChange={v => upd('city', v)}
          options={CITY_SUGGESTIONS}
          placeholder="Start typing your city"
          autoFocus
        />
        <SUSelect
          label="STATE"
          value={form.state}
          onChange={v => upd('state', v)}
          options={US_STATES.map(s => ({ value: s, label: s }))}
        />
      </SUStep>}
      {step === 4 && <SUStep title="Starting stats?" sub="Optional. Trainers will verify your real numbers in person." idx={4} total={totalSteps - 1}
        canContinue={true} onNext={next} onBack={back} continueLabel={Object.keys(form).filter(k => BASEBALL_STAT_DEFS.find(d => d.key === k) && form[k]).length > 0 ? 'Save my stats' : 'Skip for now'}>
        {form.sport === 'Baseball' ? (
          <>
            <div style={{
              padding: '10px 12px', borderRadius: 10, background: 'rgba(95,99,107,0.1)',
              border: '1px solid #2A2A30', marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span className="mono" style={{
                fontSize: 9, padding: '3px 7px', borderRadius: 4,
                background: '#5F636B', color: '#000', fontWeight: 700, letterSpacing: '0.1em',
              }}>SELF</span>
              <span className="body" style={{ fontSize: 11.5, color: '#9CA0A8', lineHeight: 1.4 }}>
                Anything you enter is marked self-reported until a trainer verifies it.
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {BASEBALL_STAT_DEFS.map(d => (
                <SUStatInput key={d.key} def={d} value={form[d.key]} onChange={v => upd(d.key, v)}/>
              ))}
            </div>
          </>
        ) : (
          <div style={{
            padding: 20, borderRadius: 12, background: '#18181C', border: '1px solid #2A2A30',
            textAlign: 'center',
          }}>
            <div className="display" style={{ fontSize: 22, marginBottom: 6 }}>STATS FOR {form.sport.toUpperCase()} COMING SOON</div>
            <div className="body" style={{ fontSize: 13, color: '#9CA0A8' }}>
              We're rolling out one sport at a time. Baseball is first. You can still set up your profile and message trainers.
            </div>
          </div>
        )}
      </SUStep>}
      {step === 5 && <SUDone form={form} onFinish={finish}/>}
    </div>
  );
}

function SUWelcome({ onNext, savedAthlete, onLogin, onCodeLogin, deviceAthletes = [], deviceCoaches = [], onPickAthlete, onPickCoach }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const athletesShown = deviceAthletes.slice(0, 3);
  const coachesShown = deviceCoaches.slice(0, 2);
  const hasProfiles = athletesShown.length > 0 || coachesShown.length > 0;
  const hiddenCount = (deviceAthletes.length - athletesShown.length) + (deviceCoaches.length - coachesShown.length);
  const displayName = (p) => (p.firstName && p.lastName) ? `${p.firstName} ${p.lastName}` : (p.firstName || p.name);
  return (
    <div className="landing">
      <div className="landing-media">
        <CoverPhoto src={BASEBALL_BANNER} height="100%"
          overlay="linear-gradient(180deg, rgba(10,10,11,0.3) 0%, rgba(10,10,11,1) 100%)" color="#C5FF3D">
          <div style={{ padding: 20, height: '100%', display: 'flex', alignItems: 'flex-end' }}>
            <span className="mono" style={{
              fontSize: 10, color: '#C5FF3D', padding: '5px 10px',
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
              borderRadius: 100, letterSpacing: '0.18em', fontWeight: 700,
              border: '1px solid rgba(197,255,61,0.4)', display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C5FF3D' }} className="pulse-dot"/>
              WELCOME TO KOACHME
            </span>
          </div>
        </CoverPhoto>
      </div>

      <div className="landing-body phone-scroll">
        {/* Brand lockup: the welcome body is the logo's own #0A0A0B, so
            the image sits seamlessly. Fixed size, no layout shift. */}
        <img src="/brand/lockup.png" alt="KoachMe" width={109} height={36}
          style={{ display: 'block', margin: '18px 0 2px' }}/>
        <div className="display landing-title">
          IMPROVE YOUR<br/><span style={{ color: '#C5FF3D' }}>GAME</span>.
        </div>
        <div className="body" style={{ fontSize: 14, color: '#9CA0A8', lineHeight: 1.55, marginBottom: 24 }}>
          The performance graph for emerging athletes. Find a real coach. Train. Track every PR. Climb the ranks.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 'auto' }}>
          {[
            { icon: <UserPlus size={14} color="#C5FF3D"/>, text: 'Set up your athlete profile' },
            { icon: <Search size={14} color="#C5FF3D"/>, text: 'Find proven trainers, including former pros' },
            { icon: <TrendingUp size={14} color="#C5FF3D"/>, text: 'Track verified stats over time' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, background: 'rgba(197,255,61,0.1)',
                border: '1px solid rgba(201,111,74,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>{f.icon}</div>
              <span className="body" style={{ fontSize: 13, color: '#D4D6DA' }}>{f.text}</span>
            </div>
          ))}
        </div>

        {hasProfiles && (
          <div style={{ marginTop: 18 }}>
            <div className="mono" style={{ fontSize: 10, color: '#5F636B', letterSpacing: '0.18em', marginBottom: 8 }}>
              WHO'S PLAYING?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {athletesShown.map(a => (
                <button key={`a-${a.id}`} onClick={() => onPickAthlete(a)} className="body card-hover" style={{
                  width: '100%', cursor: 'pointer', textAlign: 'left',
                  background: 'rgba(197,255,61,0.07)', border: '1px solid rgba(197,255,61,0.4)',
                  borderRadius: 14, padding: '10px 12px',
                  display: 'flex', alignItems: 'center', gap: 11,
                }}>
                  <Avatar initials={a.initials} photo={a.photo} size={38} color="#C5FF3D" square/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--km-chalk)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {displayName(a)}
                    </div>
                    <div className="mono" style={{ fontSize: 9, color: '#9CA0A8', marginTop: 2, letterSpacing: '0.06em' }}>
                      {(a.sport || '').toUpperCase()}{a.position ? ` · ${a.position.toUpperCase()}` : ''}
                    </div>
                  </div>
                  <ArrowRight size={15} color="#C5FF3D"/>
                </button>
              ))}
              {coachesShown.map(c => (
                <button key={`c-${c.id}`} onClick={() => onPickCoach(c)} className="body card-hover" style={{
                  width: '100%', cursor: 'pointer', textAlign: 'left',
                  background: 'rgba(93,169,255,0.07)', border: '1px solid rgba(93,169,255,0.4)',
                  borderRadius: 14, padding: '10px 12px',
                  display: 'flex', alignItems: 'center', gap: 11,
                }}>
                  <Avatar initials={c.initials} size={38} color="#5DA9FF" square/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--km-chalk)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.name}
                    </div>
                    <div className="mono" style={{ fontSize: 9, color: '#5DA9FF', marginTop: 2, letterSpacing: '0.06em' }}>
                      COACH{c.sport ? ` · ${c.sport.toUpperCase()}` : ''}
                    </div>
                  </div>
                  <ArrowRight size={15} color="#5DA9FF"/>
                </button>
              ))}
            </div>
            {hiddenCount > 0 && (
              <div className="body" style={{ fontSize: 11, color: '#5F636B', marginTop: 8, textAlign: 'center' }}>
                {hiddenCount} more profile{hiddenCount !== 1 ? 's' : ''} in Log in
              </div>
            )}
          </div>
        )}

        <button onClick={onNext} style={{
          width: '100%',
          background: hasProfiles ? 'transparent' : '#C5FF3D',
          color: hasProfiles ? 'var(--km-chalk)' : '#000',
          border: hasProfiles ? '1px solid #3A3A42' : 'none',
          padding: '16px 20px', borderRadius: 999, fontWeight: 700, fontSize: 15, cursor: 'pointer',
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
          marginTop: hasProfiles ? 10 : 18,
        }} className="body">
          {hasProfiles ? 'New here? Get started' : 'Sign up as athlete'} <ArrowRight size={16}/>
        </button>

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={() => setLoginOpen(true)} className="body" style={{
            flex: 1, background: 'transparent', color: 'var(--km-chalk)', border: '1px solid #3A3A42',
            padding: '13px 14px', borderRadius: 999, fontWeight: 600, fontSize: 14, cursor: 'pointer',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 7,
          }}>
            <UserIcon size={15}/> Log in
          </button>
          <a href="/become-a-coach" className="body" style={{
            flex: 1, background: 'rgba(197,255,61,0.07)', color: '#C5FF3D',
            border: '1px solid rgba(197,255,61,0.45)',
            padding: '13px 14px', borderRadius: 999, fontWeight: 700, fontSize: 14, textDecoration: 'none',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 7,
          }}>
            <UserPlus size={15}/> Sign up as coach
          </a>
        </div>
      </div>

      {loginOpen && (
        <LoginSheet
          savedAthlete={savedAthlete}
          onLogin={onLogin}
          onCodeLogin={onCodeLogin}
          onSignUp={() => { setLoginOpen(false); onNext(); }}
          onClose={() => setLoginOpen(false)}
        />
      )}
    </div>
  );
}

function LoginSheet({ savedAthlete, onLogin, onCodeLogin, onSignUp, onClose }) {
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState('');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const loginAsCoach = (coach) => {
    try { sessionStorage.setItem('coachme_active_coach', JSON.stringify(coach)); } catch {}
    window.location.href = '/coach';
  };

  // Name login: check athletes first, then coaches, on this device first
  // and then (if the cloud is on) across every device.
  const submitName = async () => {
    const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const q = norm(nameInput);
    if (!q) return;

    const matchAthletes = (list) => (list || []).filter(a => {
      if (!a) return false;
      const full = norm(`${a.firstName || ''} ${a.lastName || ''}`);
      return q === full || q === norm(a.name) || q === norm(a.firstName);
    });
    const matchCoaches = (list) => (list || []).filter(c =>
      c && (q === norm(c.name) || q === norm(String(c.name || '').split(' ')[0]))
    );

    const tryLists = (athletes, coaches) => {
      const am = matchAthletes(athletes);
      if (am.length === 1) {
        setNameError('');
        onCodeLogin({ level: 1, xp: 0, xpMax: 500, ...am[0] });
        return 'done';
      }
      if (am.length > 1) {
        setNameError('More than one athlete has that name. Type your full name, or use your KoachMe code.');
        return 'done';
      }
      const cm = matchCoaches(coaches);
      if (cm.length === 1) {
        setNameError('');
        upsertCoach(cm[0]);
        loginAsCoach(cm[0]);
        return 'done';
      }
      if (cm.length > 1) {
        setNameError('More than one coach has that name. Type your full name, or use your coach code.');
        return 'done';
      }
      return 'none';
    };

    if (tryLists(loadAthleteDir(), loadCoachList()) === 'done') return;

    // Nothing on this device: look across everyone on KoachMe via the
    // server registries (they also refresh the local cache).
    setNameError('Looking for you...');
    const [remoteAthletes, remoteCoaches] = await Promise.all([
      sync.fetchAthletes(),
      sync.fetchCoaches(),
    ]);
    if ((remoteAthletes || remoteCoaches) && tryLists(remoteAthletes || [], remoteCoaches || []) === 'done') return;

    setNameError('We could not find that name. If you signed up on another device, type your code below. Otherwise, sign up.');
  };

  const submitCode = async () => {
    // Server first: real cross-device login pulls the exact profile from
    // KoachMe. Offline (or unknown code) falls back to the local decoder:
    // local profiles restore exactly, otherwise the three words rebuild a
    // working profile. Old long codes still decode.
    const remote = await sync.loginByCode(code);
    if (remote) {
      setCodeError('');
      if (remote.role === 'athlete' && remote.athlete) {
        onCodeLogin(remote.athlete);
        return;
      }
      if (remote.role === 'coach' && remote.coach) {
        const localCoach = loadCoachList().find(c => c.code === remote.coach.code);
        loginAsCoach(localCoach ? { ...remote.coach, ...localCoach } : remote.coach);
        return;
      }
    }
    const res = decodeAnyCode(code, { athletes: loadAthleteDir(), coaches: loadCoachList() });
    if (!res) {
      setCodeError('That code is not right. It is three short words with dashes, like alex-tiger-moon. Check every word.');
      return;
    }
    setCodeError('');
    if (res.type === 'athlete') {
      onCodeLogin(res.profile);
      return;
    }
    const localCoach = loadCoachList().find(c => c.id === res.profile.id);
    if (!localCoach) upsertCoach(res.profile);
    loginAsCoach(localCoach || res.profile);
  };

  return (
    <div className="sheet-backdrop" style={{ zIndex: 60 }} onClick={onClose}>
      <div className="slide-up phone-scroll sheet-panel" onClick={e => e.stopPropagation()} style={{
        padding: 24, maxHeight: '92%', overflowY: 'auto',
      }}>
        <div className="sheet-handle"/>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, marginTop: 4 }}>
          <div className="display" style={{ fontSize: 26, lineHeight: 1, textTransform: 'uppercase' }}>
            LOG <span style={{ color: '#C5FF3D' }}>IN</span>
          </div>
          <button onClick={onClose} className="tap" style={{ color: '#5F636B' }}>
            <X size={20}/>
          </button>
        </div>
        <div className="body" style={{ fontSize: 12.5, color: '#9CA0A8', lineHeight: 1.5, marginBottom: 18 }}>
          Use your KoachMe code to bring your profile to any device. Full password accounts arrive with the Phase 1 backend.
        </div>

        {savedAthlete ? (
          <button onClick={onLogin} style={{
            width: '100%', cursor: 'pointer', textAlign: 'left',
            background: 'linear-gradient(160deg, rgba(197,255,61,0.08) 0%, var(--km-card) 100%)',
            border: '1px solid rgba(197,255,61,0.4)', borderRadius: 14, padding: 14,
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
          }}>
            <Avatar initials={savedAthlete.initials} size={46} color="#C5FF3D" square/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="display" style={{ fontSize: 18, lineHeight: 1, textTransform: 'uppercase', color: 'var(--km-chalk)' }}>
                Continue as {savedAthlete.name}
              </div>
              <div className="mono" style={{ fontSize: 9.5, color: '#9CA0A8', marginTop: 5, letterSpacing: '0.06em' }}>
                {(savedAthlete.sport || '').toUpperCase()}
                {savedAthlete.city ? ` · ${savedAthlete.city.toUpperCase()}` : ''}
              </div>
            </div>
            <ArrowRight size={16} color="#C5FF3D"/>
          </button>
        ) : (
          <div style={{
            padding: 16, borderRadius: 12, background: '#18181C',
            border: '1px dashed #2A2A30', marginBottom: 12, textAlign: 'center',
          }}>
            <div className="display" style={{ fontSize: 16, textTransform: 'uppercase', marginBottom: 4 }}>
              No athlete profile on this device
            </div>
            <div className="body" style={{ fontSize: 12, color: '#9CA0A8', lineHeight: 1.5 }}>
              Sign up below to create your athlete card.
            </div>
          </div>
        )}

        <div className="mono" style={{ fontSize: 9, color: '#5F636B', letterSpacing: '0.18em', marginBottom: 8 }}>
          LOG IN WITH YOUR NAME
        </div>
        <input
          value={nameInput}
          onChange={e => { setNameInput(e.target.value); if (nameError) setNameError(''); }}
          onKeyDown={e => { if (e.key === 'Enter') submitName(); }}
          placeholder="First and last name"
          className="body"
          style={{
            width: '100%', background: '#18181C', border: '1px solid #2A2A30',
            borderRadius: 12, padding: '12px 14px', color: 'var(--km-chalk)',
            fontSize: 14, outline: 'none', marginBottom: 8,
          }}
          onFocus={e => e.currentTarget.style.borderColor = '#C5FF3D'}
          onBlur={e => e.currentTarget.style.borderColor = '#2A2A30'}
        />
        {nameError && (
          <div className="body" style={{
            padding: '9px 12px', borderRadius: 10, marginBottom: 8,
            background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.4)',
            color: '#FF8888', fontSize: 12, lineHeight: 1.4,
          }}>
            {nameError}
          </div>
        )}
        <button onClick={submitName} disabled={!nameInput.trim()} className="body" style={{
          width: '100%',
          background: nameInput.trim() ? '#C5FF3D' : 'transparent',
          color: nameInput.trim() ? '#000' : '#5F636B',
          border: nameInput.trim() ? 'none' : '1px solid #2A2A30',
          padding: '12px 16px', borderRadius: 999, fontWeight: 700, fontSize: 13,
          cursor: nameInput.trim() ? 'pointer' : 'not-allowed',
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 16,
          transition: 'all 0.15s',
        }}>
          Log in with my name <ArrowRight size={14}/>
        </button>
        <div className="body" style={{ fontSize: 11, color: '#5F636B', lineHeight: 1.5, marginBottom: 16, textAlign: 'center' }}>
          Works for athletes and coaches. Athletes open the app; coaches go to the Coach Console.
        </div>

        <button onClick={onSignUp} className="body" style={{
          width: '100%',
          background: 'transparent',
          color: 'var(--km-chalk)',
          border: '1px solid #3A3A42',
          padding: '13px 16px', borderRadius: 999, fontWeight: 700, fontSize: 14, cursor: 'pointer',
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 16,
        }}>
          {savedAthlete ? 'Sign up as a different athlete' : 'New here? Sign up as an athlete'} <ArrowRight size={14}/>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ flex: 1, height: 1, background: '#1F1F25' }}/>
          <span className="mono" style={{ fontSize: 9, color: '#5F636B', letterSpacing: '0.18em' }}>COMING FROM ANOTHER DEVICE?</span>
          <span style={{ flex: 1, height: 1, background: '#1F1F25' }}/>
        </div>
        <textarea
          value={code}
          onChange={e => { setCode(e.target.value); if (codeError) setCodeError(''); }}
          placeholder="Type your 3 words, like alex-tiger-moon"
          rows={2}
          className="mono"
          style={{
            width: '100%', background: '#18181C', border: '1px solid #2A2A30',
            borderRadius: 12, padding: '11px 13px', color: 'var(--km-chalk)',
            fontSize: 11, outline: 'none', resize: 'none', marginBottom: 8,
            fontFamily: 'inherit', lineHeight: 1.5,
          }}
          onFocus={e => e.currentTarget.style.borderColor = '#C5FF3D'}
          onBlur={e => e.currentTarget.style.borderColor = '#2A2A30'}
        />
        {codeError && (
          <div className="body" style={{
            padding: '9px 12px', borderRadius: 10, marginBottom: 8,
            background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.4)',
            color: '#FF8888', fontSize: 12, lineHeight: 1.4,
          }}>
            {codeError}
          </div>
        )}
        <button onClick={submitCode} disabled={!code.trim()} className="body" style={{
          width: '100%',
          background: code.trim() ? 'rgba(197,255,61,0.1)' : 'transparent',
          color: code.trim() ? '#C5FF3D' : '#5F636B',
          border: code.trim() ? '1px solid rgba(197,255,61,0.45)' : '1px solid #2A2A30',
          padding: '12px 16px', borderRadius: 999, fontWeight: 700, fontSize: 13,
          cursor: code.trim() ? 'pointer' : 'not-allowed',
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 16,
          transition: 'all 0.15s',
        }}>
          Log in with my code <ArrowRight size={14}/>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ flex: 1, height: 1, background: '#1F1F25' }}/>
          <span className="mono" style={{ fontSize: 9, color: '#5F636B', letterSpacing: '0.18em' }}>COACHES</span>
          <span style={{ flex: 1, height: 1, background: '#1F1F25' }}/>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/coach" className="body" style={{
            flex: 1, background: 'transparent', color: '#C5FF3D', textDecoration: 'none',
            border: '1px solid rgba(197,255,61,0.45)',
            padding: '12px 14px', borderRadius: 999, fontWeight: 700, fontSize: 13,
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6,
          }}>
            Coach log in
          </a>
          <a href="/become-a-coach" className="body" style={{
            flex: 1, background: 'transparent', color: 'var(--km-chalk)', textDecoration: 'none',
            border: '1px solid #3A3A42',
            padding: '12px 14px', borderRadius: 999, fontWeight: 600, fontSize: 13,
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6,
          }}>
            Coach sign-up
          </a>
        </div>
      </div>
    </div>
  );
}

function SUStep({ idx, total, title, sub, children, canContinue, onNext, onBack, continueLabel }) {
  return (
    <div className="slide-right su-step" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{
          background: '#18181C', border: '1px solid #2A2A30', borderRadius: '50%',
          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--km-chalk)', cursor: 'pointer', flexShrink: 0,
        }}>
          <ChevronLeft size={18}/>
        </button>
        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i < idx ? '#C5FF3D' : '#2A2A30',
              transition: 'background 0.3s',
            }}/>
          ))}
        </div>
        <span className="mono" style={{ fontSize: 10, color: '#5F636B', letterSpacing: '0.1em', flexShrink: 0 }}>
          {idx}/{total}
        </span>
      </div>

      <div className="phone-scroll" style={{ flex: 1, overflow: 'auto', padding: '0 24px' }}>
        <div className="display" style={{ fontSize: 32, lineHeight: 1, marginBottom: 8, textTransform: 'uppercase' }}>{title}</div>
        <div className="body" style={{ fontSize: 13, color: '#9CA0A8', marginBottom: 24, lineHeight: 1.5 }}>{sub}</div>
        {children}
      </div>

      <div style={{ padding: '14px 24px 24px', borderTop: '1px solid #1F1F25', background: '#0A0A0B' }}>
        <button onClick={onNext} disabled={!canContinue} style={{
          width: '100%', background: canContinue ? '#C5FF3D' : '#1A1A20',
          color: canContinue ? '#000' : '#5F636B', border: 'none',
          padding: '15px 20px', borderRadius: 999,
          fontWeight: 700, fontSize: 15,
          cursor: canContinue ? 'pointer' : 'not-allowed',
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
          transition: 'all 0.15s',
        }} className="body">
          {continueLabel || 'Continue'} {canContinue && <ArrowRight size={16}/>}
        </button>
      </div>
    </div>
  );
}

function SULabel({ children }) {
  return (
    <div className="mono" style={{ fontSize: 10.5, color: '#9CA0A8', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
      {children}
    </div>
  );
}

function SUInput({ label, placeholder, value, onChange, autoFocus }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <SULabel>{label}</SULabel>
      <input
        type="text" autoFocus={autoFocus} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} className="body"
        style={{
          width: '100%', background: '#18181C', border: '1px solid #2A2A30',
          borderRadius: 12, padding: '14px 16px', color: 'var(--km-chalk)',
          fontSize: 15, outline: 'none', transition: 'border-color 0.15s',
        }}
        onFocus={e => e.currentTarget.style.borderColor = '#C5FF3D'}
        onBlur={e => e.currentTarget.style.borderColor = '#2A2A30'}
      />
    </div>
  );
}

function SUSelect({ label, value, onChange, options, placeholder }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <SULabel>{label}</SULabel>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="body"
          style={{
            width: '100%', background: '#18181C', border: '1px solid #2A2A30',
            borderRadius: 12, padding: '14px 40px 14px 16px', color: value ? 'var(--km-chalk)' : '#5F636B',
            fontSize: 15, outline: 'none', appearance: 'none',
            WebkitAppearance: 'none', MozAppearance: 'none',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
          onFocus={e => e.currentTarget.style.borderColor = '#C5FF3D'}
          onBlur={e => e.currentTarget.style.borderColor = '#2A2A30'}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(o => <option key={o.value} value={o.value} style={{ background: '#18181C', color: 'var(--km-chalk)' }}>{o.label}</option>)}
        </select>
        <span style={{
          position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none', color: '#9CA0A8',
        }}>
          <ChevronRight size={16} style={{ transform: 'rotate(90deg)' }}/>
        </span>
      </div>
    </div>
  );
}

const SU_OTHER = '__other__';

// A dropdown that can also be typed in: the list stays, and the last
// option is "Other (type it in)", which flips the field to a text box
// with a LIST button to go back.
function SUSelectOrType({ label, value, onChange, options, placeholder, typePlaceholder, numeric }) {
  const startInTyping = value !== '' && !options.some(o => o.value === value);
  const [typing, setTyping] = useState(startInTyping);

  if (typing) {
    return (
      <div style={{ marginBottom: 18 }}>
        <SULabel>{label}</SULabel>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type={numeric ? 'number' : 'text'}
            inputMode={numeric ? 'numeric' : 'text'}
            autoFocus
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={typePlaceholder || 'Type your own'}
            className="body"
            style={{
              flex: 1, minWidth: 0, background: '#18181C', border: '1px solid #C5FF3D',
              borderRadius: 12, padding: '14px 16px', color: 'var(--km-chalk)',
              fontSize: 15, outline: 'none',
            }}
          />
          <button type="button" onClick={() => { setTyping(false); onChange(''); }} className="mono" style={{
            background: '#18181C', border: '1px solid #2A2A30', color: '#9CA0A8',
            borderRadius: 12, padding: '0 14px', fontSize: 10, letterSpacing: '0.1em',
            cursor: 'pointer', flexShrink: 0, fontWeight: 700,
          }}>
            LIST
          </button>
        </div>
        <div className="body" style={{ fontSize: 11, color: '#5F636B', marginTop: 6, lineHeight: 1.5 }}>
          Typing your own. Tap LIST to pick from the list instead.
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 18 }}>
      <SULabel>{label}</SULabel>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={e => {
            if (e.target.value === SU_OTHER) { setTyping(true); onChange(''); }
            else onChange(e.target.value);
          }}
          className="body"
          style={{
            width: '100%', background: '#18181C', border: '1px solid #2A2A30',
            borderRadius: 12, padding: '14px 40px 14px 16px', color: value ? 'var(--km-chalk)' : '#5F636B',
            fontSize: 15, outline: 'none', appearance: 'none',
            WebkitAppearance: 'none', MozAppearance: 'none',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
          onFocus={e => e.currentTarget.style.borderColor = '#C5FF3D'}
          onBlur={e => e.currentTarget.style.borderColor = '#2A2A30'}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(o => <option key={o.value} value={o.value} style={{ background: '#18181C', color: 'var(--km-chalk)' }}>{o.label}</option>)}
          <option value={SU_OTHER} style={{ background: '#18181C', color: '#C5FF3D' }}>Other (type it in)</option>
        </select>
        <span style={{
          position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none', color: '#9CA0A8',
        }}>
          <ChevronRight size={16} style={{ transform: 'rotate(90deg)' }}/>
        </span>
      </div>
    </div>
  );
}

function SUAutocomplete({ label, value, onChange, options, placeholder, autoFocus }) {
  const listId = `dl-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div style={{ marginBottom: 18 }}>
      <SULabel>{label}</SULabel>
      <input
        type="text" autoFocus={autoFocus} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} list={listId} className="body"
        style={{
          width: '100%', background: '#18181C', border: '1px solid #2A2A30',
          borderRadius: 12, padding: '14px 16px', color: 'var(--km-chalk)',
          fontSize: 15, outline: 'none', transition: 'border-color 0.15s',
        }}
        onFocus={e => e.currentTarget.style.borderColor = '#C5FF3D'}
        onBlur={e => e.currentTarget.style.borderColor = '#2A2A30'}
      />
      <datalist id={listId}>
        {options.map(opt => <option key={opt} value={opt} />)}
      </datalist>
      {options.length > 0 && (
        <div style={{ fontSize: 11, color: '#5F636B', marginTop: 6, lineHeight: 1.5 }} className="body">
          Type to search or pick from suggestions.
        </div>
      )}
    </div>
  );
}

function SUStatInput({ def, value, onChange }) {
  return (
    <div style={{
      background: '#18181C', border: '1px solid #2A2A30',
      borderRadius: 12, padding: '12px 14px',
    }}>
      <div className="mono" style={{ fontSize: 9.5, color: '#9CA0A8', letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase' }}>{def.label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <input
          type="text" inputMode="decimal" value={value} onChange={e => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
          placeholder={def.placeholder} className="display"
          style={{
            flex: 1, minWidth: 0, background: 'transparent', border: 'none',
            color: 'var(--km-chalk)', fontSize: 26, outline: 'none', padding: 0,
          }}
        />
        <span className="mono" style={{ fontSize: 11, color: '#9CA0A8' }}>{def.unit}</span>
      </div>
    </div>
  );
}

function SUChip({ children, active, onClick, small }) {
  return (
    <button onClick={onClick} className="body" style={{
      padding: small ? '7px 12px' : '12px 14px',
      borderRadius: small ? 999 : 12,
      background: active ? 'rgba(197,255,61,0.12)' : '#18181C',
      border: active ? '1px solid #C5FF3D' : '1px solid #2A2A30',
      color: active ? '#C5FF3D' : '#D4D6DA',
      fontSize: small ? 12 : 14, fontWeight: 600, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      transition: 'all 0.15s', whiteSpace: 'nowrap',
    }}>{children}</button>
  );
}

function SUDone({ form, onFinish }) {
  const initials = (form.firstName[0] || '?') + (form.lastName[0] || '');
  return (
    <div className="fade-in su-step" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', textAlign: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', marginBottom: 32 }}>
        {Array.from({ length: 14 }).map((_, i) => {
          const colors = ['#C5FF3D', '#FF6B3D', '#5DA9FF', '#FF9BCD'];
          const c = colors[i % colors.length];
          const tx = (Math.random() - 0.5) * 300;
          const ty = (Math.random() - 0.5) * 300;
          const r = Math.random() * 720;
          return (
            <div key={i} style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 6, height: 10, background: c, borderRadius: 1,
              '--tx': `${tx}px`, '--ty': `${ty}px`, '--r': `${r}deg`,
              animation: `confetti 1.2s ease-out forwards`,
              animationDelay: `${i * 0.03}s`,
            }}/>
          );
        })}
        <div style={{ display: 'flex', justifyContent: 'center' }} className="pulse-ring">
          <Avatar initials={initials} size={120} square color="#C5FF3D" ring/>
        </div>
      </div>

      <div className="display" style={{ fontSize: 38, lineHeight: 1, marginBottom: 10, textTransform: 'uppercase' }}>
        YOU'RE IN, <span style={{ color: '#C5FF3D' }}>{form.firstName.toUpperCase()}</span>.
      </div>
      <div className="body" style={{ fontSize: 14, color: '#9CA0A8', marginBottom: 18, lineHeight: 1.5, maxWidth: 320, margin: '0 auto 18px' }}>
        Your card is live. Find your first trainer and start logging verified stats.
      </div>

      {/* The founding promise, in one sentence a kid can read. It belongs
          on the last screen of signup because this is the moment the
          promise is actually made. */}
      <div style={{ maxWidth: 320, margin: '0 auto 28px' }}>
        <span className="stamp stamp--lime stamp--flat">Founding member</span>
        <div className="body" style={{ fontSize: 12.5, color: '#9CA0A8', lineHeight: 1.5, marginTop: 8 }}>
          {foundingSentence()}
        </div>
      </div>

      <button onClick={onFinish} style={{
        background: '#C5FF3D', color: '#000', border: 'none',
        padding: '16px 24px', borderRadius: 999, fontWeight: 700, fontSize: 15, cursor: 'pointer',
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, margin: '0 auto',
      }} className="body">
        Open my KoachMe <ArrowRight size={16}/>
      </button>
    </div>
  );
}

/* ============================================================
   PROFILE VIEW
   ============================================================ */
function ProfileView({ athlete, trainerIds, trainers = TRAINERS, workouts = [], drillSessions = [], hasPosts = false, hasMessagedCoach = false, onOpenTrainer, onGoToTrainers, onOpenChat, onLogWorkout, onRemoveWorkout, onSignOut }) {
  const hasStats = athlete.stats && athlete.stats.length > 0;
  const hasTrainers = trainerIds && trainerIds.length > 0;
  const streak = calcStreak(workouts);
  const thisWeek = countThisWeek(workouts);
  const totalWorkouts = workouts.length;

  /* Achievements AND the XP bar come out of the same derived state, so
     drill logging lands on the profile through the one system rather
     than a counter of its own. Nothing is stored: recomputed from what
     the athlete has actually done, every render. */
  const { earned, earnedCount, level, xpInLevel, xpMax } = achievementState({
    totalWorkouts,
    workoutStreak: streak,
    totalDrillSessions: drillSessions.length,
    hasPosts, hasStats, hasTrainers, hasMessagedCoach,
  });

  return (
    <div className="view view--profile" style={{ padding: '0 0 24px' }}>
      <div style={{
        margin: '12px 16px 20px', borderRadius: 24, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(160deg, #1C1C24 0%, var(--km-card) 100%)',
        border: '1px solid #2A2A30',
      }}>
        {athlete.banner ? (
          <CoverPhoto
            src={athlete.banner} height={140} color="#C5FF3D"
            overlay="linear-gradient(180deg, rgba(10,10,11,0) 0%, rgba(10,10,11,0.45) 50%, rgba(10,10,11,0.98) 100%)"
          >
            <div style={{ padding: 14 }}>
              <span className="mono" style={{
                fontSize: 9, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                color: '#C5FF3D', padding: '5px 9px', borderRadius: 6,
                fontWeight: 700, letterSpacing: '0.15em', border: '1px solid rgba(197,255,61,0.4)',
                display: 'inline-flex', alignItems: 'center', gap: 5
              }}>
                <span style={{ width: 5, height: 5, background: '#C5FF3D', borderRadius: '50%' }} className="pulse-dot"/>
                LIVE
              </span>
            </div>
          </CoverPhoto>
        ) : (
          <div style={{ height: 100, background: 'linear-gradient(135deg, #C5FF3D20 0%, var(--km-card) 80%)' }}/>
        )}

        <div style={{ padding: '0 20px 22px', marginTop: -42, position: 'relative', zIndex: 3 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Avatar photo={athlete.photo} initials={athlete.initials} size={76} square color="#C5FF3D" ring/>
            <div style={{ flex: 1, marginLeft: 14, paddingBottom: 4 }}>
              <div className="display profile-name" style={{ fontSize: 28, lineHeight: 1, textTransform: 'uppercase' }}>{athlete.name}</div>
              <div className="mono" style={{ fontSize: 10.5, color: '#9CA0A8', marginTop: 6, letterSpacing: '0.06em' }}>
                {athlete.position.toUpperCase()}
                {athlete.age ? ` · AGE ${athlete.age}` : ''}
                {' · '}{athlete.city.toUpperCase()}
              </div>
              {/* Founding status, visible on the profile it belongs to.
                  Shown while the founding window is open, which is the
                  only time it can be true of a profile being created. */}
              {!OFFER.PRICING_LAUNCHED && (
                <span className="stamp stamp--lime" style={{ marginTop: 8, display: 'inline-block' }}>
                  Founding member
                </span>
              )}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }} className="mono">
              <span style={{ fontSize: 10, color: '#9CA0A8', letterSpacing: '0.12em' }}>LEVEL {level}</span>
              <span style={{ fontSize: 10, color: '#9CA0A8', letterSpacing: '0.06em' }}>{xpInLevel} / {xpMax} XP</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.max(2, (xpInLevel / xpMax) * 100)}%`, height: '100%',
                background: 'linear-gradient(90deg, #8DBA1F 0%, #C5FF3D 100%)', borderRadius: 999,
                boxShadow: '0 0 16px rgba(197,255,61,0.4)'
              }}/>
            </div>
          </div>
        </div>
      </div>

      {/* Training stat badges */}
      <div style={{ padding: '0 16px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <TrainBadge icon={<Flame size={14} color="#FF6B3D"/>} value={streak} label="DAY STREAK"/>
        <TrainBadge icon={<CalIcon size={14} color="#5DA9FF"/>} value={thisWeek} label="THIS WEEK"/>
        <TrainBadge icon={<Dumbbell size={14} color="#C5FF3D"/>} value={totalWorkouts} label="TOTAL"/>
      </div>

      <div style={{ padding: '0 16px', marginBottom: 8 }}>
        <SectionLabel>{hasStats ? 'YOUR STATS' : 'STATS'}</SectionLabel>
      </div>
      {hasStats ? (
        <div className="stats-grid" style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {athlete.stats.map((s, i) => <StatCard key={i} stat={s}/>)}
        </div>
      ) : (
        <EmptyCard
          icon={<TrendingUp size={20} color="#5F636B"/>}
          title="No verified stats yet"
          sub="Book a session with a trainer to start logging. Or self-report and let them verify."
          cta="Find a trainer"
          onClick={onGoToTrainers}
        />
      )}

      <div style={{ padding: '0 16px', marginBottom: 8 }}>
        <SectionLabel>YOUR TRAINERS</SectionLabel>
      </div>
      {hasTrainers ? (
        <div style={{ padding: '0 16px', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {trainerIds.map(id => {
            const t = trainers.find(tr => tr.id === id);
            if (!t) return null;
            return (
              <div key={id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <TrainerRow trainer={t} onClick={() => onOpenTrainer(id)}/>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button onClick={() => onOpenChat && onOpenChat(id)} style={{
                    background: '#18181C', border: '1px solid #2A2A30', borderRadius: 10,
                    padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    color: 'var(--km-chalk)', cursor: 'pointer', fontWeight: 600, fontSize: 12,
                  }} className="body">
                    <MessageCircle size={14} color="#C5FF3D"/> Message
                  </button>
                  <button onClick={() => onOpenTrainer(id)} style={{
                    background: '#18181C', border: '1px solid #2A2A30', borderRadius: 10,
                    padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    color: 'var(--km-chalk)', cursor: 'pointer', fontWeight: 600, fontSize: 12,
                  }} className="body">
                    <Video size={14} color="#5DA9FF"/> Book session
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyCard
          icon={<UserPlus size={20} color="#5F636B"/>}
          title="No trainers yet"
          sub="Browse proven coaches and former pros. Tap a trainer to message, video call, or book a session."
          cta="Find a trainer"
          onClick={onGoToTrainers}
        />
      )}

      {/* Training log */}
      <div style={{ padding: '0 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SectionLabel>TRAINING LOG</SectionLabel>
        <button onClick={onLogWorkout} className="mono" style={{
          background: '#C5FF3D', color: '#000', border: 'none', cursor: 'pointer',
          padding: '6px 12px', borderRadius: 999, fontSize: 10, fontWeight: 700,
          letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <Plus size={12}/> LOG WORKOUT
        </button>
      </div>
      {workouts.length === 0 ? (
        <EmptyCard
          icon={<Dumbbell size={20} color="#5F636B"/>}
          title="No workouts logged yet"
          sub="Log your daily training to build streaks, track consistency, and unlock achievements. Trainers see your real work."
          cta="Log your first workout"
          onClick={onLogWorkout}
        />
      ) : (
        <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {workouts.slice(0, 8).map(w => <WorkoutRow key={w.id} workout={w} onDelete={() => onRemoveWorkout && onRemoveWorkout(w.id)}/>)}
          {workouts.length > 8 && (
            <div className="mono" style={{ textAlign: 'center', fontSize: 10, color: '#5F636B', letterSpacing: '0.1em', paddingTop: 4 }}>
              + {workouts.length - 8} EARLIER WORKOUTS
            </div>
          )}
        </div>
      )}

      {/* Achievements */}
      <div style={{ padding: '0 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SectionLabel>ACHIEVEMENTS</SectionLabel>
        <span className="mono" style={{ fontSize: 10, color: '#5F636B', letterSpacing: '0.1em' }}>
          {earnedCount} / {ACHIEVEMENTS.length}
        </span>
      </div>
      <div className="ach-grid" style={{ padding: '0 16px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {ACHIEVEMENTS.map(a => <AchievementCard key={a.id} achievement={a} earned={earned[a.id]}/>)}
      </div>

      {/* For coaches footer */}
      <div style={{ padding: '8px 16px 12px' }}>
        <div style={{
          background: 'linear-gradient(160deg, #1A1A20 0%, var(--km-card) 100%)',
          border: '1px solid #2A2A30', borderRadius: 14, padding: 16, textAlign: 'center',
        }}>
          <div className="display" style={{ fontSize: 18, lineHeight: 1, textTransform: 'uppercase', marginBottom: 6 }}>
            ARE YOU A COACH?
          </div>
          <div className="body" style={{ fontSize: 12, color: '#9CA0A8', lineHeight: 1.5, marginBottom: 14 }}>
            Join KoachMe to train athletes, or log in to your coach dashboard.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/become-a-coach" className="body" style={{
              flex: 1, background: '#C5FF3D', color: '#000', textDecoration: 'none',
              padding: '10px', borderRadius: 999, fontWeight: 700, fontSize: 12.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <UserPlus size={13}/> Join as coach
            </a>
            <a href="/coach" className="body" style={{
              flex: 1, background: 'transparent', color: 'var(--km-chalk)', textDecoration: 'none',
              padding: '10px', borderRadius: 999, fontWeight: 600, fontSize: 12.5,
              border: '1px solid #3A3A42',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <UserIcon size={13}/> Coach log in
            </a>
          </div>
        </div>
      </div>

      {/* Account portability */}
      <div style={{ padding: '0 16px 12px' }}>
        <AccountCard athlete={athlete}/>
      </div>

      {/* Sign out (also clears the saved athlete so the welcome screen shows again) */}
      {onSignOut && (
        <div style={{ padding: '0 16px 24px', textAlign: 'center' }}>
          <button onClick={() => {
            if (typeof window !== 'undefined' && window.confirm('Sign out? Your profile stays saved on this device. Use Log in on the welcome screen to come back.')) {
              onSignOut();
            }
          }} className="mono" style={{
            background: 'transparent', border: 'none', color: '#5F636B', cursor: 'pointer',
            fontSize: 10.5, letterSpacing: '0.15em', padding: '8px 12px',
          }}>
            SIGN OUT
          </button>
        </div>
      )}
    </div>
  );
}

function TrainBadge({ icon, value, label }) {
  return (
    <div style={{
      background: 'linear-gradient(160deg, #1A1A20 0%, var(--km-card) 100%)',
      border: '1px solid #2A2A30', borderRadius: 12, padding: '10px 8px',
      textAlign: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 4 }}>
        {icon}
        <span className="display" style={{ fontSize: 22, lineHeight: 1, color: 'var(--km-chalk)' }}>{value}</span>
      </div>
      <div className="mono" style={{ fontSize: 8.5, color: '#5F636B', letterSpacing: '0.1em' }}>{label}</div>
    </div>
  );
}

function WorkoutRow({ workout, onDelete }) {
  const def = WORKOUT_TYPES.find(t => t.key === workout.type) || WORKOUT_TYPES[0];
  const ago = workoutDayLabel(workout.date);
  return (
    <div style={{
      background: 'linear-gradient(160deg, #1A1A20 0%, var(--km-card) 100%)',
      border: '1px solid #2A2A30', borderRadius: 12, padding: 12,
      display: 'flex', alignItems: 'center', gap: 12, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, width: 3, height: '100%', background: def.color,
      }}/>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: `${def.color}18`, border: `1px solid ${def.color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 4,
      }}>
        <Dumbbell size={16} color={def.color}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="display" style={{ fontSize: 16, lineHeight: 1, textTransform: 'uppercase' }}>{def.label}</div>
        <div className="mono" style={{ fontSize: 10, color: '#9CA0A8', marginTop: 4, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span>{ago.toUpperCase()}</span>
          <span>·</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Clock size={9}/> {workout.duration} MIN</span>
          {workout.intensity ? <><span>·</span><span>{INTENSITY_LABELS[workout.intensity - 1]?.toUpperCase()}</span></> : null}
        </div>
        {workout.notes ? (
          <div className="body" style={{ fontSize: 12, color: '#D4D6DA', marginTop: 6, lineHeight: 1.45 }}>{workout.notes}</div>
        ) : null}
      </div>
      <button onClick={onDelete} title="Delete" className="tap" style={{ color: '#5F636B' }}>
        <X size={14}/>
      </button>
    </div>
  );
}

function workoutDayLabel(date) {
  const d = new Date(date);
  const now = new Date();
  if (isSameDay(d, now)) return 'Today';
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (isSameDay(d, y)) return 'Yesterday';
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function AchievementCard({ achievement, earned }) {
  const Icon = achievement.icon;
  return (
    <div style={{
      background: earned
        ? 'linear-gradient(160deg, rgba(197,255,61,0.10) 0%, rgba(197,255,61,0.03) 100%)'
        : 'linear-gradient(160deg, #1A1A20 0%, var(--km-card) 100%)',
      border: earned ? '1px solid rgba(197,255,61,0.4)' : '1px solid #2A2A30',
      borderRadius: 12, padding: 12, opacity: earned ? 1 : 0.6,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        background: earned ? 'rgba(197,255,61,0.16)' : 'rgba(255,255,255,0.04)',
        border: earned ? '1px solid rgba(197,255,61,0.4)' : '1px solid #2A2A30',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={16} color={earned ? '#C5FF3D' : '#5F636B'}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="display" style={{ fontSize: 14, lineHeight: 1, textTransform: 'uppercase', color: earned ? 'var(--km-chalk)' : '#9CA0A8' }}>{achievement.label}</div>
        <div className="body" style={{ fontSize: 10.5, color: '#5F636B', marginTop: 3, lineHeight: 1.4 }}>{achievement.hint}</div>
      </div>
    </div>
  );
}

function AccountCard({ athlete }) {
  const [copied, setCopied] = useState(false);

  const codeStr = athlete.code || generateAthleteCode(athlete) || '';

  const copy = async () => {
    if (!codeStr) return;
    try {
      await navigator.clipboard.writeText(codeStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard can be blocked; fall back to a copyable prompt.
      if (typeof window !== 'undefined') window.prompt('Copy your KoachMe code:', codeStr);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(160deg, #1A1A20 0%, var(--km-card) 100%)',
      border: '1px solid #2A2A30', borderRadius: 14, padding: 16,
    }}>
      <div className="display" style={{ fontSize: 18, lineHeight: 1, textTransform: 'uppercase', marginBottom: 6 }}>
        YOUR 3-WORD CODE
      </div>
      <div className="body" style={{ fontSize: 12, color: '#9CA0A8', lineHeight: 1.55, marginBottom: 12 }}>
        These three words are your login. Type them into Log in on any other device and your profile comes with you. Keep them private.
      </div>
      {codeStr && (
        <div className="mono" style={{
          background: '#0A0A0B', border: '1px solid rgba(197,255,61,0.4)',
          borderRadius: 12, padding: '14px 14px', marginBottom: 10,
          fontSize: 17, fontWeight: 700, color: '#C5FF3D', lineHeight: 1.5,
          wordBreak: 'break-word', textAlign: 'center', userSelect: 'all',
          letterSpacing: '0.03em',
        }}>
          {codeStr}
        </div>
      )}
      <button onClick={copy} className="body" style={{
        width: '100%',
        background: copied ? 'rgba(197,255,61,0.12)' : '#18181C',
        color: copied ? '#C5FF3D' : 'var(--km-chalk)',
        border: copied ? '1px solid #C5FF3D' : '1px solid #3A3A42',
        padding: '11px 16px', borderRadius: 999, fontWeight: 700, fontSize: 13, cursor: 'pointer',
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
        transition: 'all 0.15s',
      }}>
        {copied ? (
          <>
            <CheckCircle2 size={14}/> Copied!
          </>
        ) : (
          'Copy code'
        )}
      </button>
    </div>
  );
}

function EmptyCard({ icon, title, sub, cta, onClick }) {
  return (
    <div style={{ padding: '0 16px', marginBottom: 24 }}>
      <div style={{
        background: 'linear-gradient(160deg, #1A1A20 0%, var(--km-card) 100%)',
        border: '1px dashed #2A2A30', borderRadius: 14, padding: 20, textAlign: 'center',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.03)',
          border: '1px solid #2A2A30',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
        }}>{icon}</div>
        <div className="display" style={{ fontSize: 20, lineHeight: 1, marginBottom: 6, textTransform: 'uppercase' }}>{title}</div>
        <div className="body" style={{ fontSize: 12.5, color: '#9CA0A8', marginBottom: 14, lineHeight: 1.5, maxWidth: 280, margin: '0 auto 14px' }}>{sub}</div>
        {cta && (
          <button onClick={onClick} className="body" style={{
            background: '#C5FF3D', color: '#000', border: 'none',
            padding: '10px 18px', borderRadius: 999, fontWeight: 700, fontSize: 13, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>{cta} <ArrowRight size={13}/></button>
        )}
      </div>
    </div>
  );
}

function StatCard({ stat }) {
  const v = VERIFY_META[stat.verified];
  return (
    <div style={{
      background: 'linear-gradient(160deg, #1A1A20 0%, var(--km-card) 100%)',
      border: '1px solid #2A2A30', borderRadius: 14, padding: '14px 14px 12px', position: 'relative',
    }}>
      <div className="mono" style={{ fontSize: 9.5, color: '#5F636B', letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase' }}>{stat.label}</div>
      <div className="display" style={{ fontSize: 30, lineHeight: 1 }}>
        {stat.value}<span className="mono" style={{ fontSize: 11, color: '#9CA0A8', marginLeft: 3, fontWeight: 500 }}>{stat.unit}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
        {stat.delta ? (
          <span className="mono" style={{ fontSize: 10, color: '#C5FF3D', fontWeight: 700 }}>{stat.delta} 90d</span>
        ) : <span/>}
        <span className="stamp" style={{ color: v.color, fontSize: 7.5, padding: '3px 6px' }}>
          <CheckCircle2 size={9}/>
          {v.label}
        </span>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="mono" style={{ fontSize: 10.5, color: '#5F636B', letterSpacing: '0.18em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 16, height: 1, background: '#C5FF3D' }}/>
      {children}
    </div>
  );
}

function TrainerRow({ trainer, onClick, showSport }) {
  return (
    <button onClick={onClick} className="card-hover" style={{
      width: '100%', textAlign: 'left', cursor: 'pointer',
      background: 'linear-gradient(160deg, #1A1A20 0%, var(--km-card) 100%)',
      border: '1px solid #2A2A30', borderRadius: 14, padding: 12,
      display: 'flex', alignItems: 'center', gap: 12, transition: 'border-color 0.15s, transform 0.15s',
    }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <Avatar photo={trainer.photo} initials={trainer.initials} size={48} color={trainer.color} square/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="display" style={{ fontSize: 19, lineHeight: 1, textTransform: 'uppercase' }}>{trainer.name}</div>
        <div className="mono" style={{ fontSize: 10, color: '#9CA0A8', marginTop: 4, letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {showSport && trainer.sport ? `${trainer.sport.toUpperCase()} · ` : ''}{(trainer.title || '').toUpperCase()}
        </div>
      </div>
      <ChevronRight size={18} color="#5F636B"/>
    </button>
  );
}

/* ============================================================
   TRAINERS VIEW
   ============================================================ */
function TrainersView({ onOpenTrainer, athlete, trainers = TRAINERS, onOpenDrill }) {
  // Only show trainers verified for this athlete's sport. No cross-sport
  // padding, no fabricated rosters.
  const sportTrainers = trainers.filter(t => t.sport === athlete.sport);
  // Coaches from other sports still show, in their own section: a coach
  // only has to sign up once to be visible to every athlete.
  const otherSportTrainers = trainers.filter(t => t.sport !== athlete.sport);
  const formerPros = sportTrainers.filter(t => t.badge === 'FORMER PRO');
  const others = sportTrainers.filter(t => t.badge !== 'FORMER PRO');

  if (sportTrainers.length === 0 && otherSportTrainers.length === 0) {
    return (
      <div className="view view--trainers" style={{ padding: '12px 0 24px' }}>
        <div style={{ padding: '0 16px 12px' }}>
          <div className="display view-title">FIND A <span style={{ color: '#C5FF3D' }}>TRAINER</span></div>
          <div className="mono" style={{ fontSize: 11, color: '#9CA0A8', letterSpacing: '0.08em' }}>
            {athlete.sport.toUpperCase()} &middot; {athlete.city.toUpperCase()}
          </div>
        </div>

        <DrillLibrary athleteSport={athlete.sport} athleteId={athlete.id} onOpenDrill={onOpenDrill}/>

        <div style={{ padding: '24px 16px 0', textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(197,255,61,0.1) 0%, rgba(197,255,61,0.02) 100%)',
            border: '1px solid rgba(201,111,74,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <Search size={36} color="#C5FF3D"/>
          </div>
          <div className="display" style={{ fontSize: 28, lineHeight: 1, marginBottom: 10, textTransform: 'uppercase' }}>
            NO TRAINERS YET
          </div>
          <div className="body" style={{ fontSize: 13, color: '#9CA0A8', marginBottom: 24, lineHeight: 1.5, maxWidth: 300, margin: '0 auto 24px' }}>
            We're onboarding real, verified coaches for {athlete.sport.toLowerCase()} in {athlete.city}. We'll let you know the moment one is available.
          </div>
          <a href="/become-a-coach" target="_blank" rel="noopener" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 999, textDecoration: 'none',
            background: 'rgba(197,255,61,0.08)', border: '1px solid rgba(197,255,61,0.4)',
            color: '#C5FF3D', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em',
          }} className="mono">
            ARE YOU A COACH? JOIN KOACHME <ArrowRight size={12}/>
          </a>
          <div className="body" style={{ fontSize: 11, color: '#5F636B', marginTop: 16, lineHeight: 1.5 }}>
            Share this link with coaches you know. Every trainer on KoachMe signs up themselves.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="view view--trainers" style={{ padding: '12px 0 24px' }}>
      <div style={{ padding: '0 16px 8px' }}>
        <div className="display view-title">FIND A <span style={{ color: '#C5FF3D' }}>TRAINER</span></div>
        <div className="mono" style={{ fontSize: 11, color: '#9CA0A8', letterSpacing: '0.08em' }}>
          {sportTrainers.length} TRAINER{sportTrainers.length !== 1 ? 'S' : ''} &middot; {athlete.sport.toUpperCase()} &middot; {athlete.city.toUpperCase()}
        </div>
      </div>

      <div style={{ paddingTop: 8 }}>
        <DrillLibrary athleteSport={athlete.sport} athleteId={athlete.id} onOpenDrill={onOpenDrill}/>
      </div>

      <div style={{ padding: '16px 16px 8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#18181C', border: '1px solid #2A2A30', borderRadius: 12, padding: '12px 14px',
        }}>
          <Search size={16} color="#5F636B"/>
          <span style={{ fontSize: 14, color: '#5F636B' }} className="body">Search trainers, sports, locations</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '8px 16px 16px' }} className="phone-scroll">
        {['IN PERSON', 'LIVE ONLINE', 'ASYNC', 'FORMER PRO', '$0 - $80', 'TOP RATED'].map((c, i) => (
          <span key={i} className="mono" style={{
            fontSize: 10, padding: '7px 12px', borderRadius: 999,
            background: i === 0 ? '#C5FF3D' : 'transparent',
            color: i === 0 ? '#000' : '#9CA0A8', fontWeight: 700, letterSpacing: '0.1em',
            border: '1px solid', borderColor: i === 0 ? '#C5FF3D' : '#2A2A30',
            whiteSpace: 'nowrap',
          }}>{c}</span>
        ))}
      </div>

      {formerPros.length > 0 && (
        <>
          <div style={{ padding: '0 16px 8px' }}>
            <SectionLabel>FEATURED &middot; FORMER PROS</SectionLabel>
          </div>
          <div className="phone-scroll featured-row">
            {formerPros.map(t => <TrainerCardFeatured key={t.id} trainer={t} onClick={() => onOpenTrainer(t.id)}/>)}
          </div>
        </>
      )}

      {others.length > 0 && (
        <div style={{ padding: '0 16px 8px' }}>
          <SectionLabel>ALL TRAINERS</SectionLabel>
        </div>
      )}
      <div className="trainer-list" style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {others.map(t => <TrainerRow key={t.id} trainer={t} onClick={() => onOpenTrainer(t.id)}/>)}
      </div>

      {sportTrainers.length === 0 && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px dashed #2A2A30',
            borderRadius: 12, padding: '12px 14px',
          }}>
            <div className="body" style={{ fontSize: 12.5, color: '#9CA0A8', lineHeight: 1.5 }}>
              No {athlete.sport.toLowerCase()} trainers yet, but these coaches are on KoachMe. Tap one to say hi.
            </div>
          </div>
        </div>
      )}

      {otherSportTrainers.length > 0 && (
        <>
          <div style={{ padding: '0 16px 8px' }}>
            <SectionLabel>COACHES IN OTHER SPORTS</SectionLabel>
          </div>
          <div className="trainer-list" style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {otherSportTrainers.map(t => <TrainerRow key={t.id} trainer={t} showSport onClick={() => onOpenTrainer(t.id)}/>)}
          </div>
        </>
      )}
    </div>
  );
}

function TrainerCardFeatured({ trainer, onClick }) {
  return (
    <button onClick={onClick} className="card-hover" style={{
      minWidth: 260, textAlign: 'left', cursor: 'pointer',
      background: 'var(--km-card)', border: '1px solid #2A2A30', borderRadius: 18, position: 'relative', overflow: 'hidden',
      transition: 'transform 0.15s, border-color 0.15s', padding: 0,
    }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <CoverPhoto src={trainer.cover} height={100} color={trainer.color}
        overlay={`linear-gradient(180deg, rgba(15,15,20,0.05) 0%, rgba(15,15,20,0.95) 100%)`}>
        <div style={{ padding: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <span className="mono" style={{
            fontSize: 9, padding: '4px 8px', borderRadius: 4,
            background: trainer.color, color: '#000', fontWeight: 700, letterSpacing: '0.15em',
          }}>{trainer.badge}</span>
        </div>
      </CoverPhoto>

      <div style={{ padding: '0 18px 18px', marginTop: -28, position: 'relative', zIndex: 3 }}>
        <Avatar photo={trainer.photo} initials={trainer.initials} size={56} color={trainer.color} square ring/>
        <div className="display" style={{ fontSize: 22, lineHeight: 1, textTransform: 'uppercase', marginTop: 10 }}>{trainer.name}</div>
        <div className="mono" style={{ fontSize: 10, color: '#9CA0A8', marginTop: 4, letterSpacing: '0.06em' }}>{trainer.specialty.toUpperCase()}</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: 12, background: 'rgba(255,255,255,0.025)', borderRadius: 10, marginTop: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
          <Mini num={trainer.athletes || 0} label="ATHLETES"/>
          <Mini num={trainer.avgGain || '-'} label="AVG GAIN" small/>
          <Mini num={trainer.rating ?? 'NEW'} label="RATING" icon={trainer.rating ? <Star size={9} fill="#C5FF3D" color="#C5FF3D"/> : null}/>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 14 }}>
          <span className="display" style={{ fontSize: 22, color: 'var(--km-chalk)' }}>${trainer.rate}<span className="mono" style={{ fontSize: 10, color: '#9CA0A8', marginLeft: 2 }}>/HR</span></span>
          <span className="mono" style={{ fontSize: 10, color: '#C5FF3D', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>VIEW <ArrowRight size={10}/></span>
        </div>
      </div>
    </button>
  );
}

function Mini({ num, label, small, icon }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="display" style={{ fontSize: small ? 14 : 18, lineHeight: 1, color: '#C5FF3D', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>{icon}{num}</div>
      <div className="mono" style={{ fontSize: 8, color: '#5F636B', letterSpacing: '0.1em', marginTop: 4 }}>{label}</div>
    </div>
  );
}

/* ============================================================
   DRILL LIBRARY (AI coach clips)
   ============================================================ */
const NEW_DRILL_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const isNewDrill = (d) => Date.now() - Date.parse(d.addedAt) < NEW_DRILL_WINDOW_MS;

/* The drill library is FREE. KoachMe is in beta, nobody is charged, and
   founding members keep the library free — so nothing here may expire
   while OFFER.PRICING_LAUNCHED is false.

   This used to be a 30-day trial that locked the drill videos and showed
   "$9/MO", a price nobody was ever charged. The clock machinery is left
   intact rather than ripped out, because the localStorage keys are real
   user data in the historical coachme_ namespace (never rename them) and
   because a future paid tier would need the same shape. But `expired` is
   forced false while pricing has not launched: the gate cannot fire, so
   the lock screen cannot render, and the app cannot contradict what
   /pricing promises. */
const DRILL_TRIAL_DAYS = 30;
const DRILL_TRIAL_MS = DRILL_TRIAL_DAYS * 24 * 60 * 60 * 1000;
const drillTrialKey = (profileId) => `coachme_drills_trial::${profileId}`;
function drillTrialState(profileId) {
  if (typeof window === 'undefined' || !profileId) {
    return { startedAt: null, daysLeft: DRILL_TRIAL_DAYS, expired: false };
  }
  const raw = localStorage.getItem(drillTrialKey(profileId));
  if (!raw) return { startedAt: null, daysLeft: DRILL_TRIAL_DAYS, expired: false };
  const startedAt = Date.parse(raw);
  if (Number.isNaN(startedAt)) return { startedAt: null, daysLeft: DRILL_TRIAL_DAYS, expired: false };
  const elapsed = Date.now() - startedAt;
  return {
    startedAt,
    daysLeft: Math.max(0, Math.ceil((DRILL_TRIAL_MS - elapsed) / 86400000)),
    // Not `elapsed >= DRILL_TRIAL_MS`. Nothing expires during beta.
    expired: OFFER.PRICING_LAUNCHED && elapsed >= DRILL_TRIAL_MS,
  };
}
function startDrillTrial(profileId) {
  if (typeof window === 'undefined' || !profileId) return;
  const key = drillTrialKey(profileId);
  if (!localStorage.getItem(key)) localStorage.setItem(key, new Date().toISOString());
}

/* Serve Blob-hosted stills through the Next image optimizer (the host is
   allowed in next.config images.remotePatterns). The store keeps full
   quality; devices get right-sized WebP - a 1.5 MB portrait PNG becomes
   a ~2 KB avatar. w must be one of Next's default size buckets
   (imageSizes 16-384, deviceSizes 640/750/828/1080/1200/...) or the
   optimizer 400s and the img renders broken. */
const imgOpt = (url, w) => `/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=75`;

/* Horizontally scrolling chip row that stays usable as the library
   grows: fade edges appear only on the side(s) with more content, chips
   never wrap or get clipped, and the active chip (data-chip-active) is
   scrolled into view whenever activeKey changes. */
function ChipRow({ activeKey, padding = '0 16px 8px', children }) {
  const ref = useRef(null);
  const [fade, setFade] = useState({ left: false, right: false });
  const update = () => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setFade(f => {
      const next = { left: el.scrollLeft > 4, right: el.scrollLeft < max - 4 };
      return next.left === f.left && next.right === f.right ? f : next;
    });
  };
  useEffect(() => {
    update();
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    ref.current?.querySelector('[data-chip-active="true"]')
      ?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }, [activeKey]);
  const mask =
    fade.left && fade.right ? 'linear-gradient(90deg, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)'
    : fade.right ? 'linear-gradient(90deg, #000 0, #000 calc(100% - 24px), transparent 100%)'
    : fade.left ? 'linear-gradient(90deg, transparent 0, #000 24px, #000 100%)'
    : 'none';
  return (
    <div ref={ref} onScroll={update} className="phone-scroll" style={{
      display: 'flex', gap: 8, overflowX: 'auto', padding,
      maskImage: mask, WebkitMaskImage: mask,
    }}>
      {children}
    </div>
  );
}

function DrillLibrary({ athleteSport, athleteId, onOpenDrill }) {
  const [sportFilter, setSportFilter] = useState('All');
  const [coachFilter, setCoachFilter] = useState(null);
  const [coachSheetOpen, setCoachSheetOpen] = useState(false);
  const [query, setQuery] = useState('');
  const trial = drillTrialState(athleteId);

  const openDrill = (d) => {
    // The free month starts the first time a drill is actually opened,
    // not on browsing the library. Idempotent after that.
    startDrillTrial(athleteId);
    onOpenDrill(d);
  };

  // Sports that actually have drills, the athlete's own sport first.
  const librarySports = [...new Set(DRILLS.map(d => d.sport))];
  const orderedSports = [
    ...librarySports.filter(s => s === athleteSport),
    ...librarySports.filter(s => s !== athleteSport),
  ];
  const sportCount = (s) => DRILLS.filter(d => d.sport === s).length;
  // Icons come from the manifest's sports config (SPORT_META), so a new
  // sport in the drill data needs zero code changes here.
  const sportIcon = (name) => SPORT_META[name]?.icon ?? '';

  // Filters combine: sport AND coach AND search text (name + focus).
  const q = query.trim().toLowerCase();
  const shown = DRILLS.filter(d =>
    (sportFilter === 'All' || d.sport === sportFilter)
    && (!coachFilter || d.coachId === coachFilter)
    && (!q || `${d.title} ${d.focus}`.toLowerCase().includes(q)),
  ).sort((a, b) =>
    // Newest first so fresh drills surface immediately; the athlete's
    // own sport breaks ties within a day (FOR YOU stays a highlight,
    // not the primary order).
    Date.parse(b.addedAt) - Date.parse(a.addedAt)
    || (b.sport === athleteSport) - (a.sport === athleteSport),
  );

  const chipStyle = (active) => ({
    display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, cursor: 'pointer',
    padding: '6px 11px', borderRadius: 999, whiteSpace: 'nowrap',
    background: active ? '#C5FF3D' : '#18181C',
    border: active ? '1px solid #C5FF3D' : '1px solid #2A2A30',
    color: active ? '#000' : '#9CA0A8',
    fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
  });

  return (
    <>
      <div style={{ padding: '0 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <SectionLabel>DRILL LIBRARY</SectionLabel>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* What the library costs, always visible. During beta that is
              nothing, and there is no countdown to show because nothing is
              counting down. */}
          <span className="mono" style={{
            fontSize: 8.5, padding: '3px 8px', borderRadius: 4, fontWeight: 700, letterSpacing: '0.12em',
            background: trial.expired ? 'rgba(244,244,245,0.08)' : 'rgba(197,255,61,0.12)',
            border: trial.expired ? '1px solid #3A3A42' : '1px solid rgba(197,255,61,0.4)',
            color: trial.expired ? '#9CA0A8' : '#C5FF3D',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {trial.expired ? (<><Lock size={9}/> LOCKED</>) : 'FREE DURING BETA'}
          </span>
          <span className="stamp stamp--clay">AI Coach</span>
        </div>
      </div>

      <div style={{ padding: '0 16px 10px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#18181C', border: '1px solid #2A2A30', borderRadius: 12, padding: '10px 14px',
        }}>
          <Search size={16} color="#5F636B"/>
          <input
            value={query} onChange={e => setQuery(e.target.value)} placeholder="Search drills"
            aria-label="Search drills by name or focus" className="body"
            style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', outline: 'none', color: 'var(--km-chalk)', fontSize: 14 }}
          />
          {query !== '' && (
            <button onClick={() => setQuery('')} className="tap" aria-label="Clear search" style={{ color: '#5F636B', display: 'flex' }}>
              <X size={14}/>
            </button>
          )}
        </div>
      </div>

      <ChipRow activeKey={sportFilter}>
        <button className="mono" data-chip-active={sportFilter === 'All'} style={chipStyle(sportFilter === 'All')} onClick={() => setSportFilter('All')}>
          ALL <span style={{ opacity: 0.6 }}>{DRILLS.length}</span>
        </button>
        {orderedSports.map(s => (
          <button key={s} className="mono" data-chip-active={sportFilter === s} style={chipStyle(sportFilter === s)} onClick={() => setSportFilter(sportFilter === s ? 'All' : s)}>
            <span aria-hidden="true">{sportIcon(s)}</span> {s.toUpperCase()} <span style={{ opacity: 0.6 }}>{sportCount(s)}</span>
          </button>
        ))}
      </ChipRow>

      {/* The AI coach characters (rendered from COACHES, count never
          hardcoded). A flat chip row stops scaling past a handful of
          coaches, so the filter lives in a compact sheet instead. */}
      <div style={{ padding: '4px 16px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <button className="mono" onClick={() => setCoachSheetOpen(true)} aria-haspopup="dialog"
          style={{ ...chipStyle(!!coachFilter), padding: coachFilter ? '4px 11px 4px 4px' : '6px 11px' }}>
          {coachFilter ? (
            <>
              <img src={imgOpt(COACHES.find(c => c.id === coachFilter).portrait.blob, 48)} alt="" referrerPolicy="no-referrer" loading="lazy"
                style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', display: 'block' }}/>
              {COACHES.find(c => c.id === coachFilter).name.toUpperCase()}
            </>
          ) : (
            <><Users size={11}/> COACH · ANY</>
          )}
          <ChevronDown size={11}/>
        </button>
        {coachFilter && (
          <button className="tap" onClick={() => setCoachFilter(null)} aria-label="Clear coach filter"
            style={{ color: '#5F636B', display: 'flex' }}>
            <X size={13}/>
          </button>
        )}
      </div>

      {coachSheetOpen && (
        <div className="sheet-backdrop" style={{ zIndex: 210 }} onClick={() => setCoachSheetOpen(false)}>
          <div className="slide-up phone-scroll sheet-panel" role="dialog" aria-label="Filter drills by coach"
            onClick={e => e.stopPropagation()} style={{ padding: '18px 18px 22px', maxHeight: '80%', overflowY: 'auto' }}>
            <div className="sheet-handle"/>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '6px 0 12px' }}>
              <SectionLabel>FILTER BY COACH</SectionLabel>
              <span className="stamp stamp--clay">AI Coach</span>
            </div>
            {[null, ...COACHES].map(c => {
              const active = coachFilter === (c?.id ?? null);
              const count = c ? DRILLS.filter(d => d.coachId === c.id).length : DRILLS.length;
              return (
                <button key={c?.id ?? 'all'} onClick={() => { setCoachFilter(c?.id ?? null); setCoachSheetOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                    padding: '9px 10px', borderRadius: 12, cursor: 'pointer', marginBottom: 4,
                    background: active ? 'rgba(197,255,61,0.10)' : 'transparent',
                    border: active ? '1px solid rgba(197,255,61,0.45)' : '1px solid transparent',
                  }}>
                  {c ? (
                    <img src={imgOpt(c.portrait.blob, 64)} alt="" referrerPolicy="no-referrer" loading="lazy"
                      style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', display: 'block' }}/>
                  ) : (
                    <span style={{
                      width: 32, height: 32, borderRadius: '50%', background: '#18181C', border: '1px solid #2A2A30',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}><Users size={14} color="#9CA0A8"/></span>
                  )}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="display" style={{ display: 'block', fontSize: 13, textTransform: 'uppercase', color: 'var(--km-chalk)' }}>
                      {c ? c.name : 'All coaches'}
                    </span>
                    {c && (
                      <span className="mono" style={{
                        display: 'block', fontSize: 8, color: '#5F636B', letterSpacing: '0.08em', marginTop: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{c.style.toUpperCase()}</span>
                    )}
                  </span>
                  <span className="mono" style={{ fontSize: 9, color: active ? '#C5FF3D' : '#9CA0A8', letterSpacing: '0.1em', flexShrink: 0 }}>
                    {count} DRILL{count === 1 ? '' : 'S'}
                  </span>
                  {active && <CheckCircle2 size={14} color="#C5FF3D" style={{ flexShrink: 0 }}/>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {shown.length === 0 ? (
        <div style={{ padding: '18px 16px 24px', textAlign: 'center' }}>
          <div className="body" style={{ fontSize: 13, color: '#9CA0A8' }}>No drills here yet. More coming.</div>
        </div>
      ) : (
        <div className="drill-grid">
          {shown.map(d => {
            const coach = coachFor(d);
            return (
              <button key={d.id} onClick={() => openDrill(d)} className="card-hover" style={{
                textAlign: 'left', cursor: 'pointer', padding: 0,
                background: 'var(--km-card)', border: d.sport === athleteSport ? '1px solid rgba(197,255,61,0.45)' : '1px solid #2A2A30',
                borderRadius: 14, overflow: 'hidden',
              }}>
                <div style={{ aspectRatio: '2 / 1', position: 'relative', overflow: 'hidden' }}>
                  {/* Served from our Blob mirror via the image optimizer;
                      .cdn is the original source reference only, never a
                      runtime fallback. */}
                  <img src={imgOpt(d.poster.blob, 750)} alt="" referrerPolicy="no-referrer" loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', inset: 0 }}/>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(15,15,20,0.05) 0%, rgba(15,15,20,0.85) 100%)' }}/>
                  {isNewDrill(d) && (
                    <span className="mono" style={{
                      position: 'absolute', top: 6, right: 6, padding: '2px 6px', borderRadius: 4,
                      background: '#C5FF3D', color: '#000', fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
                    }}>NEW</span>
                  )}
                  <div style={{ position: 'absolute', bottom: 6, left: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: trial.expired ? 'rgba(24,24,28,0.9)' : 'rgba(197,255,61,0.9)',
                      border: trial.expired ? '1px solid #3A3A42' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {trial.expired ? <Lock size={10} color="#9CA0A8"/> : <Video size={11} color="#000"/>}
                    </span>
                    <span className="mono" style={{ fontSize: 8, color: '#D4D6DA', letterSpacing: '0.1em', fontWeight: 700 }}>
                      {trial.expired ? 'LOCKED' : 'INTRO + DEMO'}
                    </span>
                  </div>
                </div>
                <div style={{ padding: '9px 10px 11px' }}>
                  <div className="display" style={{ fontSize: 15, lineHeight: 1.05, textTransform: 'uppercase', color: 'var(--km-chalk)' }}>{d.title}</div>
                  <div className="mono" style={{ fontSize: 8.5, color: d.sport === athleteSport ? '#C5FF3D' : '#5F636B', letterSpacing: '0.1em', marginTop: 4 }}>
                    {d.sport.toUpperCase()}{d.sport === athleteSport ? ' · FOR YOU' : ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                    <img src={imgOpt(coach.portrait.blob, 32)} alt="" referrerPolicy="no-referrer" loading="lazy"
                      style={{ width: 14, height: 14, borderRadius: '50%', objectFit: 'cover', display: 'block' }}/>
                    <span className="mono" style={{ fontSize: 8, color: '#9CA0A8', letterSpacing: '0.08em' }}>{coach.name.toUpperCase()}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ============================================================
   DRILL DETAIL — tabbed: OVERVIEW / HOW TO / MY PROGRESS

   Everything teachable on this screen comes from the manifest via
   src/lib/drills.ts and is human-written. A field that is null
   renders NO section — never an empty heading, never a placeholder,
   never a guess. That is why each block below is behind a data
   check rather than a fallback string.

   Deliberately absent: any leaderboard or public ranking of athletes
   against each other. Progress here is a kid measured against their
   own last rep and nobody else's. If social comparison ever ships it
   will be team-scoped and opt-in.
   ============================================================ */

/* drill.sport is the manifest's display name ("Basketball"); the field
   geometry set is keyed by the lowercase sport id. A sport with no
   geometry drawn yet renders none rather than borrowing another
   sport's lines. */
function drillGeoSport(sport) {
  const key = String(sport || '').toLowerCase();
  return hasFieldGeo(key) ? key : null;
}

/* Poster-first player: the still is what loads, tapping it starts the
   clip. Keeps a grid of drill pages cheap on a phone plan and stops
   six videos from buffering at once. */
function DrillVideo({ src, poster, label, loop = false }) {
  const [playing, setPlaying] = useState(false);
  if (playing) {
    return (
      <video className="drill-video" src={src} poster={poster}
        controls autoPlay playsInline loop={loop} preload="metadata"/>
    );
  }
  return (
    <button type="button" className="drill-video drill-poster" onClick={() => setPlaying(true)}
      aria-label={`Play ${label}`}>
      <img src={poster} alt="" referrerPolicy="no-referrer" loading="lazy"/>
      <span className="drill-play" aria-hidden="true"><Play size={19} color="#000" fill="#000"/></span>
    </button>
  );
}

/* Eyebrow stamp (Panchang) over a Clash headline: the section rhythm
   for the whole page, so every block is scannable at a glance. */
function DrillSectionHead({ eyebrow, title, tone }) {
  return (
    <div className="drill-section-head">
      <span className={`stamp${tone ? ` stamp--${tone}` : ''}`}>{eyebrow}</span>
      <h3 className="display drill-section-title">{title}</h3>
    </div>
  );
}

function DrillFact({ icon, label, value }) {
  return (
    <div className="drill-fact">
      <span className="drill-fact-icon" aria-hidden="true">{icon}</span>
      <span style={{ minWidth: 0 }}>
        <span className="wide drill-fact-label">{label}</span>
        <span className="mono drill-fact-value">{value}</span>
      </span>
    </div>
  );
}

/* Log sheet. Reps and note are BOTH optional and the primary button is
   always enabled: one tap with nothing filled in is a real log. Friction
   is the thing that stops kids logging at all, so there is no required
   field, no confirmation step, and no "are you sure". */
function LogDrillSheet({ drill, onSave, onClose }) {
  const [reps, setReps] = useState('');
  const [notes, setNotes] = useState('');
  const repsNum = Number.parseInt(reps, 10);
  const save = () => {
    onSave({
      drillId: drill.id,
      reps: Number.isFinite(repsNum) && repsNum > 0 ? repsNum : null,
      notes,
    });
  };
  return (
    <div className="sheet-backdrop" style={{ zIndex: 230 }} onClick={onClose}>
      <div className="slide-up sheet-panel" role="dialog" aria-label={`Log ${drill.title}`}
        onClick={e => e.stopPropagation()} style={{ padding: '20px 18px 24px' }}>
        <div className="sheet-handle"/>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 6 }}>
          <div>
            <span className="stamp stamp--lime">Logging</span>
            <div className="display" style={{ fontSize: 24, lineHeight: 1, textTransform: 'uppercase', marginTop: 9 }}>
              {drill.title}
            </div>
          </div>
          <button onClick={onClose} className="tap" aria-label="Cancel" style={{ color: '#5F636B' }}>
            <X size={20}/>
          </button>
        </div>

        <div className="body" style={{ fontSize: 12.5, color: '#9CA0A8', lineHeight: 1.5, margin: '12px 0 18px' }}>
          Both of these are optional. Tap the button and you are logged.
        </div>

        <label className="wide" style={{ display: 'block', fontSize: 9, color: '#5F636B', marginBottom: 8 }}>
          Reps <span style={{ color: '#3F434B' }}>(optional)</span>
        </label>
        <input
          value={reps} onChange={e => setReps(e.target.value.replace(/[^0-9]/g, ''))}
          inputMode="numeric" placeholder="How many?" className="mono"
          style={{
            width: '100%', background: 'var(--km-high)', border: 'none', borderRadius: 12,
            padding: '14px 16px', color: 'var(--km-chalk)', fontSize: 15, outline: 'none', marginBottom: 18,
          }}
        />

        <label className="wide" style={{ display: 'block', fontSize: 9, color: '#5F636B', marginBottom: 8 }}>
          Note <span style={{ color: '#3F434B' }}>(optional)</span>
        </label>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value.slice(0, 2000))}
          rows={3} placeholder="How did it feel?" className="body"
          style={{
            width: '100%', background: 'var(--km-high)', border: 'none', borderRadius: 12,
            padding: '14px 16px', color: 'var(--km-chalk)', fontSize: 14, outline: 'none',
            resize: 'none', marginBottom: 20,
          }}
        />

        <button onClick={save} className="body" style={{
          width: '100%', background: '#C5FF3D', color: '#000', border: 'none',
          padding: '16px', borderRadius: 999, fontWeight: 700, fontSize: 15, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <CheckCircle2 size={16}/> Log it
        </button>
      </div>
    </div>
  );
}

/* Reps over time. Deliberately a bare polyline: it is one athlete's own
   numbers against their own past, with no cohort, average, or rank to
   compare against. A flat line is a truthful flat line. */
function DrillRepsChart({ series }) {
  const W = 320, H = 96, PAD = 6;
  const values = series.map(p => p.reps);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const x = (i) => series.length === 1 ? W / 2 : PAD + (i * (W - PAD * 2)) / (series.length - 1);
  const y = (v) => H - PAD - ((v - min) / span) * (H - PAD * 2);
  const points = series.map((p, i) => `${x(i).toFixed(1)},${y(p.reps).toFixed(1)}`).join(' ');
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none"
        role="img" aria-label={`Reps over your last ${series.length} logged sessions, from ${values[0]} to ${values[values.length - 1]}`}>
        {series.length > 1 && (
          <polyline points={points} fill="none" stroke="#C5FF3D" strokeWidth="2"
            strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
        )}
        {series.map((p, i) => (
          <circle key={`${p.date}-${i}`} cx={x(i)} cy={y(p.reps)} r="3" fill="#C5FF3D"/>
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span className="mono" style={{ fontSize: 9, color: '#5F636B', letterSpacing: '0.1em' }}>
          {new Date(series[0].date).toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase()}
        </span>
        <span className="mono" style={{ fontSize: 9, color: '#5F636B', letterSpacing: '0.1em' }}>
          {new Date(series[series.length - 1].date).toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase()}
        </span>
      </div>
    </div>
  );
}

function DrillStat({ value, label }) {
  return (
    <div className="drill-stat">
      <span className="mono drill-stat-value">{value}</span>
      <span className="wide drill-stat-label">{label}</span>
    </div>
  );
}

function DrillProgressPanel({ drill, sessions, athleteStats }) {
  const p = drillProgress(sessions, drill.id);
  // Only renders when the drill names a stat AND the athlete has that
  // stat on their sheet. Both null today (no trackedStat is set yet).
  const best = trackedStatFor(drill, athleteStats);

  if (p.total === 0) {
    return (
      <div className="drill-block drill-empty">
        <span className="drill-empty-icon"><TrendingUp size={20} color="#5F636B"/></span>
        <div className="display drill-empty-title">NOTHING LOGGED YET</div>
        {/* No CTA here on purpose: the "Log this drill" button is
            already on screen and permanent. Two identical lime buttons
            would just compete with each other. */}
        <p className="drill-empty-sub body">Log your first rep and your progress shows up here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="drill-block">
        <DrillSectionHead eyebrow="Your reps" title="This drill"/>
        <div className="drill-stats">
          <DrillStat value={p.total} label={p.total === 1 ? 'Time done' : 'Times done'}/>
          <DrillStat value={p.streak} label={p.streak === 1 ? 'Day streak' : 'Day streak'}/>
          {p.bestReps != null && <DrillStat value={p.bestReps} label="Best reps"/>}
        </div>
      </div>

      {/* The chart needs at least one logged rep count. Sessions logged
          with a single tap carry no reps, and that is fine — the chart
          just does not appear. */}
      {p.repSeries.length > 0 && (
        <div className="drill-block">
          <DrillSectionHead eyebrow="Over time" title="Reps"/>
          <DrillRepsChart series={p.repSeries}/>
        </div>
      )}

      {best && (
        <div className="drill-block">
          <DrillSectionHead eyebrow="On your stat sheet" title="Personal best" tone="clay"/>
          <div className="drill-pb">
            <span className="mono drill-pb-value">{best.value}{best.unit ? <span className="drill-pb-unit">{best.unit}</span> : null}</span>
            <span className="wide drill-pb-label">{best.label}</span>
          </div>
        </div>
      )}

      <div className="drill-block">
        <DrillSectionHead eyebrow="History" title="Last sessions"/>
        <ul className="drill-log">
          {p.sessions.slice(0, 10).map(s => (
            <li key={s.id} className="drill-log-row">
              <span className="mono drill-log-date">
                {new Date(s.date).toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase()}
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="mono drill-log-reps">{s.reps != null ? `${s.reps} REPS` : 'LOGGED'}</span>
                {s.notes && <span className="body drill-log-note">{s.notes}</span>}
              </span>
            </li>
          ))}
        </ul>
        {p.total > 10 && (
          <div className="mono" style={{ textAlign: 'center', fontSize: 9.5, color: '#5F636B', letterSpacing: '0.1em', paddingTop: 12 }}>
            + {p.total - 10} EARLIER SESSION{p.total - 10 === 1 ? '' : 'S'}
          </div>
        )}
      </div>
    </>
  );
}

function DrillSheet({ drill, athleteId, athleteStats, sessions = [], onLogDrill, onOpenDrill, onClose }) {
  const coach = coachFor(drill);
  const { expired } = drillTrialState(athleteId);
  const [tab, setTab] = useState('overview');
  const [logOpen, setLogOpen] = useState(false);
  // Confirmation after a log, so the tap visibly did something and the
  // XP it earned is named rather than silently appearing on the profile.
  const [logged, setLogged] = useState(null);

  useEffect(() => {
    // Role/step analytics only, no PII - same rule as the CRO events.
    if (expired) track('pro_gate_shown', { surface: 'drill_sheet' });
  }, [expired]);

  useEffect(() => {
    if (!logged) return;
    const timer = setTimeout(() => setLogged(null), 4000);
    return () => clearTimeout(timer);
  }, [logged]);

  const saveLog = (entry) => {
    const before = sessions.filter(s => s && s.drillId === drill.id).length;
    const totalBefore = sessions.length;
    if (onLogDrill) onLogDrill(entry);
    setLogOpen(false);
    setTab('progress');
    // Drill logging earns XP through the shared achievements system; a
    // session only crosses a threshold once, so this names the XP the
    // athlete just unlocked and nothing otherwise.
    const unlocked =
      totalBefore === 0 ? 'first_drill'
      : totalBefore === 9 ? 'drills_10'
      : null;
    setLogged({ first: before === 0, xp: unlocked ? achievementXp(unlocked) : 0 });
    track('drill_logged', { hasReps: entry.reps != null });
    // ACTIVATION. This is the event that matters most on the whole site:
    // a signup that never logs anything is a vanity number while nothing is
    // charged, and the first logged drill is what predicts a return visit.
    // See docs/conversion-goals.md.
    if (totalBefore === 0) track('first_drill_played', { sport: drill.sport, drillId: drill.id });
  };

  const showHowTo = hasHowTo(drill);
  const TABS = [
    { key: 'overview', label: 'Overview' },
    // No written how-to means no HOW TO tab at all. An empty tab is a
    // worse answer than an absent one.
    ...(showHowTo ? [{ key: 'howto', label: 'How to' }] : []),
    { key: 'progress', label: 'My progress' },
  ];
  const active = TABS.some(t => t.key === tab) ? tab : 'overview';

  const related = relatedDrills(drill);

  const geo = drillGeoSport(drill.sport);
  const posterSrc = imgOpt(drill.poster.blob, 1200);

  return (
    <div className="sheet-backdrop" style={{ zIndex: 210 }} onClick={onClose}>
      <div className="slide-up phone-scroll sheet-panel sheet-panel--drill"
        role="dialog" aria-label={`${drill.title} drill`}
        onClick={e => e.stopPropagation()}>
        {/* One field-geometry element for the whole screen, from this
            drill's own sport (docs/design-system.md restraint rules). */}
        {geo && <FieldGeo sport={geo} opacity={0.055} style={{ right: -140, top: -60 }}/>}

        <div className="sheet-handle"/>

        <div className="drill-inner">
          <header className="drill-head">
            <div style={{ minWidth: 0 }}>
              <div className="mono drill-eyebrow">
                {drill.sport.toUpperCase()} · {drill.focus.toUpperCase()}{isNewDrill(drill) ? ' · NEW' : ''}
              </div>
              <h2 className="display drill-title">{drill.title}</h2>
            </div>
            <div className="drill-head-side">
              {/* The AI label rides in the header so it is on screen on
                  every tab, not only where the video is. */}
              <span className="stamp stamp--clay">AI Coach</span>
              <button onClick={onClose} className="tap" aria-label="Close drill" style={{ color: '#5F636B' }}>
                <X size={20}/>
              </button>
            </div>
          </header>

          <div className="drill-detail" data-tab={active}>
            <div className="drill-tabbar" role="tablist" aria-label="Drill detail sections">
              {TABS.map(t => (
                <button key={t.key} role="tab" id={`drill-tab-${t.key}`}
                  aria-selected={active === t.key} aria-controls={`drill-panel-${t.key}`}
                  className={`wide drill-tab${active === t.key ? ' is-active' : ''}`}
                  onClick={() => setTab(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="drill-aside">
            <div className="drill-media">
              {expired ? (
                /* UNREACHABLE DURING BETA. drillTrialState() forces
                   `expired` false while OFFER.PRICING_LAUNCHED is false,
                   so nothing renders this today. It is kept, and kept
                   honest, so that a future paid tier does not have to
                   reinvent the screen — and so nobody reading this file
                   mistakes the dead branch for a live promise. It states
                   no price, because there is no price. */
                <div className="drill-locked">
                  <img src={imgOpt(drill.poster.blob, 750)} alt="" referrerPolicy="no-referrer"/>
                  <div className="drill-locked-body">
                    <span className="drill-locked-icon"><Lock size={18} color="#000"/></span>
                    <div className="display" style={{ fontSize: 20, lineHeight: 1, textTransform: 'uppercase' }}>
                      DRILL VIDEOS ARE <span style={{ color: '#C5FF3D' }}>LOCKED</span>
                    </div>
                    <div className="body" style={{ fontSize: 12.5, color: '#D4D6DA', lineHeight: 1.5, maxWidth: 380 }}>
                      Nice work training with {coach.name}. Every step of this
                      drill stays readable — it is the videos that are locked,
                      not knowing how to do it.
                    </div>
                    <div className="mono" style={{ fontSize: 9, color: '#9CA0A8', letterSpacing: '0.1em' }}>
                      PROFILE · WORKOUTS · FEED · MESSAGES · SESSIONS STAY FREE
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Single-clip drills (intro null) skip straight to the
                      demo and drop the step numbering. Served from our
                      Blob mirror; .cdn is provenance only, never a
                      runtime fallback. */}
                  {drill.intro && (
                    <>
                      <div className="mono drill-cliplabel">
                        1 · COACH INTRO <span style={{ color: '#5F636B' }}>(sound on)</span>
                      </div>
                      <DrillVideo src={drill.intro.blob} poster={posterSrc} label={`${drill.title} coach intro`}/>
                    </>
                  )}
                  <div className="mono drill-cliplabel">
                    {drill.intro ? '2 · ' : ''}WATCH THE DEMO <span style={{ color: '#5F636B' }}>(slow rep, copy it)</span>
                  </div>
                  <DrillVideo src={drill.demo.blob} poster={posterSrc} label={`${drill.title} demo`} loop/>
                </>
              )}

              <div className="drill-coach">
                <img src={imgOpt(coach.portrait.blob, 96)} alt={`${coach.name} portrait`} referrerPolicy="no-referrer"/>
                <span style={{ minWidth: 0 }}>
                  <span className="display drill-coach-name">{coach.name}</span>
                  <span className="mono drill-coach-style">{coach.style.toUpperCase()}</span>
                </span>
              </div>

              <p className="body drill-ai-note">
                This coach is AI-generated for the demo. Real verified coaches
                review all drills before launch.
              </p>
            </div>

            {/* Logging stays on screen on every tab: the moment a kid
                finishes a set is the moment they should be able to log
                it, wherever they happen to be on the page. Never gated
                by the Pro state — the clips lock, a kid's own training
                log does not. */}
            <div className="drill-actions">
              {onLogDrill && (
                <button onClick={() => setLogOpen(true)} className="body drill-log-btn">
                  <Plus size={15}/> Log this drill
                </button>
              )}
              {logged && (
                <div className="drill-logged" role="status">
                  <CheckCircle2 size={14} color="#C5FF3D" style={{ flexShrink: 0 }}/>
                  <span className="body">
                    {logged.first ? 'Logged. First one on this drill.' : 'Logged. Keep it going.'}
                    {logged.xp > 0 && <span className="mono drill-logged-xp">+{logged.xp} XP</span>}
                  </span>
                </div>
              )}
            </div>
            </div>

            <div className="drill-panels">
              {/* Every panel stays mounted and its text stays in the DOM;
                  switching tabs only changes what is shown. Nothing here
                  is fetched or built on interaction. */}
              <section id="drill-panel-overview" role="tabpanel" aria-labelledby="drill-tab-overview"
                hidden={active !== 'overview'}>
                {drill.summary && (
                  <p className="body drill-summary">{drill.summary}</p>
                )}

                {drill.builds?.length > 0 && (
                  <div className="drill-block">
                    <DrillSectionHead eyebrow="Trains" title="What this builds"/>
                    <div className="drill-chips">
                      {drill.builds.map(b => (
                        <span key={b} className="stamp stamp--lime stamp--flat">{b}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="drill-block">
                  <DrillSectionHead eyebrow="At a glance" title="Quick facts"/>
                  <div className="drill-facts">
                    <DrillFact icon={<span style={{ fontSize: 15 }}>{SPORT_META[drill.sport]?.icon ?? ''}</span>}
                      label="Sport" value={drill.sport}/>
                    <DrillFact icon={<Gauge size={14} color="#9CA0A8"/>} label="Level" value={drill.level}/>
                    {drill.equipment?.length > 0 && (
                      <DrillFact icon={<Package size={14} color="#9CA0A8"/>} label="Equipment"
                        value={drill.equipment.join(', ')}/>
                    )}
                    {drill.space && (
                      <DrillFact icon={<MapPin size={14} color="#9CA0A8"/>} label="Space" value={drill.space}/>
                    )}
                  </div>
                </div>

                {related.length > 0 && (
                  <div className="drill-block">
                    <DrillSectionHead eyebrow="Keep going" title="Related drills"/>
                    <div className="drill-related">
                      {related.map(r => (
                        <button key={r.id} className="drill-related-card card-hover"
                          onClick={() => onOpenDrill && onOpenDrill(r)}>
                          <img src={imgOpt(r.poster.blob, 384)} alt="" referrerPolicy="no-referrer" loading="lazy"/>
                          <span className="display drill-related-title">{r.title}</span>
                          <span className="mono drill-related-meta">{r.focus.toUpperCase()}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {showHowTo && (
                <section id="drill-panel-howto" role="tabpanel" aria-labelledby="drill-tab-howto"
                  hidden={active !== 'howto'}>
                  {drill.steps?.length > 0 && (
                    <div className="drill-block">
                      <DrillSectionHead eyebrow="Step by step" title="How to do it"/>
                      <ol className="drill-steps">
                        {drill.steps.map(s => (
                          <li key={s.n} className="drill-step">
                            <span className="mono drill-step-n" aria-hidden="true">{String(s.n).padStart(2, '0')}</span>
                            <span style={{ minWidth: 0 }}>
                              <span className="display drill-step-title">{s.title}</span>
                              <span className="body drill-step-detail">{s.detail}</span>
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {drill.mistakes?.length > 0 && (
                    <div className="drill-block">
                      <DrillSectionHead eyebrow="Watch for" title="Common mistakes" tone="clay"/>
                      <ul className="drill-mistakes">
                        {drill.mistakes.map(m => (
                          <li key={m.mistake} className="drill-mistake">
                            <span className="drill-mistake-side">
                              <span className="wide drill-mistake-label">Mistake</span>
                              <span className="body drill-mistake-text">{m.mistake}</span>
                            </span>
                            {/* The fix is the half that matters, so it
                                gets the lime and the weight. */}
                            <span className="drill-mistake-side drill-mistake-side--fix">
                              <span className="wide drill-mistake-label drill-mistake-label--fix">Fix</span>
                              <span className="body drill-mistake-text drill-mistake-text--fix">{m.fix}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              )}

              <section id="drill-panel-progress" role="tabpanel" aria-labelledby="drill-tab-progress"
                hidden={active !== 'progress'}>
                <DrillProgressPanel drill={drill} sessions={sessions} athleteStats={athleteStats}/>
              </section>
            </div>
          </div>
        </div>
      </div>

      {logOpen && (
        <LogDrillSheet drill={drill} onSave={saveLog} onClose={() => setLogOpen(false)}/>
      )}
    </div>
  );
}

/* ============================================================
   MESSAGES VIEW
   ============================================================ */
function MessagesView({ conversations, trainers = TRAINERS, blockedIds = [], onOpenChat, onGoToTrainers }) {
  // Blocked coaches' threads disappear from the inbox immediately.
  const sortedConvs = Object.values(conversations)
    .filter(c => c.messages.length > 0 && !blockedIds.includes(c.trainerId));

  if (sortedConvs.length === 0) {
    return (
      <div className="view view--messages" style={{ padding: '12px 0 24px' }}>
        <div style={{ padding: '0 16px 12px' }}>
          <div className="display view-title">YOUR <span style={{ color: '#C5FF3D' }}>MESSAGES</span></div>
          <div className="mono" style={{ fontSize: 11, color: '#9CA0A8', letterSpacing: '0.08em' }}>NO CONVERSATIONS YET</div>
        </div>
        <div style={{ padding: '40px 16px 0', textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(197,255,61,0.1) 0%, rgba(197,255,61,0.02) 100%)',
            border: '1px solid rgba(201,111,74,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <Inbox size={36} color="#C5FF3D"/>
          </div>
          <div className="display" style={{ fontSize: 28, lineHeight: 1, marginBottom: 10, textTransform: 'uppercase' }}>NO MESSAGES YET</div>
          <div className="body" style={{ fontSize: 13, color: '#9CA0A8', marginBottom: 24, lineHeight: 1.5, maxWidth: 280, margin: '0 auto 24px' }}>
            Tap a trainer to start a conversation. Ask about their style, request a session, or just say hi.
          </div>
          <button onClick={onGoToTrainers} style={{
            background: '#C5FF3D', color: '#000', border: 'none',
            padding: '14px 24px', borderRadius: 999, fontWeight: 700, fontSize: 14, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }} className="body">Find a trainer <ArrowRight size={14}/></button>
        </div>
      </div>
    );
  }

  return (
    <div className="view view--messages" style={{ padding: '12px 0 24px' }}>
      <div style={{ padding: '0 16px 12px' }}>
        <div className="display view-title">YOUR <span style={{ color: '#C5FF3D' }}>MESSAGES</span></div>
        <div className="mono" style={{ fontSize: 11, color: '#9CA0A8', letterSpacing: '0.08em' }}>
          {sortedConvs.length} CONVERSATION{sortedConvs.length !== 1 ? 'S' : ''}
        </div>
      </div>

      <div style={{ padding: '8px 16px 16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#18181C', border: '1px solid #2A2A30', borderRadius: 12, padding: '12px 14px',
        }}>
          <Search size={16} color="#5F636B"/>
          <span style={{ fontSize: 14, color: '#5F636B' }} className="body">Search messages</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 8px' }}>
        {sortedConvs.map(c => {
          const trainer = trainers.find(t => t.id === c.trainerId);
          if (!trainer) return null;
          const last = c.messages[c.messages.length - 1];
          let preview = '';
          if (last) {
            if (last.text) preview = last.text;
            else if (last.type === 'pr') preview = `Logged PR: ${last.metric} ${last.value} ${last.unit}`;
            else if (last.type === 'video_review') preview = 'Sent a video review';
            else if (last.type === 'session_booked') preview = 'Session booked';
          }
          return <ConversationRow key={c.trainerId} trainer={trainer} conv={c} preview={preview} onClick={() => onOpenChat(c.trainerId)}/>;
        })}
      </div>
    </div>
  );
}

function ConversationRow({ trainer, conv, preview, onClick }) {
  const last = conv.messages[conv.messages.length - 1];
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', cursor: 'pointer',
      background: 'transparent', border: 'none', borderRadius: 14, padding: '12px',
      display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar photo={trainer.photo} initials={trainer.initials} size={50} color={trainer.color}/>
        {conv.online && (
          <span style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 12, height: 12, borderRadius: '50%',
            background: '#22C55E', border: '2px solid #0A0A0B',
          }}/>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div className="display" style={{ fontSize: 18, lineHeight: 1, textTransform: 'uppercase' }}>{trainer.name}</div>
          <span className="mono" style={{ fontSize: 9, color: '#5F636B', letterSpacing: '0.06em' }}>{last?.ts}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 13, color: conv.unread > 0 ? 'var(--km-chalk)' : '#9CA0A8',
            fontWeight: conv.unread > 0 ? 600 : 400,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0,
          }} className="body">{preview}</span>
          {conv.unread > 0 && (
            <span className="mono" style={{
              fontSize: 10, background: '#C5FF3D', color: '#000',
              minWidth: 18, height: 18, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, padding: '0 6px', flexShrink: 0,
            }}>{conv.unread}</span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ============================================================
   CHAT VIEW
   ============================================================ */
function ChatView({ trainer, conversation, athlete, blocked = false, onBlock, onClose, onSend, onCall }) {
  const [input, setInput] = useState('');
  // 'menu' | 'report' | 'report_done' | 'block' | null
  const [safetySheet, setSafetySheet] = useState(null);
  const scrollRef = useRef(null);
  const messages = conversation?.messages || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = (text) => {
    const t = (text || input).trim();
    if (!t) return;
    onSend(t);
    setInput('');
    // No fake "trainer is typing" simulation. Replies come from the real
    // coach on the other end (via /coach), surfaced through the storage sync.
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 150 }} onClick={onClose}>
    <div className="modal-panel slide-up" onClick={e => e.stopPropagation()}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 12px', borderBottom: '1px solid #1F1F25', flexShrink: 0,
        background: 'rgba(10,10,11,0.95)', backdropFilter: 'blur(12px)',
        position: 'relative', zIndex: 10, gap: 8,
      }}>
        <button onClick={onClose} className="tap" style={{ color: 'var(--km-chalk)' }}>
          <ChevronLeft size={22}/>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar photo={trainer.photo} initials={trainer.initials} size={36} color={trainer.color}/>
            {conversation?.online && (
              <span style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 10, height: 10, borderRadius: '50%',
                background: '#22C55E', border: '2px solid #0A0A0B',
              }}/>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="display" style={{ fontSize: 16, lineHeight: 1, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{trainer.name}</div>
            <div className="mono" style={{ fontSize: 9, color: conversation?.online ? '#22C55E' : '#5F636B', marginTop: 4, letterSpacing: '0.08em' }}>
              {conversation?.online ? 'ONLINE NOW' : 'OFFLINE'}
            </div>
          </div>
        </div>
        <button onClick={onCall} style={{
          background: '#C5FF3D', border: 'none', color: '#000', cursor: 'pointer',
          width: 36, height: 36, borderRadius: '50%', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Video size={16}/>
        </button>
        <button onClick={() => setSafetySheet('menu')} aria-label="Chat safety options" style={{
          background: '#18181C', border: '1px solid #2A2A30', color: '#9CA0A8', cursor: 'pointer',
          width: 36, height: 36, borderRadius: '50%', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <MoreHorizontal size={16}/>
        </button>
      </div>

      <div ref={scrollRef} className="phone-scroll" style={{
        flex: 1, overflow: 'auto', padding: '16px 12px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
            <Avatar photo={trainer.photo} initials={trainer.initials} size={70} color={trainer.color}/>
            <div className="display" style={{ fontSize: 22, lineHeight: 1, marginTop: 16, textTransform: 'uppercase' }}>{trainer.name}</div>
            <div className="mono" style={{ fontSize: 10, color: '#9CA0A8', marginTop: 6, letterSpacing: '0.08em' }}>{trainer.title.toUpperCase()}</div>
            <div className="body" style={{ fontSize: 12.5, color: '#9CA0A8', marginTop: 16, maxWidth: 260, lineHeight: 1.5 }}>
              Say hi. Ask about their training style, or send a video of your form for review.
            </div>
          </div>
        ) : (
          messages.map((m, i) => <Message key={m.id} m={m} trainer={trainer} isLastFromSender={i === messages.length - 1 || messages[i+1]?.from !== m.from}/>)
        )}
      </div>

      {blocked ? (
        <div className="body" style={{
          padding: '18px 16px 22px', borderTop: '1px solid #1F1F25', flexShrink: 0,
          textAlign: 'center', color: '#9CA0A8', fontSize: 13.5,
          background: 'rgba(10,10,11,0.95)',
        }}>
          You can't message this person.
        </div>
      ) : (
      <>
      {input.length === 0 && (
        <div style={{ padding: '0 12px 8px', display: 'flex', gap: 6, overflowX: 'auto' }} className="phone-scroll">
          {QUICK_REPLIES.map((q, i) => (
            <button key={i} onClick={() => handleSend(q)} className="body" style={{
              fontSize: 12, padding: '8px 12px', borderRadius: 999,
              background: 'rgba(197,255,61,0.08)', border: '1px solid rgba(201,111,74,0.3)',
              color: '#C5FF3D', whiteSpace: 'nowrap', cursor: 'pointer', fontWeight: 600,
            }}>{q}</button>
          ))}
        </div>
      )}

      <div style={{
        padding: '10px 12px 16px', borderTop: '1px solid #1F1F25',
        background: 'rgba(10,10,11,0.95)', backdropFilter: 'blur(12px)', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <button style={{
          width: 38, height: 38, borderRadius: '50%',
          background: '#18181C', border: '1px solid #2A2A30', color: '#9CA0A8', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Plus size={18}/>
        </button>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          placeholder={`Message ${trainer.name.split(' ')[0]}...`} className="body"
          style={{
            flex: 1, background: '#18181C', border: '1px solid #2A2A30',
            borderRadius: 999, padding: '10px 16px', color: 'var(--km-chalk)',
            fontSize: 14, outline: 'none', minWidth: 0,
          }}
        />
        <button onClick={() => handleSend()} disabled={!input.trim()} style={{
          width: 38, height: 38, borderRadius: '50%',
          background: input.trim() ? '#C5FF3D' : '#18181C',
          border: input.trim() ? 'none' : '1px solid #2A2A30',
          color: input.trim() ? '#000' : '#5F636B',
          cursor: input.trim() ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          transition: 'all 0.15s',
        }}>
          <SendIcon size={16}/>
        </button>
      </div>
      </>
      )}

      {safetySheet && (
        <ChatSafetySheet
          mode={safetySheet}
          setMode={setSafetySheet}
          trainer={trainer}
          athlete={athlete}
          onBlock={onBlock}
        />
      )}
    </div>
    </div>
  );
}

/* ============================================================
   CHAT SAFETY SHEET (report / block)
   Kid-facing copy: short, warm, never scary.
   ============================================================ */
const REPORT_REASONS = [
  { key: 'uncomfortable', label: 'They made me uncomfortable' },
  { key: 'personal_info', label: 'They asked for personal info' },
  { key: 'move_off_platform', label: 'They asked me to talk somewhere else' },
  { key: 'other', label: 'Something else' },
];

function ChatSafetySheet({ mode, setMode, trainer, athlete, onBlock }) {
  const [reason, setReason] = useState(null);
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const close = () => setMode(null);

  const submitReport = async () => {
    if (!reason || sending) return;
    setSending(true);
    setError('');
    const res = await sync.fileReport({
      reporterCode: athlete?.code || '',
      subjectCode: trainer?.code || '',
      reason,
      details: details.trim() || null,
    });
    setSending(false);
    if (res.ok) setMode('report_done');
    else setError(res.message || "We couldn't send this right now. Please try again in a bit.");
  };

  const sheetBtn = (primary) => ({
    width: '100%', padding: '13px 16px', borderRadius: 999, fontWeight: 700, fontSize: 14,
    cursor: 'pointer', border: primary ? 'none' : '1px solid #3A3A42',
    background: primary ? '#C5FF3D' : 'transparent',
    color: primary ? '#000' : 'var(--km-chalk)',
  });

  return (
    <div className="sheet-backdrop" style={{ zIndex: 260 }} onClick={close}>
      <div className="slide-up sheet-panel" onClick={e => e.stopPropagation()} style={{ padding: 24, maxHeight: '92%', overflowY: 'auto' }}>
        <div className="sheet-handle"/>

        {mode === 'menu' && (
          <>
            <div className="display" style={{ fontSize: 24, textTransform: 'uppercase', marginBottom: 6, marginTop: 4 }}>
              Need help with this chat?
            </div>
            <div className="body" style={{ fontSize: 13, color: '#9CA0A8', lineHeight: 1.5, marginBottom: 18 }}>
              If something feels off, you can tell us or block this coach. You won't get in trouble for asking for help.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="body" onClick={() => setMode('report')} style={sheetBtn(true)}>
                Report this coach
              </button>
              <button className="body" onClick={() => setMode('block')} style={sheetBtn(false)}>
                Block this coach
              </button>
              <button className="body" onClick={close} style={{ ...sheetBtn(false), border: 'none', color: '#5F636B' }}>
                Never mind
              </button>
            </div>
          </>
        )}

        {mode === 'report' && (
          <>
            <div className="display" style={{ fontSize: 24, textTransform: 'uppercase', marginBottom: 6, marginTop: 4 }}>
              Report {trainer?.name || 'this coach'}
            </div>
            <div className="body" style={{ fontSize: 13, color: '#9CA0A8', lineHeight: 1.5, marginBottom: 16 }}>
              A real person on our team will read this. What happened?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {REPORT_REASONS.map(r => (
                <button key={r.key} onClick={() => setReason(r.key)} className="body" style={{
                  textAlign: 'left', padding: '12px 14px', borderRadius: 12, fontSize: 13.5, fontWeight: 600,
                  cursor: 'pointer',
                  background: reason === r.key ? 'rgba(197,255,61,0.1)' : '#18181C',
                  border: reason === r.key ? '1px solid #C5FF3D' : '1px solid #2A2A30',
                  color: reason === r.key ? '#C5FF3D' : '#D4D6DA',
                }}>
                  {r.label}
                </button>
              ))}
            </div>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value.slice(0, 500))}
              placeholder="Tell us more if you want to (optional)"
              rows={3}
              className="body"
              style={{
                width: '100%', background: '#18181C', border: '1px solid #2A2A30',
                borderRadius: 12, padding: '12px 14px', color: 'var(--km-chalk)',
                fontSize: 13, outline: 'none', resize: 'none', marginBottom: 12, fontFamily: 'inherit',
              }}
            />
            {error && (
              <div className="body" style={{
                padding: '9px 12px', borderRadius: 10, marginBottom: 10,
                background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.4)',
                color: '#FF8888', fontSize: 12, lineHeight: 1.4,
              }}>{error}</div>
            )}
            <button className="body" onClick={submitReport} disabled={!reason || sending} style={{
              ...sheetBtn(true),
              background: reason && !sending ? '#C5FF3D' : '#1A1A20',
              color: reason && !sending ? '#000' : '#5F636B',
              cursor: reason && !sending ? 'pointer' : 'not-allowed',
            }}>
              {sending ? 'Sending...' : 'Send report'}
            </button>
          </>
        )}

        {mode === 'report_done' && (
          <>
            <div className="display" style={{ fontSize: 24, textTransform: 'uppercase', marginBottom: 6, marginTop: 4 }}>
              Thanks for telling us
            </div>
            <div className="body" style={{ fontSize: 13, color: '#9CA0A8', lineHeight: 1.6, marginBottom: 18 }}>
              A real person will look at this soon. If you don't want to hear from this coach, you can block them too.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="body" onClick={() => setMode('block')} style={sheetBtn(true)}>
                Block this coach
              </button>
              <button className="body" onClick={close} style={sheetBtn(false)}>
                Done
              </button>
            </div>
          </>
        )}

        {mode === 'block' && (
          <>
            <div className="display" style={{ fontSize: 24, textTransform: 'uppercase', marginBottom: 6, marginTop: 4 }}>
              Block {trainer?.name || 'this coach'}?
            </div>
            <div className="body" style={{ fontSize: 13, color: '#9CA0A8', lineHeight: 1.6, marginBottom: 18 }}>
              You won't see messages from them anymore, and they can't message you. They won't be told you blocked them.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="body" onClick={() => { close(); onBlock && onBlock(); }} style={sheetBtn(true)}>
                Block
              </button>
              <button className="body" onClick={close} style={sheetBtn(false)}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Message({ m, trainer, isLastFromSender }) {
  // Session system cards: booking decisions live in the conversation
  // as neutral centered cards (same pattern as the old booked card).
  if (typeof m.text === 'string' && m.text.startsWith('[session]')) {
    return (
      <div className="slide-up-msg" style={{ alignSelf: 'center', maxWidth: '88%', margin: '4px 0' }}>
        <div style={{
          background: '#18181C', border: '1px dashed #3A3A42', borderRadius: 16, padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <CalIcon size={14} color="#C5FF3D" style={{ flexShrink: 0 }}/>
          <span className="body" style={{ fontSize: 12.5, color: '#D4D6DA', lineHeight: 1.5 }}>
            {m.text.slice('[session]'.length).trim()}
          </span>
        </div>
      </div>
    );
  }

  // Calm, non-scary notice shown when a message was not sent (safety
  // block, rate limit). Local-only, never stored server-side.
  if (m.type === 'safety_notice') {
    return (
      <div className="slide-up-msg" style={{ alignSelf: 'center', maxWidth: '88%', margin: '4px 0' }}>
        <div className="body" style={{
          background: 'rgba(93,169,255,0.08)', border: '1px solid rgba(93,169,255,0.35)',
          borderRadius: 14, padding: '10px 14px', fontSize: 12.5, lineHeight: 1.5, color: '#B9D6F7',
          textAlign: 'center',
        }}>
          {m.text}
        </div>
      </div>
    );
  }

  if (m.type === 'pr') {
    return (
      <div className="slide-up-msg" style={{ alignSelf: 'center', maxWidth: '85%', margin: '4px 0' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(197,255,61,0.12) 0%, rgba(197,255,61,0.04) 100%)',
          border: '1px solid rgba(197,255,61,0.3)',
          borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: '#C5FF3D',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <TrendingUp size={20} color="#000"/>
          </div>
          <div style={{ flex: 1 }}>
            <div className="mono" style={{ fontSize: 9.5, color: '#9CA0A8', letterSpacing: '0.15em', marginBottom: 4 }}>VERIFIED PR LOGGED</div>
            <div className="display" style={{ fontSize: 22, lineHeight: 1, color: 'var(--km-chalk)' }}>
              {m.value} <span className="mono" style={{ fontSize: 12, color: '#9CA0A8' }}>{m.unit}</span>
              <span className="mono" style={{ fontSize: 11, color: '#C5FF3D', marginLeft: 8, fontWeight: 700 }}>{m.delta}</span>
            </div>
            <div className="mono" style={{ fontSize: 10, color: '#5F636B', marginTop: 4, letterSpacing: '0.08em' }}>{m.metric.toUpperCase()} &middot; {m.ts}</div>
          </div>
        </div>
      </div>
    );
  }

  if (m.type === 'session_booked') {
    return (
      <div className="slide-up-msg" style={{ alignSelf: 'center', maxWidth: '85%', margin: '4px 0' }}>
        <div style={{
          background: '#18181C', border: '1px dashed #3A3A42', borderRadius: 16, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <CalIcon size={16} color="#C5FF3D"/>
          <div style={{ flex: 1 }}>
            <div className="display" style={{ fontSize: 14, lineHeight: 1, textTransform: 'uppercase' }}>SESSION BOOKED</div>
            <div className="mono" style={{ fontSize: 10, color: '#9CA0A8', marginTop: 4, letterSpacing: '0.06em' }}>{m.when.toUpperCase()} &middot; {m.where.toUpperCase()}</div>
          </div>
        </div>
      </div>
    );
  }

  const isMe = m.from === 'me';
  return (
    <div className="slide-up-msg" style={{
      alignSelf: isMe ? 'flex-end' : 'flex-start',
      maxWidth: '78%', display: 'flex', gap: 8,
      flexDirection: isMe ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
    }}>
      {!isMe && (
        <div style={{ visibility: isLastFromSender ? 'visible' : 'hidden' }}>
          <Avatar photo={trainer.photo} initials={trainer.initials} size={28} color={trainer.color}/>
        </div>
      )}
      <div>
        <div style={{
          background: isMe ? '#C5FF3D' : '#18181C',
          color: isMe ? '#000' : 'var(--km-chalk)',
          border: isMe ? 'none' : '1px solid #2A2A30',
          borderRadius: 18,
          borderBottomRightRadius: isMe && isLastFromSender ? 4 : 18,
          borderBottomLeftRadius: !isMe && isLastFromSender ? 4 : 18,
          padding: '9px 14px', fontSize: 14, lineHeight: 1.4, fontWeight: isMe ? 600 : 400,
        }} className="body">{m.text}</div>
        {isLastFromSender && (
          <div className="mono" style={{ fontSize: 9, color: '#5F636B', marginTop: 4, letterSpacing: '0.06em', textAlign: isMe ? 'right' : 'left' }}>{m.ts}</div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   VIDEO CALL VIEW
   ============================================================ */
function VideoCallView({ trainer, athlete, onClose }) {
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="slide-up" style={{
      position: 'absolute', inset: 0, zIndex: 250,
      display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#000',
    }}>
      <CoverPhoto src={trainer.cover} height="100%" color={trainer.color} blur={20}
        overlay={`linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 35%, rgba(0,0,0,0.4) 65%, rgba(0,0,0,0.85) 100%)`}/>

      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', opacity: 0.4 }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 80,
          background: 'linear-gradient(180deg, transparent 0%, rgba(201,111,74,0.07) 50%, transparent 100%)',
          animation: 'scan 6s linear infinite',
        }}/>
      </div>

      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', zIndex: 5, pointerEvents: 'none',
      }}>
        <div className="pulse-ring" style={{ borderRadius: '50%' }}>
          <Avatar photo={trainer.photo} initials={trainer.initials} size={160} color={trainer.color}/>
        </div>
        <div className="display" style={{ fontSize: 30, marginTop: 22, textTransform: 'uppercase', color: '#fff' }}>{trainer.name}</div>
        <div className="mono" style={{ fontSize: 11, color: '#C5FF3D', marginTop: 8, letterSpacing: '0.2em', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#C5FF3D' }} className="pulse-dot"/>
          LIVE COACHING SESSION
        </div>
      </div>

      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        padding: '20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
      }}>
        <button onClick={onClose} className="mono" style={{
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer',
          padding: '6px 12px', borderRadius: 999, fontSize: 11, letterSpacing: '0.1em',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <ChevronLeft size={14}/> HIDE
        </button>
        <div style={{
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: 999,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF4444' }} className="pulse-dot"/>
          <span className="mono" style={{ fontSize: 12, color: '#fff', fontWeight: 700, letterSpacing: '0.08em' }}>{fmt(duration)}</span>
        </div>
        <button style={{
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer',
          width: 32, height: 32, borderRadius: '50%', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <MoreHorizontal size={16}/>
        </button>
      </div>

      <div style={{
        position: 'absolute', top: 80, right: 16, zIndex: 10,
        width: 90, height: 130, borderRadius: 14, overflow: 'hidden',
        border: '2px solid rgba(255,255,255,0.1)', background: '#18181C',
        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
      }}>
        {!videoOff ? (
          athlete.photo ? (
            <img src={athlete.photo} alt="" referrerPolicy="no-referrer"
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.9)' }}/>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #C5FF3D30 0%, #1A1A20 100%)' }}>
              <span className="display" style={{ fontSize: 36, color: '#C5FF3D' }}>{athlete.initials}</span>
            </div>
          )
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1A1A20' }}>
            <VideoOff size={20} color="#5F636B"/>
          </div>
        )}
        <div style={{
          position: 'absolute', bottom: 4, left: 4,
          background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4,
        }}>
          <span className="mono" style={{ fontSize: 8, color: '#fff', letterSpacing: '0.1em', fontWeight: 700 }}>YOU</span>
        </div>
      </div>

      {/* Real PR notifications fire from the trainer's session input. No fake demo metric. */}

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
        padding: '20px 16px 32px',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18,
      }}>
        <CallButton onClick={() => setMuted(!muted)} active={muted}>
          {muted ? <MicOff size={22}/> : <Mic size={22}/>}
        </CallButton>
        <CallButton onClick={() => setVideoOff(!videoOff)} active={videoOff}>
          {videoOff ? <VideoOff size={22}/> : <Video size={22}/>}
        </CallButton>
        <button onClick={onClose} className="pulse-ring-red" style={{
          width: 64, height: 64, borderRadius: '50%',
          background: '#FF4444', border: 'none', color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(255,68,68,0.4)',
        }}>
          <PhoneOff size={26}/>
        </button>
        <CallButton><Camera size={22}/></CallButton>
        <CallButton><MessageCircle size={22}/></CallButton>
      </div>
    </div>
  );
}

function CallButton({ children, onClick, active }) {
  return (
    <button onClick={onClick} style={{
      width: 52, height: 52, borderRadius: '50%',
      background: active ? '#fff' : 'rgba(255,255,255,0.15)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.1)',
      color: active ? '#000' : '#fff',
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.15s',
    }}>{children}</button>
  );
}

/* ============================================================
   SESSIONS VIEW
   ============================================================ */
function sessionDayLabel(iso) {
  const d = new Date(iso);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (isSameDay(d, now)) return 'Today';
  if (isSameDay(d, tomorrow)) return 'Tomorrow';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
function sessionTimeLabel(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
const DECLINE_LABELS = {
  slot_taken: 'That time was already taken',
  time_doesnt_work: "The time doesn't work for the coach",
  try_another: 'The coach asked you to try another time',
};

function SessionsView({ athlete, onGoToTrainers }) {
  const [requests, setRequests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = () => {
    if (!athlete?.code) { setLoaded(true); return; }
    Promise.all([
      bookingApi.fetchRequests(athlete.code),
      bookingApi.fetchSessions(athlete.code),
    ]).then(([rs, ss]) => {
      setRequests(rs.filter(r => r.athleteCode === athlete.code));
      setSessions(ss.filter(s => s.athleteCode === athlete.code));
      setLoaded(true);
    });
  };
  useEffect(refresh, [athlete?.code]);

  const now = Date.now();
  const endOf = (x) => new Date(x.startIso).getTime() + (x.durationMin || 60) * 60000;
  const pending = requests.filter(r => r.status === 'pending')
    .sort((a, b) => a.startIso.localeCompare(b.startIso));
  const answered = requests.filter(r => r.status === 'declined' || r.status === 'cancelled_by_coach')
    .sort((a, b) => b.startIso.localeCompare(a.startIso)).slice(0, 5);
  const upcoming = sessions.filter(s => s.status === 'scheduled' && endOf(s) > now)
    .sort((a, b) => a.startIso.localeCompare(b.startIso));
  const past = sessions.filter(s => s.status !== 'scheduled' || endOf(s) <= now)
    .sort((a, b) => b.startIso.localeCompare(a.startIso));

  const cancel = async (r) => {
    await bookingApi.cancelRequest(athlete.code, r.id);
    refresh();
  };

  const empty = loaded && pending.length === 0 && answered.length === 0 && upcoming.length === 0 && past.length === 0;

  if (empty) {
    return (
      <div className="view view--sessions" style={{ padding: '12px 0 24px' }}>
        <div style={{ padding: '0 16px 12px' }}>
          <div className="display view-title">YOUR <span style={{ color: '#C5FF3D' }}>SESSIONS</span></div>
          <div className="mono" style={{ fontSize: 11, color: '#9CA0A8', letterSpacing: '0.08em' }}>NO SESSIONS YET</div>
        </div>
        <div style={{ padding: '40px 16px 0', textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(197,255,61,0.1) 0%, rgba(197,255,61,0.02) 100%)',
            border: '1px solid rgba(201,111,74,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <CalIcon size={36} color="#C5FF3D"/>
          </div>
          <div className="display" style={{ fontSize: 28, lineHeight: 1, marginBottom: 10, textTransform: 'uppercase' }}>BOOK YOUR FIRST</div>
          <div className="body" style={{ fontSize: 13, color: '#9CA0A8', marginBottom: 24, lineHeight: 1.5, maxWidth: 280, margin: '0 auto 24px' }}>
            Find a trainer, pick a mode (in person, live online, or async), and book a session.
          </div>
          <button onClick={onGoToTrainers} style={{
            background: '#C5FF3D', color: '#000', border: 'none',
            padding: '14px 24px', borderRadius: 999, fontWeight: 700, fontSize: 14, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }} className="body">Find a trainer <ArrowRight size={14}/></button>
        </div>
      </div>
    );
  }

  return (
    <div className="view view--sessions" style={{ padding: '12px 0 24px' }}>
      <div style={{ padding: '0 16px 12px' }}>
        <div className="display view-title">YOUR <span style={{ color: '#C5FF3D' }}>SESSIONS</span></div>
        <div className="mono" style={{ fontSize: 11, color: '#9CA0A8', letterSpacing: '0.08em' }}>
          {pending.length} REQUESTED &middot; {upcoming.length} UPCOMING
        </div>
      </div>

      {(pending.length > 0 || answered.length > 0) && (
        <>
          <div style={{ padding: '12px 16px 8px' }}>
            <SectionLabel>REQUESTED</SectionLabel>
          </div>
          <div style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pending.map(r => (
              <BookingRow key={r.id} accent="#FFB347" name={`Coach ${r.coachName || '?'}`}
                line1={`${sessionDayLabel(r.startIso)} · ${sessionTimeLabel(r.startIso)}`}
                line2={`${(MODE_META[r.mode]?.label || r.mode).toUpperCase()}${r.locationNote ? ` · ${r.locationNote.toUpperCase()}` : ''}`}
                status={`Waiting for ${r.coachName ? `Coach ${r.coachName.split(' ')[0]}` : 'the coach'} to confirm`}
                action={{ label: 'Cancel request', onClick: () => cancel(r) }}
              />
            ))}
            {answered.map(r => (
              <BookingRow key={r.id} accent="#5F636B" dim name={`Coach ${r.coachName || '?'}`}
                line1={`${sessionDayLabel(r.startIso)} · ${sessionTimeLabel(r.startIso)}`}
                line2={r.status === 'cancelled_by_coach' ? 'CANCELLED BY COACH' : 'DECLINED'}
                status={DECLINE_LABELS[r.declineReason] || r.declineReason || (r.status === 'cancelled_by_coach' ? 'The coach had to cancel. You can request another time.' : 'This time did not work. You can request another.')}
              />
            ))}
          </div>
        </>
      )}

      {upcoming.length > 0 && (
        <>
          <div style={{ padding: '12px 16px 8px' }}>
            <SectionLabel>UPCOMING</SectionLabel>
          </div>
          <div style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcoming.map(s => (
              <BookingRow key={s.id} accent="#C5FF3D" name={`Coach ${s.coachName || '?'}`}
                line1={`${sessionDayLabel(s.startIso)} · ${sessionTimeLabel(s.startIso)}`}
                line2={`${(MODE_META[s.mode]?.label || s.mode).toUpperCase()}${s.locationNote ? ` · ${s.locationNote.toUpperCase()}` : ''}`}
                status="Confirmed. Tell your parent or guardian the plan."
                ics={!String(s.id).startsWith('loc-') && athlete?.code
                  ? `/api/sessions/ics?sessionId=${encodeURIComponent(s.id)}&code=${encodeURIComponent(athlete.code)}`
                  : null}
              />
            ))}
          </div>
        </>
      )}

      {past.length > 0 && (
        <>
          <div style={{ padding: '12px 16px 8px' }}>
            <SectionLabel>PAST</SectionLabel>
          </div>
          <div style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {past.map(s => (
              <BookingRow key={s.id} accent="#2A2A30" dim name={`Coach ${s.coachName || '?'}`}
                line1={`${sessionDayLabel(s.startIso)} · ${sessionTimeLabel(s.startIso)}`}
                line2={(s.status === 'cancelled' ? 'CANCELLED' : s.status === 'no_show' ? 'MISSED' : 'COMPLETED')}
                status={s.status === 'cancelled' ? (s.cancelReason ? `Coach's note: ${s.cancelReason}` : 'This session was cancelled.') : null}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BookingRow({ accent, dim, name, line1, line2, status, action, ics }) {
  return (
    <div style={{
      background: 'linear-gradient(160deg, #1A1A20 0%, var(--km-card) 100%)',
      border: '1px solid #2A2A30', borderRadius: 14, padding: 12,
      position: 'relative', overflow: 'hidden', opacity: dim ? 0.75 : 1,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: accent }}/>
      <div style={{ paddingLeft: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <div className="display" style={{ fontSize: 18, lineHeight: 1, textTransform: 'uppercase' }}>{name}</div>
          <div className="display" style={{ fontSize: 15, lineHeight: 1, color: accent === '#2A2A30' ? '#9CA0A8' : accent }}>{line1}</div>
        </div>
        <div className="mono" style={{ fontSize: 9.5, color: '#9CA0A8', marginTop: 5, letterSpacing: '0.06em' }}>{line2}</div>
        {status && (
          <div className="body" style={{ fontSize: 12, color: '#9CA0A8', marginTop: 6, lineHeight: 1.45 }}>{status}</div>
        )}
        {(action || ics) && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {ics && (
              <a href={ics} download className="body" style={{
                background: '#18181C', border: '1px solid #2A2A30', borderRadius: 999,
                padding: '7px 14px', color: 'var(--km-chalk)', fontSize: 11.5, fontWeight: 600, textDecoration: 'none',
              }}>
                Add to calendar
              </a>
            )}
            {action && (
              <button onClick={action.onClick} className="body" style={{
                background: 'transparent', border: '1px solid #3A3A42', borderRadius: 999,
                padding: '7px 14px', color: '#9CA0A8', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
              }}>
                {action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   COMMUNITY FEED (athlete to athlete)
   ============================================================ */
function CommunityView({ athlete }) {
  const [posts, setPosts] = useState([]);
  const [draft, setDraft] = useState('');
  const MAX_LEN = 280;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('coachme_posts') || '[]');
      setPosts(Array.isArray(saved) ? saved : []);
    } catch {
      setPosts([]);
    }
    // Server feed: merged into the same local key; null when offline or
    // the cloud is disabled, in which case the local feed stands.
    let live = true;
    sync.fetchPosts(athlete?.code).then(merged => {
      if (live && merged) setPosts(merged);
    });
    return () => { live = false; };
  }, []);

  const save = (next) => {
    setPosts(next);
    try { localStorage.setItem('coachme_posts', JSON.stringify(next)); } catch {}
  };

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    const post = {
      id: Date.now(),
      // The feed is shared by every athlete on the device; authorId is
      // what scopes delete-own and the First Post achievement.
      authorId: athlete.id,
      author: {
        name: athlete.name,
        initials: athlete.initials,
        sport: athlete.sport,
        position: athlete.position,
        city: athlete.city,
        photo: athlete.photo,
      },
      text,
      ts: Date.now(),
      likes: 0,
      liked: false,
    };
    save([post, ...posts]);
    setDraft('');
    // Push to the server feed (queued for retry when offline).
    if (athlete.code) sync.createPost({ authorCode: athlete.code, localId: post.id, body: text });
  };

  const toggleLike = (id) => {
    save(posts.map(p => p.id === id ? {
      ...p, liked: !p.liked, likes: p.liked ? Math.max(0, p.likes - 1) : p.likes + 1,
    } : p));
    if (athlete?.code) sync.toggleLike(id, athlete.code);
  };

  const remove = (id) => {
    save(posts.filter(p => p.id !== id));
    if (athlete?.code) sync.deletePost(id, athlete.code);
  };

  return (
    <div className="view view--feed" style={{ padding: '12px 0 24px' }}>
      <div style={{ padding: '0 16px 12px' }}>
        <div className="display view-title">THE <span style={{ color: '#C5FF3D' }}>FEED</span></div>
        <div className="mono" style={{ fontSize: 11, color: '#9CA0A8', letterSpacing: '0.08em' }}>
          ATHLETES &middot; TRAINING UPDATES &middot; PRS
        </div>
      </div>

      {/* Composer */}
      <div style={{ padding: '8px 16px 16px' }}>
        <div style={{
          background: 'linear-gradient(160deg, #1A1A20 0%, var(--km-card) 100%)',
          border: '1px solid #2A2A30', borderRadius: 16, padding: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Avatar initials={athlete.initials} size={36} color="#C5FF3D" square/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="display" style={{ fontSize: 16, lineHeight: 1, textTransform: 'uppercase' }}>{athlete.name}</div>
              <div className="mono" style={{ fontSize: 9.5, color: '#9CA0A8', marginTop: 4, letterSpacing: '0.06em' }}>
                {athlete.sport.toUpperCase()} &middot; {athlete.position.toUpperCase()}
              </div>
            </div>
          </div>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value.slice(0, MAX_LEN))}
            placeholder="Just had practice? Hit a PR? Ask the community a question."
            className="body"
            rows={3}
            style={{
              width: '100%', background: 'transparent', border: 'none',
              color: 'var(--km-chalk)', fontSize: 14, outline: 'none', resize: 'none',
              fontFamily: 'inherit', lineHeight: 1.5, padding: 0,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <span className="mono" style={{
              fontSize: 10, color: draft.length > MAX_LEN - 20 ? '#FF6B3D' : '#5F636B',
              letterSpacing: '0.08em',
            }}>
              {draft.length}/{MAX_LEN}
            </span>
            <button onClick={submit} disabled={!draft.trim()} style={{
              background: draft.trim() ? '#C5FF3D' : '#1A1A20',
              color: draft.trim() ? '#000' : '#5F636B',
              border: 'none', padding: '8px 18px', borderRadius: 999,
              fontWeight: 700, fontSize: 13, cursor: draft.trim() ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
            }} className="body">
              Post <Send size={13}/>
            </button>
          </div>
        </div>
      </div>

      {/* Feed */}
      {posts.length === 0 ? (
        <div style={{ padding: '20px 16px 0', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18,
            background: 'linear-gradient(135deg, rgba(197,255,61,0.1) 0%, rgba(197,255,61,0.02) 100%)',
            border: '1px solid rgba(201,111,74,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <Users size={32} color="#C5FF3D"/>
          </div>
          <div className="display" style={{ fontSize: 24, lineHeight: 1, marginBottom: 8, textTransform: 'uppercase' }}>NO POSTS YET</div>
          <div className="body" style={{ fontSize: 13, color: '#9CA0A8', lineHeight: 1.5, maxWidth: 280, margin: '0 auto' }}>
            Be the first to share. Drop a training update, ask a drill question, or hype your next PR.
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {posts.map(p => <PostCard key={p.id} post={p} currentId={athlete.id} onLike={() => toggleLike(p.id)} onDelete={() => remove(p.id)}/>)}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, currentId, onLike, onDelete }) {
  // Delete only shows on posts this athlete authored. Matching by id, not
  // name: names collide across profiles, and legacy posts with no
  // authorId belong to nobody.
  const mine = post.authorId != null && post.authorId === currentId;
  const ago = timeAgo(post.ts);
  return (
    <div style={{
      background: 'linear-gradient(160deg, #1A1A20 0%, var(--km-card) 100%)',
      border: '1px solid #2A2A30', borderRadius: 14, padding: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <Avatar initials={post.author?.initials || '?'} photo={post.author?.photo} size={40} color="#C5FF3D" square/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="display" style={{ fontSize: 16, lineHeight: 1, textTransform: 'uppercase' }}>{post.author?.name}</div>
          <div className="mono" style={{ fontSize: 9.5, color: '#9CA0A8', marginTop: 4, letterSpacing: '0.06em' }}>
            {post.author?.sport?.toUpperCase()}
            {post.author?.position && ` · ${post.author.position.toUpperCase()}`}
            {ago && ` · ${ago.toUpperCase()}`}
          </div>
        </div>
        {mine && (
          <button onClick={onDelete} title="Delete post" className="tap" style={{ color: '#5F636B' }}>
            <X size={14}/>
          </button>
        )}
      </div>
      <div className="body" style={{ fontSize: 14, color: 'var(--km-chalk)', lineHeight: 1.5, whiteSpace: 'pre-wrap', marginBottom: 12 }}>
        {post.text}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 10, borderTop: '1px solid #1F1F25' }}>
        <button onClick={onLike} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', gap: 6,
          color: post.liked ? '#FF6B3D' : '#9CA0A8',
        }}>
          <Heart size={15} fill={post.liked ? '#FF6B3D' : 'none'}/>
          <span className="mono" style={{ fontSize: 11, fontWeight: 700 }}>{post.likes || 0}</span>
        </button>
      </div>
    </div>
  );
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

/* ============================================================
   APP NAV
   Bottom tab bar on phone/tablet, left sidebar on desktop.
   Layout lives in the .app-nav* CSS classes, not inline, so the
   breakpoints can restyle it.
   ============================================================ */
function AppNav({ tab, switchTab, unread, onSignOut }) {
  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'trainers', label: 'Trainers', icon: Search },
    { id: 'community', label: 'Feed', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageCircle, badge: unread },
    { id: 'sessions', label: 'Sessions', icon: CalIcon },
  ];
  return (
    <div className="app-nav">
      <div className="app-nav-brand">
        {/* Fixed size: zero layout shift. Sidebar bg is near the logo's
            own black, so the image reads as a plain lockup. */}
        <img src="/brand/lockup.png" alt="KoachMe" width={132} height={44} style={{ display: 'block' }}/>
      </div>
      <div className="app-nav-tabs">
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => switchTab(t.id)} className={`app-nav-btn mono ${active ? 'is-active' : ''}`}>
              <div style={{ position: 'relative', display: 'flex' }}>
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8}/>
                {t.badge > 0 && (
                  <span className="mono" style={{
                    position: 'absolute', top: -6, right: -8,
                    background: '#C5FF3D', color: '#000', fontSize: 9,
                    minWidth: 16, height: 16, borderRadius: 8, padding: '0 4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, border: '2px solid #0A0A0B',
                  }}>{t.badge}</span>
                )}
              </div>
              <span>{t.label}</span>
              {active && <span className="app-nav-ind"/>}
            </button>
          );
        })}
      </div>
      {onSignOut && (
        <button className="app-nav-signout mono" onClick={() => {
          if (typeof window !== 'undefined' && window.confirm('Sign out? Your profile stays saved on this device. Use Log in on the welcome screen to come back.')) {
            onSignOut();
          }
        }}>
          <X size={16}/> Sign out
        </button>
      )}
    </div>
  );
}

/* ============================================================
   TRAINER DETAIL OVERLAY
   ============================================================ */
function TrainerDetail({ trainer, onClose, onBook, onMessage, onCall }) {
  const [selectedMode, setSelectedMode] = useState(trainer.modes[0]);

  return (
    <div className="modal-backdrop" style={{ zIndex: 100 }} onClick={onClose}>
    <div className="modal-panel slide-up" onClick={e => e.stopPropagation()}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: '1px solid #1F1F25', flexShrink: 0,
        background: 'rgba(10,10,11,0.9)', backdropFilter: 'blur(12px)', position: 'relative', zIndex: 10,
      }}>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: 'var(--km-chalk)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
        }} className="mono">
          <ChevronLeft size={18}/> <span style={{ fontSize: 12, letterSpacing: '0.1em' }}>BACK</span>
        </button>
        <span className="mono" style={{ fontSize: 10, color: '#5F636B', letterSpacing: '0.18em' }}>TRAINER</span>
        <span style={{ width: 60 }}/>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }} className="phone-scroll">
        <div style={{ position: 'relative' }}>
          <CoverPhoto src={trainer.cover} height={200} color={trainer.color}
            overlay={`linear-gradient(180deg, rgba(10,10,11,0.15) 0%, rgba(10,10,11,0.95) 100%)`}>
            <div style={{ padding: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <span className="mono" style={{
                fontSize: 10, padding: '5px 10px', borderRadius: 4,
                background: trainer.color, color: '#000', fontWeight: 700, letterSpacing: '0.15em',
              }}>{trainer.badge}</span>
            </div>
          </CoverPhoto>

          <div style={{ padding: '0 20px', marginTop: -55, position: 'relative', zIndex: 3 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
              <Avatar photo={trainer.photo} initials={trainer.initials} size={96} square color={trainer.color} ring/>
              <div style={{ flex: 1, paddingBottom: 8 }}>
                <div className="display" style={{ fontSize: 30, lineHeight: 1, textTransform: 'uppercase', color: 'var(--km-chalk)', textShadow: '0 1px 14px rgba(0,0,0,0.85)' }}>{trainer.name}</div>
                <div className="mono" style={{ fontSize: 11, color: '#9CA0A8', marginTop: 6, letterSpacing: '0.05em' }}>
                  {trainer.title.toUpperCase()} &middot; {trainer.years}YR
                </div>
              </div>
            </div>

            <div className="body" style={{ fontSize: 13, color: '#D4D6DA', lineHeight: 1.55, marginTop: 18 }}>
              {trainer.bio}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              <Chip icon={<MapPin size={10}/>}>{trainer.location.toUpperCase()}</Chip>
              {trainer.rating ? (
                <Chip icon={<Star size={10} fill="#C5FF3D" color="#C5FF3D"/>}>{trainer.rating} &middot; {trainer.reviews} REVIEWS</Chip>
              ) : (
                <Chip>NEW COACH</Chip>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: '24px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={() => onMessage(trainer.id)} style={{
            background: '#18181C', border: '1px solid #2A2A30', borderRadius: 14,
            padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            color: 'var(--km-chalk)', cursor: 'pointer', fontWeight: 600, fontSize: 13,
          }} className="body">
            <MessageCircle size={16} color="#C5FF3D"/> Message
          </button>
          <button onClick={() => onCall(trainer.id)} style={{
            background: '#18181C', border: '1px solid #2A2A30', borderRadius: 14,
            padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            color: 'var(--km-chalk)', cursor: 'pointer', fontWeight: 600, fontSize: 13,
          }} className="body">
            <Video size={16} color="#5DA9FF"/> Video Call
          </button>
        </div>

        <div style={{ padding: '24px 20px 0' }}>
          <SectionLabel>TRACK RECORD</SectionLabel>
          <div style={{
            marginTop: 12, padding: 18,
            background: 'linear-gradient(160deg, #1A1A20 0%, var(--km-card) 100%)',
            border: '1px solid #2A2A30', borderRadius: 14,
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, position: 'relative',
          }}>
            <BigStat num={trainer.athletes || 0} label="ATHLETES"/>
            <BigStat num={trainer.avgGain || '-'} label="AVG GAIN" small/>
            <BigStat num={trainer.commits || 0} label="D1 COMMITS"/>
          </div>
        </div>

        <div style={{ padding: '20px 20px 100px' }}>
          <SectionLabel>HOW THEY TRAIN</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            {trainer.modes.map(m => {
              const meta = MODE_META[m];
              const MIcon = meta.icon;
              const sel = selectedMode === m;
              return (
                <button key={m} onClick={() => setSelectedMode(m)} style={{
                  cursor: 'pointer', textAlign: 'left',
                  padding: 14, borderRadius: 12,
                  background: sel ? 'rgba(201,111,74,0.07)' : 'linear-gradient(160deg, #1A1A20 0%, var(--km-card) 100%)',
                  border: sel ? '1px solid #C5FF3D' : '1px solid #2A2A30',
                  display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: sel ? 'rgba(197,255,61,0.15)' : 'rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <MIcon size={17} color={sel ? '#C5FF3D' : '#9CA0A8'}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="display" style={{ fontSize: 18, lineHeight: 1, textTransform: 'uppercase', color: sel ? '#C5FF3D' : 'var(--km-chalk)' }}>
                      {meta.label}
                    </div>
                    <div className="mono" style={{ fontSize: 10, color: '#5F636B', marginTop: 4, letterSpacing: '0.06em' }}>
                      {m === 'in_person' && 'TRAIN AT THEIR FACILITY OR YOURS'}
                      {m === 'live_online' && 'JOIN A LIVE VIDEO SESSION'}
                      {m === 'async' && 'SEND TAPE, GET A BREAKDOWN'}
                    </div>
                  </div>
                  {sel && <CheckCircle2 size={18} color="#C5FF3D"/>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{
        padding: 16, borderTop: '1px solid #1F1F25', background: 'rgba(10,10,11,0.95)',
        backdropFilter: 'blur(20px)', flexShrink: 0,
      }}>
        <button onClick={() => onBook(trainer, selectedMode)} style={{
          width: '100%', background: '#C5FF3D', color: '#000', border: 'none',
          padding: '16px 20px', borderRadius: 999, fontWeight: 700, fontSize: 15, cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }} className="body">
          <span>Book a {MODE_META[selectedMode].label.toLowerCase()} session</span>
          <span className="display" style={{ fontSize: 18 }}>${trainer.rate}/HR</span>
        </button>
      </div>
    </div>
    </div>
  );
}

function Chip({ children, icon }) {
  return (
    <span className="mono" style={{
      fontSize: 10, padding: '6px 10px', borderRadius: 999,
      background: 'rgba(255,255,255,0.04)', border: '1px solid #2A2A30',
      color: '#9CA0A8', letterSpacing: '0.08em', fontWeight: 700,
      display: 'inline-flex', alignItems: 'center', gap: 6,
    }}>{icon}{children}</span>
  );
}

function BigStat({ num, label, small }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="display" style={{ fontSize: small ? 22 : 30, lineHeight: 1, color: '#C5FF3D' }}>{num}</div>
      <div className="mono" style={{ fontSize: 9, color: '#5F636B', letterSpacing: '0.12em', marginTop: 6, textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

/* ============================================================
   LOG WORKOUT MODAL
   ============================================================ */
function LogWorkoutModal({ onClose, onSave }) {
  const [type, setType] = useState('practice');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState(3);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const save = () => {
    const mins = parseInt(duration);
    if (!mins || mins < 1) {
      setError('Enter how long the workout was (in minutes).');
      return;
    }
    if (mins > 600) {
      setError('That seems too long. Try a value under 600 minutes.');
      return;
    }
    onSave({
      date: new Date().toISOString(),
      type,
      duration: mins,
      intensity,
      notes: notes.trim(),
    });
  };

  return (
    <div className="sheet-backdrop" style={{ zIndex: 200 }} onClick={onClose}>
      <div className="slide-up phone-scroll sheet-panel" onClick={e => e.stopPropagation()} style={{
        padding: 24, maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div className="sheet-handle"/>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 4 }}>
          <div className="display" style={{ fontSize: 26, lineHeight: 1, textTransform: 'uppercase' }}>
            LOG <span style={{ color: '#C5FF3D' }}>WORKOUT</span>
          </div>
          <button onClick={onClose} className="tap" style={{ color: '#5F636B' }}>
            <X size={20}/>
          </button>
        </div>

        <div className="body" style={{ fontSize: 13, color: '#9CA0A8', marginBottom: 20, lineHeight: 1.5 }}>
          Log today's training. Builds your streak and unlocks achievements.
        </div>

        <div className="mono" style={{ fontSize: 10.5, color: '#9CA0A8', letterSpacing: '0.12em', marginBottom: 8, textTransform: 'uppercase' }}>
          TYPE
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
          {WORKOUT_TYPES.map(t => (
            <button key={t.key} onClick={() => setType(t.key)} className="body" style={{
              padding: '8px 12px', borderRadius: 999,
              background: type === t.key ? `${t.color}18` : '#18181C',
              border: type === t.key ? `1px solid ${t.color}` : '1px solid #2A2A30',
              color: type === t.key ? t.color : '#D4D6DA',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="mono" style={{ fontSize: 10.5, color: '#9CA0A8', letterSpacing: '0.12em', marginBottom: 8, textTransform: 'uppercase' }}>
          DURATION (MINUTES)
        </div>
        <input
          type="number" inputMode="numeric" value={duration}
          onChange={e => { setDuration(e.target.value); setError(''); }}
          placeholder="60"
          className="body"
          style={{
            width: '100%', background: '#18181C', border: '1px solid #2A2A30',
            borderRadius: 12, padding: '14px 16px', color: 'var(--km-chalk)',
            fontSize: 15, outline: 'none', marginBottom: 18,
          }}
          onFocus={e => e.currentTarget.style.borderColor = '#C5FF3D'}
          onBlur={e => e.currentTarget.style.borderColor = '#2A2A30'}
        />

        <div className="mono" style={{ fontSize: 10.5, color: '#9CA0A8', letterSpacing: '0.12em', marginBottom: 8, textTransform: 'uppercase' }}>
          INTENSITY
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
          {INTENSITY_LABELS.map((label, i) => {
            const lvl = i + 1;
            const active = intensity === lvl;
            return (
              <button key={lvl} onClick={() => setIntensity(lvl)} className="body" style={{
                flex: 1, padding: '10px 6px', borderRadius: 10,
                background: active ? 'rgba(197,255,61,0.12)' : '#18181C',
                border: active ? '1px solid #C5FF3D' : '1px solid #2A2A30',
                color: active ? '#C5FF3D' : '#D4D6DA',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', textAlign: 'center',
              }}>
                <div className="display" style={{ fontSize: 16, lineHeight: 1 }}>{lvl}</div>
                <div style={{ fontSize: 9, marginTop: 3, letterSpacing: '0.05em' }}>{label.toUpperCase()}</div>
              </button>
            );
          })}
        </div>

        <div className="mono" style={{ fontSize: 10.5, color: '#9CA0A8', letterSpacing: '0.12em', marginBottom: 8, textTransform: 'uppercase' }}>
          NOTES (OPTIONAL)
        </div>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Felt good. Worked on inside pitches."
          rows={3}
          className="body"
          style={{
            width: '100%', background: '#18181C', border: '1px solid #2A2A30',
            borderRadius: 12, padding: '12px 14px', color: 'var(--km-chalk)',
            fontSize: 13, outline: 'none', marginBottom: 18,
            resize: 'vertical', minHeight: 70, fontFamily: 'inherit',
          }}
          onFocus={e => e.currentTarget.style.borderColor = '#C5FF3D'}
          onBlur={e => e.currentTarget.style.borderColor = '#2A2A30'}
        />

        {error && (
          <div style={{
            padding: '10px 12px', borderRadius: 10, marginBottom: 14,
            background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.4)',
            color: '#FF8888', fontSize: 12,
          }} className="body">
            {error}
          </div>
        )}

        <button onClick={save} className="body" style={{
          width: '100%', background: '#C5FF3D', color: '#000', border: 'none',
          padding: '15px 20px', borderRadius: 999,
          fontWeight: 700, fontSize: 14, cursor: 'pointer',
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
        }}>
          Save workout <ArrowRight size={15}/>
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   BOOKING FLOW
   ============================================================ */
function BookingFlow({ booking, athlete, onClose, onMessageCoach }) {
  const { trainer } = booking;
  const first = (trainer.name || 'this coach').split(' ')[0];
  // 'loading' | 'slots' | 'confirm' | 'done'
  const [phase, setPhase] = useState('loading');
  const [slotsInfo, setSlotsInfo] = useState(null);
  const [slot, setSlot] = useState(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let live = true;
    bookingApi.fetchSlots(trainer.code || '', athlete?.code).then(res => {
      if (!live) return;
      setSlotsInfo(res);
      setPhase('slots');
    });
    return () => { live = false; };
  }, [trainer?.code]);

  // Server verdict wins; the local fallback trusts the coach card.
  const unverified = slotsInfo && (
    slotsInfo.reason === 'unverified' || (slotsInfo.local && trainer.verified !== true)
  );
  const unavailable = slotsInfo && (slotsInfo.reason === 'banned' || slotsInfo.reason === 'blocked');
  const noTimes = slotsInfo && !unverified && !unavailable &&
    (slotsInfo.reason === 'no_windows' || slotsInfo.slots.length === 0);

  const submit = async () => {
    if (!slot || sending) return;
    const trimmed = note.trim();
    // Same safety policy as messages, checked here first so the kid gets
    // the answer instantly; the server enforces it again regardless.
    if (trimmed && checkHardBlock(trimmed)) {
      setError(BLOCK_MESSAGE);
      return;
    }
    setSending(true);
    setError('');
    const res = await bookingApi.createRequest({
      athleteCode: athlete?.code || '', athleteName: athlete?.name || '',
      coachCode: trainer.code || '', coachName: trainer.name || '',
      startIso: slot.startIso, durationMin: slot.durationMin, mode: slot.mode,
      locationNote: slot.locationNote, note: trimmed || null,
    });
    setSending(false);
    if (!res.ok) { setError(res.message); return; }
    setPhase('done');
  };

  // Group slots by browser-local day.
  const groups = [];
  if (slotsInfo) {
    for (const s of slotsInfo.slots) {
      const label = sessionDayLabel(s.startIso);
      const g = groups[groups.length - 1];
      if (g && g.label === label) g.slots.push(s);
      else groups.push({ label, slots: [s] });
    }
  }

  return (
    <div className="sheet-backdrop" style={{ zIndex: 200 }} onClick={onClose}>
      <div className="slide-up phone-scroll sheet-panel" onClick={e => e.stopPropagation()} style={{ padding: 24, maxHeight: '92%', overflowY: 'auto' }}>
        <div className="sheet-handle"/>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar photo={trainer.photo} initials={trainer.initials} size={38} square color={trainer.color}/>
            <div>
              <div className="display" style={{ fontSize: 20, lineHeight: 1, textTransform: 'uppercase' }}>
                {phase === 'done' ? 'REQUEST SENT' : `REQUEST A SESSION`}
              </div>
              <div className="mono" style={{ fontSize: 9.5, color: '#9CA0A8', marginTop: 4, letterSpacing: '0.06em' }}>
                {(trainer.name || '').toUpperCase()}{trainer.rate ? ` · $${trainer.rate}/HR` : ''}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="tap" style={{ color: '#5F636B' }}>
            <X size={18}/>
          </button>
        </div>

        {phase === 'loading' && (
          <div className="body" style={{ padding: 30, textAlign: 'center', color: '#9CA0A8', fontSize: 13 }}>
            Checking {first}&apos;s times...
          </div>
        )}

        {phase === 'slots' && unverified && (
          <div style={{ padding: 20, borderRadius: 12, background: '#18181C', border: '1px dashed #2A2A30', textAlign: 'center' }}>
            <div className="display" style={{ fontSize: 18, marginBottom: 6, textTransform: 'uppercase' }}>
              Almost ready to book
            </div>
            <div className="body" style={{ fontSize: 12.5, color: '#9CA0A8', lineHeight: 1.55, marginBottom: 14 }}>
              Coach {first} can take session requests after KoachMe verifies them.
              That check protects you. You can message them in the meantime.
            </div>
            <button onClick={() => onMessageCoach(trainer.id)} className="body" style={{
              background: '#C5FF3D', color: '#000', border: 'none',
              padding: '11px 18px', borderRadius: 999, fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}>
              Message {first}
            </button>
          </div>
        )}

        {phase === 'slots' && unavailable && (
          <div style={{ padding: 20, borderRadius: 12, background: '#18181C', border: '1px dashed #2A2A30', textAlign: 'center' }}>
            <div className="body" style={{ fontSize: 13, color: '#9CA0A8', lineHeight: 1.55 }}>
              This coach isn&apos;t taking requests right now.
            </div>
          </div>
        )}

        {phase === 'slots' && noTimes && (
          <div style={{ padding: 20, borderRadius: 12, background: '#18181C', border: '1px dashed #2A2A30', textAlign: 'center' }}>
            <div className="display" style={{ fontSize: 18, marginBottom: 6, textTransform: 'uppercase' }}>
              No times posted yet
            </div>
            <div className="body" style={{ fontSize: 12.5, color: '#9CA0A8', lineHeight: 1.55, marginBottom: 14 }}>
              Coach {first} has not posted training times yet. Message them to ask what works.
            </div>
            <button onClick={() => onMessageCoach(trainer.id)} className="body" style={{
              background: '#C5FF3D', color: '#000', border: 'none',
              padding: '11px 18px', borderRadius: 999, fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}>
              Message {first}
            </button>
          </div>
        )}

        {phase === 'slots' && slotsInfo && !unverified && !unavailable && !noTimes && (
          <>
            <div className="body" style={{ fontSize: 12.5, color: '#9CA0A8', lineHeight: 1.5, marginBottom: 14 }}>
              Pick a time that works for your family. {first} confirms every request.
            </div>
            {groups.map(g => (
              <div key={g.label} style={{ marginBottom: 14 }}>
                <div className="mono" style={{ fontSize: 10, color: '#5F636B', letterSpacing: '0.14em', marginBottom: 8 }}>
                  {g.label.toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {g.slots.map(s => {
                    const meta = MODE_META[s.mode];
                    return (
                      <button key={s.startIso + s.mode} onClick={() => { setSlot(s); setPhase('confirm'); setError(''); }} className="body" style={{
                        cursor: 'pointer', padding: '10px 14px', borderRadius: 12,
                        background: 'linear-gradient(160deg, #1A1A20 0%, var(--km-card) 100%)',
                        border: '1px solid #2A2A30', color: 'var(--km-chalk)', textAlign: 'left',
                      }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{sessionTimeLabel(s.startIso)}</div>
                        <div className="mono" style={{ fontSize: 8.5, color: meta?.color || '#9CA0A8', letterSpacing: '0.08em', marginTop: 3 }}>
                          {(meta?.label || s.mode).toUpperCase()}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}

        {phase === 'confirm' && slot && (
          <>
            <div style={{
              padding: 16, borderRadius: 14, marginBottom: 14,
              background: 'linear-gradient(160deg, #1A1A20 0%, var(--km-card) 100%)', border: '1px solid #2A2A30',
            }}>
              <Row k="COACH" v={trainer.name}/>
              <Row k="WHEN" v={`${sessionDayLabel(slot.startIso)} · ${sessionTimeLabel(slot.startIso)}`}/>
              <Row k="MODE" v={MODE_META[slot.mode]?.label || slot.mode}/>
              {slot.locationNote && <Row k="WHERE" v={slot.locationNote}/>}
              <Row k="RATE" v={trainer.rate ? `$${trainer.rate}/hr, paid to the coach directly. Requesting is free.` : 'Free to request'} last/>
            </div>

            {/* Kid-safety framing: reviewed copy, keep visible. */}
            <div style={{
              padding: '12px 14px', borderRadius: 12, marginBottom: 14,
              background: 'rgba(201,111,74,0.07)', border: '1px solid rgba(197,255,61,0.35)',
            }}>
              <div className="mono" style={{ fontSize: 9, color: '#C5FF3D', letterSpacing: '0.14em', marginBottom: 6 }}>
                BEFORE YOU REQUEST
              </div>
              <div className="body" style={{ fontSize: 12.5, color: '#D4D6DA', lineHeight: 1.55 }}>
                Tell your parent or guardian about this session.
                {slot.mode === 'in_person' ? ' Sessions should happen in public training locations.' : ''}
              </div>
              <div className="mono" style={{ fontSize: 9, color: '#9CA0A8', letterSpacing: '0.08em', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle2 size={11} color="#C5FF3D"/> KOACHME VERIFIED COACH
              </div>
            </div>

            <textarea
              value={note}
              onChange={e => { setNote(e.target.value.slice(0, 280)); if (error) setError(''); }}
              placeholder={`Anything ${first} should know? (optional)`}
              rows={2}
              className="body"
              style={{
                width: '100%', background: '#18181C', border: '1px solid #2A2A30',
                borderRadius: 12, padding: '11px 13px', color: 'var(--km-chalk)',
                fontSize: 13, outline: 'none', resize: 'none', marginBottom: 12, fontFamily: 'inherit',
              }}
            />
            {error && (
              <div className="body" style={{
                padding: '9px 12px', borderRadius: 10, marginBottom: 12,
                background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.4)',
                color: '#FF8888', fontSize: 12, lineHeight: 1.45,
              }}>{error}</div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setPhase('slots'); setSlot(null); }} className="body" style={{
                flex: 1, background: 'transparent', color: 'var(--km-chalk)', border: '1px solid #3A3A42',
                padding: '14px', borderRadius: 999, fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}>Back</button>
              <button onClick={submit} disabled={sending} className="body" style={{
                flex: 2, background: sending ? '#1A1A20' : '#C5FF3D', color: sending ? '#5F636B' : '#000',
                border: 'none', padding: '14px 20px', borderRadius: 999, fontWeight: 700, fontSize: 14,
                cursor: sending ? 'wait' : 'pointer',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
              }}>
                {sending ? 'Sending...' : 'Send request'} {!sending && <ArrowRight size={15}/>}
              </button>
            </div>
          </>
        )}

        {phase === 'done' && (
          <div style={{ textAlign: 'center', padding: '10px 0 6px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: '#C5FF3D',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <CheckCircle2 size={32} color="#000"/>
            </div>
            <div className="display" style={{ fontSize: 26, textTransform: 'uppercase', marginBottom: 8 }}>
              Request sent
            </div>
            <div className="body" style={{ fontSize: 13, color: '#9CA0A8', lineHeight: 1.55, maxWidth: 300, margin: '0 auto 18px' }}>
              Waiting for Coach {first} to confirm. You can watch it in your Sessions tab, and cancel any time before they answer.
            </div>
            <button onClick={onClose} className="body" style={{
              background: '#C5FF3D', color: '#000', border: 'none',
              padding: '13px 22px', borderRadius: 999, fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ k, v, last }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 0', borderBottom: last ? 'none' : '1px solid #2A2A30',
    }}>
      <span className="mono" style={{ fontSize: 10, color: '#5F636B', letterSpacing: '0.15em' }}>{k}</span>
      <span className="body" style={{ fontSize: 14, fontWeight: 600 }}>{v}</span>
    </div>
  );
}

/* ============================================================
   CELEBRATION
   ============================================================ */
function Celebration() {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(12px)', zIndex: 300,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      {Array.from({ length: 18 }).map((_, i) => {
        const colors = ['#C5FF3D', '#FF6B3D', '#5DA9FF', '#FF9BCD', '#FFFFFF'];
        const c = colors[i % colors.length];
        const tx = (Math.random() - 0.5) * 500;
        const ty = (Math.random() - 0.5) * 500;
        const r = Math.random() * 720;
        const d = 0.5 + Math.random() * 0.4;
        return (
          <div key={i} style={{
            position: 'absolute', width: 8, height: 14, background: c,
            borderRadius: 2,
            '--tx': `${tx}px`, '--ty': `${ty}px`, '--r': `${r}deg`,
            animation: `confetti ${d}s ease-out forwards`,
            animationDelay: `${i * 0.02}s`,
          }}/>
        );
      })}

      <div className="fade-up" style={{ textAlign: 'center', maxWidth: 280 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', background: '#C5FF3D',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
        }} className="pulse-ring">
          <CheckCircle2 size={40} color="#000"/>
        </div>
        <div className="display" style={{ fontSize: 40, lineHeight: 1, marginBottom: 8 }}>BOOKED.</div>
        <div className="mono" style={{ fontSize: 12, color: '#9CA0A8', letterSpacing: '0.08em' }}>
          SESSION ADDED TO YOUR CALENDAR
        </div>
      </div>
    </div>
  );
}
