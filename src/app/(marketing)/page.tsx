"use client";
/* eslint-disable @next/next/no-img-element, react/no-unknown-property */
// @ts-nocheck
// This is a single-file UI prototype for the CoachMe app. Kept untyped on
// purpose so it lands intact. We'll refactor and add proper types in a
// follow-up phase.

import { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2, MapPin, Video, Send, Calendar as CalIcon, Star,
  TrendingUp, Search, User as UserIcon, MessageCircle,
  ChevronRight, ChevronLeft, X, ArrowRight,
  Plus, Mic, MicOff, VideoOff, PhoneOff, Camera,
  Send as SendIcon, MoreHorizontal, Inbox, UserPlus,
  Users, Heart, Dumbbell, Flame, Zap, Award, Trophy, Target, Clock
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

const VERIFY_META = {
  event: { label: 'EVENT', color: '#C5FF3D' },
  facility: { label: 'FACILITY', color: '#5DA9FF' },
  trainer: { label: 'TRAINER', color: '#FF9BCD' },
  self: { label: 'SELF', color: '#5F636B' },
};

const BASEBALL_STAT_DEFS = [
  { key: 'exitVelo', label: 'Exit Velo', unit: 'mph', placeholder: '85' },
  { key: 'sixtyYd', label: '60 Yd Dash', unit: 's', placeholder: '7.4' },
  { key: 'throwVelo', label: 'Throw Velo', unit: 'mph', placeholder: '75' },
  { key: 'popTime', label: 'Pop Time', unit: 's', placeholder: '2.20' },
];

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

// Achievements are checked against derived state — never fake-awarded.
const ACHIEVEMENTS = [
  { id: 'first_workout',  icon: Flame,    label: 'First Workout',     hint: 'Log your first training session.' },
  { id: 'streak_3',       icon: Zap,      label: '3-Day Streak',      hint: 'Train 3 days in a row.' },
  { id: 'streak_7',       icon: Flame,    label: 'Week Warrior',      hint: 'Train 7 days in a row.' },
  { id: 'workouts_10',    icon: Dumbbell, label: '10 Workouts',       hint: 'Log 10 total workouts.' },
  { id: 'workouts_50',    icon: Trophy,   label: '50 Workouts',       hint: 'Log 50 total workouts.' },
  { id: 'first_post',     icon: Users,    label: 'First Post',        hint: 'Share something in the Feed.' },
  { id: 'first_pr',       icon: TrendingUp, label: 'First PR',        hint: 'Add a starting stat to your profile.' },
  { id: 'first_trainer',  icon: Award,    label: 'Coached Up',        hint: 'Connect with a real trainer.' },
];

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
    id: a.id, name: a.name, initials: a.initials, sport: a.sport,
    position: a.position, age: a.age ?? null, city: a.city,
    stats: Array.isArray(a.stats) ? a.stats : [],
  };
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
}
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
  return (
    <div style={{
      height, position: 'relative', overflow: 'hidden',
      background: failed
        ? `linear-gradient(135deg, ${color}30 0%, #0F0F14 80%), repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.02) 10px, rgba(255,255,255,0.02) 20px)`
        : 'transparent',
    }}>
      {!failed && (
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

  // Restore a previously created athlete so the app remembers you.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('coachme_athlete') || 'null');
      if (saved && saved.id) setAthlete(saved);
    } catch {}
  }, []);

  const completeSignup = (a) => {
    const withId = { id: a.id || Date.now(), ...a };
    setAthlete(withId);
    try { localStorage.setItem('coachme_athlete', JSON.stringify(withId)); } catch {}
  };

  const [tab, setTab] = useState('profile');
  const [trainerOpen, setTrainerOpen] = useState(null);
  const [booking, setBooking] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [tabAnim, setTabAnim] = useState(false);

  const [conversations, setConversations] = useState({});
  const [sessions, setSessions] = useState([]);
  const [trainerIds, setTrainerIds] = useState([]);
  const [chatOpen, setChatOpen] = useState(null);
  const [callOpen, setCallOpen] = useState(null);

  // Coaches who signed themselves up via /become-a-coach. Stored locally
  // for now; this will move to Supabase in Phase 1.
  const [submittedTrainers, setSubmittedTrainers] = useState([]);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('coachme_coaches') || '[]');
      setSubmittedTrainers(Array.isArray(saved) ? saved : []);
    } catch {
      setSubmittedTrainers([]);
    }
  }, []);
  const allTrainers = [...TRAINERS, ...submittedTrainers];

  // Workout log (athlete's daily training). Persisted to localStorage.
  const [workouts, setWorkouts] = useState([]);
  const [logWorkoutOpen, setLogWorkoutOpen] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('coachme_workouts') || '[]');
      setWorkouts(Array.isArray(saved) ? saved : []);
    } catch {
      setWorkouts([]);
    }
  }, []);
  const saveWorkouts = (next) => {
    setWorkouts(next);
    try { localStorage.setItem('coachme_workouts', JSON.stringify(next)); } catch {}
  };
  const addWorkout = (w) => saveWorkouts([{ id: Date.now(), ...w }, ...workouts]);
  const removeWorkout = (id) => saveWorkouts(workouts.filter(w => w.id !== id));

  // Detect what the athlete has done so achievements can unlock honestly.
  const [hasPosts, setHasPosts] = useState(false);
  useEffect(() => {
    try {
      const posts = JSON.parse(localStorage.getItem('coachme_posts') || '[]');
      setHasPosts(Array.isArray(posts) && posts.length > 0);
    } catch {}
  }, [tab]); // re-check when switching tabs

  const switchTab = (t) => {
    if (t === tab) return;
    setTabAnim(true);
    setTimeout(() => { setTab(t); setTabAnim(false); }, 150);
  };

  const openTrainer = (id) => setTrainerOpen(id);
  const closeTrainer = () => setTrainerOpen(null);

  const startBook = (trainer, mode) => {
    setBooking({ trainer, mode: mode || trainer.modes[0], step: 1, slot: null });
  };

  const confirmBook = () => {
    const { trainer, mode, slot } = booking;
    const slotInfo = SLOTS[slot];
    const newSession = {
      id: Date.now(),
      trainerId: trainer.id,
      mode,
      date: slotInfo.day === 'TOMORROW' ? 'Tomorrow' : slotInfo.day,
      time: slotInfo.time,
      status: 'upcoming',
      location: mode === 'in_person' ? 'Tropical Park' : mode === 'live_online' ? 'Video call' : 'Async review',
    };
    setSessions(prev => [...prev, newSession]);

    setConversations(prev => {
      const conv = prev[trainer.id] || { trainerId: trainer.id, online: true, unread: 0, messages: [] };
      return {
        ...prev,
        [trainer.id]: {
          ...conv,
          messages: [
            ...conv.messages,
            {
              id: Date.now(),
              type: 'session_booked',
              mode,
              when: `${slotInfo.date.split(' ').slice(1).join(' ')} ${slotInfo.time}`,
              where: newSession.location,
              ts: 'Just now',
            },
          ],
        },
      };
    });

    if (!trainerIds.includes(trainer.id)) {
      setTrainerIds(prev => [...prev, trainer.id]);
    }

    setConfirmed(true);
    setBooking(null);
    setTrainerOpen(null);
    setTimeout(() => setConfirmed(false), 2400);
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
    }
    // Real replies come from the coach on the other end (via /coach). No fake auto-reply.
  };

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
          const last = messages[messages.length - 1];
          const isReplyFromCoach = last && last.from === 'trainer' && chatOpen !== t.coachId;
          next[t.coachId] = {
            trainerId: t.coachId,
            online: existing?.online ?? false,
            unread: chatOpen === t.coachId ? 0 : (isReplyFromCoach ? (existing?.unread || 0) + 1 : (existing?.unread || 0)),
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
    .display { font-family: var(--font-display), 'Bebas Neue', sans-serif; letter-spacing: 0.005em; }
    .body { font-family: var(--font-body), 'Manrope', system-ui, sans-serif; }
    .mono { font-family: var(--font-mono), 'JetBrains Mono', monospace; }
    .phone { -webkit-font-smoothing: antialiased; }
    .phone *::selection { background: #C5FF3D; color: #000; }
    .phone-scroll::-webkit-scrollbar { display: none; }
    .phone-scroll { -ms-overflow-style: none; scrollbar-width: none; }
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
  `;

  return (
    <div style={{ background: '#000', minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '20px 12px', fontFamily: 'system-ui' }}>
      <style>{phoneStyles}</style>

      <div className="phone" style={{
        width: '100%', maxWidth: 420, minHeight: 820, background: '#0A0A0B',
        borderRadius: 40, border: '8px solid #18181C',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        color: '#F4F4F5',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px 8px', fontSize: 13, fontWeight: 600 }} className="mono">
          <span>9:41</span>
          <div style={{ width: 60, height: 18, background: '#000', borderRadius: 12 }}/>
          <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor"><rect x="0" y="6" width="2" height="4" rx="0.5"/><rect x="4" y="4" width="2" height="6" rx="0.5"/><rect x="8" y="2" width="2" height="8" rx="0.5"/><rect x="12" y="0" width="2" height="10" rx="0.5"/></svg>
            <span style={{ fontSize: 10 }}>5G</span>
            <svg width="22" height="11" viewBox="0 0 22 11" fill="none" stroke="currentColor"><rect x="0.5" y="0.5" width="18" height="10" rx="2.5"/><rect x="2" y="2" width="14" height="7" rx="1" fill="#C5FF3D" stroke="none"/><rect x="20" y="3.5" width="1.5" height="4" rx="0.5" fill="currentColor"/></svg>
          </span>
        </div>

        {!athlete ? (
          <SignUpFlow onComplete={completeSignup} />
        ) : (
          <>
            <div className="phone-scroll" style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
              <div className={`tab-fade ${tabAnim ? 'out' : ''}`}>
                {tab === 'profile' && <ProfileView athlete={athlete} trainerIds={trainerIds} trainers={allTrainers} workouts={workouts} hasPosts={hasPosts} hasMessagedCoach={Object.values(conversations).some(c => c.messages?.some(m => m.from === 'me'))} onOpenTrainer={openTrainer} onGoToTrainers={() => switchTab('trainers')} onOpenChat={openChat} onLogWorkout={() => setLogWorkoutOpen(true)} onRemoveWorkout={removeWorkout} onSignOut={() => { try { localStorage.removeItem('coachme_athlete'); } catch {} setAthlete(null); }}/>}
                {tab === 'trainers' && <TrainersView onOpenTrainer={openTrainer} athlete={athlete} trainers={allTrainers}/>}
                {tab === 'community' && <CommunityView athlete={athlete}/>}
                {tab === 'messages' && <MessagesView conversations={conversations} trainers={allTrainers} onOpenChat={openChat} onGoToTrainers={() => switchTab('trainers')}/>}
                {tab === 'sessions' && <SessionsView sessions={sessions} trainers={allTrainers} onOpenTrainer={openTrainer} onGoToTrainers={() => switchTab('trainers')}/>}
              </div>
            </div>

            <BottomNav tab={tab} switchTab={switchTab} unread={totalUnread} />

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
                setBooking={setBooking}
                onConfirm={confirmBook}
                onClose={() => setBooking(null)}
              />
            )}

            {confirmed && <Celebration />}

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
function SignUpFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    firstName: '', lastName: '',
    sport: 'Baseball', position: '',
    age: '',
    city: '', state: 'FL',
    exitVelo: '', sixtyYd: '', throwVelo: '', popTime: '',
  });

  const upd = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const totalSteps = 5;
  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => Math.max(0, s - 1));

  const finish = () => {
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
      {step === 0 && <SUWelcome onNext={next}/>}
      {step === 1 && <SUStep title="Who are you?" sub="The basics. We'll fill in the rest." idx={1} total={totalSteps - 1}
        canContinue={nameValid} onNext={next} onBack={back}>
        <SUInput label="FIRST NAME" placeholder="Noah" value={form.firstName} onChange={v => upd('firstName', v)} autoFocus/>
        <SUInput label="LAST NAME" placeholder="Scarlett" value={form.lastName} onChange={v => upd('lastName', v)}/>
      </SUStep>}
      {step === 2 && <SUStep title="What's your sport?" sub="Pick from the list. You can add more sports later." idx={2} total={totalSteps - 1}
        canContinue={sportValid} onNext={next} onBack={back}>
        <SUSelect
          label="SPORT"
          value={form.sport}
          onChange={v => { upd('sport', v); upd('position', ''); }}
          options={SPORTS.map(s => ({ value: s.name, label: `${s.icon}  ${s.name}` }))}
        />
        {form.sport && (
          POSITIONS_BY_SPORT[form.sport] ? (
            <SUSelect
              label="POSITION"
              value={form.position}
              onChange={v => upd('position', v)}
              options={POSITIONS_BY_SPORT[form.sport].map(p => ({ value: p, label: p }))}
              placeholder="Pick your position"
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
        <SUSelect
          label="HOW OLD ARE YOU?"
          value={form.age ? String(form.age) : ''}
          onChange={v => upd('age', v)}
          options={AGES.map(a => ({ value: String(a), label: `${a} years old` }))}
          placeholder="Pick your age"
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

function SUWelcome({ onNext }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <CoverPhoto src={BASEBALL_BANNER} height={300}
        overlay="linear-gradient(180deg, rgba(10,10,11,0.3) 0%, rgba(10,10,11,1) 100%)" color="#C5FF3D">
        <div style={{ padding: 20, height: '100%', display: 'flex', alignItems: 'flex-end' }}>
          <span className="mono" style={{
            fontSize: 10, color: '#C5FF3D', padding: '5px 10px',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
            borderRadius: 100, letterSpacing: '0.18em', fontWeight: 700,
            border: '1px solid rgba(197,255,61,0.4)', display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C5FF3D' }} className="pulse-dot"/>
            WELCOME TO COACHME
          </span>
        </div>
      </CoverPhoto>

      <div style={{ padding: '20px 24px 28px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="display" style={{ fontSize: 48, lineHeight: 0.92, textTransform: 'uppercase', marginBottom: 12 }}>
          PROVE YOUR<br/><span style={{ color: '#C5FF3D' }}>GAME</span>.
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
                border: '1px solid rgba(197,255,61,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>{f.icon}</div>
              <span className="body" style={{ fontSize: 13, color: '#D4D6DA' }}>{f.text}</span>
            </div>
          ))}
        </div>

        <button onClick={onNext} style={{
          width: '100%', background: '#C5FF3D', color: '#000', border: 'none',
          padding: '16px 20px', borderRadius: 999, fontWeight: 700, fontSize: 15, cursor: 'pointer',
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 18,
        }} className="body">
          Get started <ArrowRight size={16}/>
        </button>

        <div className="body" style={{ marginTop: 16, textAlign: 'center', fontSize: 12.5, color: '#5F636B' }}>
          Are you a coach?{' '}
          <a href="/become-a-coach" style={{ color: '#C5FF3D', fontWeight: 700, textDecoration: 'none' }}>Join CoachMe</a>
          {'  ·  '}
          <a href="/coach" style={{ color: '#C5FF3D', fontWeight: 700, textDecoration: 'none' }}>Coach log in</a>
        </div>
      </div>
    </div>
  );
}

function SUStep({ idx, total, title, sub, children, canContinue, onNext, onBack, continueLabel }) {
  return (
    <div className="slide-right" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{
          background: '#18181C', border: '1px solid #2A2A30', borderRadius: '50%',
          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#F4F4F5', cursor: 'pointer', flexShrink: 0,
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
          borderRadius: 12, padding: '14px 16px', color: '#F4F4F5',
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
            borderRadius: 12, padding: '14px 40px 14px 16px', color: value ? '#F4F4F5' : '#5F636B',
            fontSize: 15, outline: 'none', appearance: 'none',
            WebkitAppearance: 'none', MozAppearance: 'none',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
          onFocus={e => e.currentTarget.style.borderColor = '#C5FF3D'}
          onBlur={e => e.currentTarget.style.borderColor = '#2A2A30'}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(o => <option key={o.value} value={o.value} style={{ background: '#18181C', color: '#F4F4F5' }}>{o.label}</option>)}
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
          borderRadius: 12, padding: '14px 16px', color: '#F4F4F5',
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
            color: '#F4F4F5', fontSize: 26, outline: 'none', padding: 0,
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
    <div className="fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', textAlign: 'center', justifyContent: 'center' }}>
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
      <div className="body" style={{ fontSize: 14, color: '#9CA0A8', marginBottom: 28, lineHeight: 1.5, maxWidth: 320, margin: '0 auto 28px' }}>
        Your card is live. Find your first trainer and start logging verified stats.
      </div>

      <button onClick={onFinish} style={{
        background: '#C5FF3D', color: '#000', border: 'none',
        padding: '16px 24px', borderRadius: 999, fontWeight: 700, fontSize: 15, cursor: 'pointer',
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, margin: '0 auto',
      }} className="body">
        Open my CoachMe <ArrowRight size={16}/>
      </button>
    </div>
  );
}

/* ============================================================
   PROFILE VIEW
   ============================================================ */
function ProfileView({ athlete, trainerIds, trainers = TRAINERS, workouts = [], hasPosts = false, hasMessagedCoach = false, onOpenTrainer, onGoToTrainers, onOpenChat, onLogWorkout, onRemoveWorkout, onSignOut }) {
  const hasStats = athlete.stats && athlete.stats.length > 0;
  const hasTrainers = trainerIds && trainerIds.length > 0;
  const streak = calcStreak(workouts);
  const thisWeek = countThisWeek(workouts);
  const totalWorkouts = workouts.length;

  // Achievement unlock state
  const earned: Record<string, boolean> = {
    first_workout:  totalWorkouts >= 1,
    streak_3:       streak >= 3,
    streak_7:       streak >= 7,
    workouts_10:    totalWorkouts >= 10,
    workouts_50:    totalWorkouts >= 50,
    first_post:     hasPosts,
    first_pr:       hasStats,
    // Unlocks on EITHER booking a session OR messaging any coach, since
    // booking needs real trainer calendars to be wired in.
    first_trainer:  hasTrainers || hasMessagedCoach,
  };
  const earnedCount = Object.values(earned).filter(Boolean).length;

  return (
    <div style={{ padding: '0 0 24px' }}>
      <div style={{
        margin: '12px 16px 20px', borderRadius: 24, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(160deg, #1C1C24 0%, #0F0F14 100%)',
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
          <div style={{ height: 100, background: 'linear-gradient(135deg, #C5FF3D20 0%, #0F0F14 80%)' }}/>
        )}

        <div style={{ padding: '0 20px 22px', marginTop: -42, position: 'relative', zIndex: 3 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Avatar photo={athlete.photo} initials={athlete.initials} size={76} square color="#C5FF3D" ring/>
            <div style={{ flex: 1, marginLeft: 14, paddingBottom: 4 }}>
              <div className="display" style={{ fontSize: 28, lineHeight: 1, textTransform: 'uppercase' }}>{athlete.name}</div>
              <div className="mono" style={{ fontSize: 10.5, color: '#9CA0A8', marginTop: 6, letterSpacing: '0.06em' }}>
                {athlete.position.toUpperCase()}
                {athlete.age ? ` · AGE ${athlete.age}` : ''}
                {' · '}{athlete.city.toUpperCase()}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }} className="mono">
              <span style={{ fontSize: 10, color: '#9CA0A8', letterSpacing: '0.12em' }}>LEVEL {athlete.level}</span>
              <span style={{ fontSize: 10, color: '#9CA0A8', letterSpacing: '0.06em' }}>{athlete.xp} / {athlete.xpMax} XP</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.max(2, (athlete.xp / athlete.xpMax) * 100)}%`, height: '100%',
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
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
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
                    color: '#F4F4F5', cursor: 'pointer', fontWeight: 600, fontSize: 12,
                  }} className="body">
                    <MessageCircle size={14} color="#C5FF3D"/> Message
                  </button>
                  <button onClick={() => onOpenTrainer(id)} style={{
                    background: '#18181C', border: '1px solid #2A2A30', borderRadius: 10,
                    padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    color: '#F4F4F5', cursor: 'pointer', fontWeight: 600, fontSize: 12,
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
      <div style={{ padding: '0 16px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {ACHIEVEMENTS.map(a => <AchievementCard key={a.id} achievement={a} earned={earned[a.id]}/>)}
      </div>

      {/* For coaches footer */}
      <div style={{ padding: '8px 16px 12px' }}>
        <div style={{
          background: 'linear-gradient(160deg, #1A1A20 0%, #0F0F14 100%)',
          border: '1px solid #2A2A30', borderRadius: 14, padding: 16, textAlign: 'center',
        }}>
          <div className="display" style={{ fontSize: 18, lineHeight: 1, textTransform: 'uppercase', marginBottom: 6 }}>
            ARE YOU A COACH?
          </div>
          <div className="body" style={{ fontSize: 12, color: '#9CA0A8', lineHeight: 1.5, marginBottom: 14 }}>
            Join CoachMe to train athletes, or log in to your coach dashboard.
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
              flex: 1, background: 'transparent', color: '#F4F4F5', textDecoration: 'none',
              padding: '10px', borderRadius: 999, fontWeight: 600, fontSize: 12.5,
              border: '1px solid #3A3A42',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <UserIcon size={13}/> Coach log in
            </a>
          </div>
        </div>
      </div>

      {/* Sign out (also clears the saved athlete so the welcome screen shows again) */}
      {onSignOut && (
        <div style={{ padding: '0 16px 24px', textAlign: 'center' }}>
          <button onClick={() => {
            if (typeof window !== 'undefined' && window.confirm('Sign out and start over? Your workouts and posts stay on this device.')) {
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
      background: 'linear-gradient(160deg, #1A1A20 0%, #0F0F14 100%)',
      border: '1px solid #2A2A30', borderRadius: 12, padding: '10px 8px',
      textAlign: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 4 }}>
        {icon}
        <span className="display" style={{ fontSize: 22, lineHeight: 1, color: '#F4F4F5' }}>{value}</span>
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
      background: 'linear-gradient(160deg, #1A1A20 0%, #0F0F14 100%)',
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
      <button onClick={onDelete} title="Delete" style={{
        background: 'none', border: 'none', color: '#5F636B', cursor: 'pointer', padding: 4,
        display: 'flex', flexShrink: 0,
      }}>
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
        : 'linear-gradient(160deg, #1A1A20 0%, #0F0F14 100%)',
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
        <div className="display" style={{ fontSize: 14, lineHeight: 1, textTransform: 'uppercase', color: earned ? '#F4F4F5' : '#9CA0A8' }}>{achievement.label}</div>
        <div className="body" style={{ fontSize: 10.5, color: '#5F636B', marginTop: 3, lineHeight: 1.4 }}>{achievement.hint}</div>
      </div>
    </div>
  );
}

function EmptyCard({ icon, title, sub, cta, onClick }) {
  return (
    <div style={{ padding: '0 16px', marginBottom: 24 }}>
      <div style={{
        background: 'linear-gradient(160deg, #1A1A20 0%, #0F0F14 100%)',
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
      background: 'linear-gradient(160deg, #1A1A20 0%, #0F0F14 100%)',
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
        <span className="mono" style={{ fontSize: 9, color: v.color, letterSpacing: '0.1em', fontWeight: 700 }}>
          <CheckCircle2 size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }}/>
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

function TrainerRow({ trainer, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', cursor: 'pointer',
      background: 'linear-gradient(160deg, #1A1A20 0%, #0F0F14 100%)',
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
          {trainer.title.toUpperCase()}
        </div>
      </div>
      <ChevronRight size={18} color="#5F636B"/>
    </button>
  );
}

/* ============================================================
   TRAINERS VIEW
   ============================================================ */
function TrainersView({ onOpenTrainer, athlete, trainers = TRAINERS }) {
  // Only show trainers verified for this athlete's sport. No cross-sport
  // padding, no fabricated rosters.
  const sportTrainers = trainers.filter(t => t.sport === athlete.sport);
  const formerPros = sportTrainers.filter(t => t.badge === 'FORMER PRO');
  const others = sportTrainers.filter(t => t.badge !== 'FORMER PRO');

  if (sportTrainers.length === 0) {
    return (
      <div style={{ padding: '12px 0 24px' }}>
        <div style={{ padding: '0 16px 12px' }}>
          <div className="display" style={{ fontSize: 36, lineHeight: 1, marginBottom: 4 }}>FIND A <span style={{ color: '#C5FF3D' }}>TRAINER</span></div>
          <div className="mono" style={{ fontSize: 11, color: '#9CA0A8', letterSpacing: '0.08em' }}>
            {athlete.sport.toUpperCase()} &middot; {athlete.city.toUpperCase()}
          </div>
        </div>
        <div style={{ padding: '40px 16px 0', textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(197,255,61,0.1) 0%, rgba(197,255,61,0.02) 100%)',
            border: '1px solid rgba(197,255,61,0.25)',
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
            ARE YOU A COACH? JOIN COACHME <ArrowRight size={12}/>
          </a>
          <div className="body" style={{ fontSize: 11, color: '#5F636B', marginTop: 16, lineHeight: 1.5 }}>
            Share this link with coaches you know. Every trainer on CoachMe signs up themselves.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 0 24px' }}>
      <div style={{ padding: '0 16px 8px' }}>
        <div className="display" style={{ fontSize: 36, lineHeight: 1, marginBottom: 4 }}>FIND A <span style={{ color: '#C5FF3D' }}>TRAINER</span></div>
        <div className="mono" style={{ fontSize: 11, color: '#9CA0A8', letterSpacing: '0.08em' }}>
          {sportTrainers.length} TRAINER{sportTrainers.length !== 1 ? 'S' : ''} &middot; {athlete.sport.toUpperCase()} &middot; {athlete.city.toUpperCase()}
        </div>
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

      <div style={{ padding: '0 16px 8px' }}>
        <SectionLabel>FEATURED &middot; FORMER PROS</SectionLabel>
      </div>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '12px 16px 16px' }} className="phone-scroll">
        {formerPros.map(t => <TrainerCardFeatured key={t.id} trainer={t} onClick={() => onOpenTrainer(t.id)}/>)}
      </div>

      <div style={{ padding: '0 16px 8px' }}>
        <SectionLabel>ALL TRAINERS</SectionLabel>
      </div>
      <div style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {others.map(t => <TrainerRow key={t.id} trainer={t} onClick={() => onOpenTrainer(t.id)}/>)}
      </div>
    </div>
  );
}

function TrainerCardFeatured({ trainer, onClick }) {
  return (
    <button onClick={onClick} style={{
      minWidth: 260, textAlign: 'left', cursor: 'pointer',
      background: '#0F0F14', border: '1px solid #2A2A30', borderRadius: 18, position: 'relative', overflow: 'hidden',
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

      <div style={{ padding: '0 18px 18px', marginTop: -28, position: 'relative' }}>
        <Avatar photo={trainer.photo} initials={trainer.initials} size={56} color={trainer.color} square ring/>
        <div className="display" style={{ fontSize: 22, lineHeight: 1, textTransform: 'uppercase', marginTop: 10 }}>{trainer.name}</div>
        <div className="mono" style={{ fontSize: 10, color: '#9CA0A8', marginTop: 4, letterSpacing: '0.06em' }}>{trainer.specialty.toUpperCase()}</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: 12, background: 'rgba(255,255,255,0.025)', borderRadius: 10, marginTop: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
          <Mini num={trainer.athletes || 0} label="ATHLETES"/>
          <Mini num={trainer.avgGain || '—'} label="AVG GAIN" small/>
          <Mini num={trainer.rating ?? 'NEW'} label="RATING" icon={trainer.rating ? <Star size={9} fill="#C5FF3D" color="#C5FF3D"/> : null}/>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 14 }}>
          <span className="display" style={{ fontSize: 22, color: '#F4F4F5' }}>${trainer.rate}<span className="mono" style={{ fontSize: 10, color: '#9CA0A8', marginLeft: 2 }}>/HR</span></span>
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
   MESSAGES VIEW
   ============================================================ */
function MessagesView({ conversations, trainers = TRAINERS, onOpenChat, onGoToTrainers }) {
  const sortedConvs = Object.values(conversations).filter(c => c.messages.length > 0);

  if (sortedConvs.length === 0) {
    return (
      <div style={{ padding: '12px 0 24px' }}>
        <div style={{ padding: '0 16px 12px' }}>
          <div className="display" style={{ fontSize: 36, lineHeight: 1, marginBottom: 4 }}>YOUR <span style={{ color: '#C5FF3D' }}>MESSAGES</span></div>
          <div className="mono" style={{ fontSize: 11, color: '#9CA0A8', letterSpacing: '0.08em' }}>NO CONVERSATIONS YET</div>
        </div>
        <div style={{ padding: '40px 16px 0', textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(197,255,61,0.1) 0%, rgba(197,255,61,0.02) 100%)',
            border: '1px solid rgba(197,255,61,0.25)',
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
    <div style={{ padding: '12px 0 24px' }}>
      <div style={{ padding: '0 16px 12px' }}>
        <div className="display" style={{ fontSize: 36, lineHeight: 1, marginBottom: 4 }}>YOUR <span style={{ color: '#C5FF3D' }}>MESSAGES</span></div>
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
            fontSize: 13, color: conv.unread > 0 ? '#F4F4F5' : '#9CA0A8',
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
function ChatView({ trainer, conversation, athlete, onClose, onSend, onCall }) {
  const [input, setInput] = useState('');
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
    // No fake "trainer is typing" simulation — replies come from the real
    // coach on the other end (via /coach), surfaced through the storage sync.
  };

  return (
    <div className="slide-up" style={{
      position: 'absolute', inset: 0, background: '#0A0A0B', zIndex: 150,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 12px', borderBottom: '1px solid #1F1F25', flexShrink: 0,
        background: 'rgba(10,10,11,0.95)', backdropFilter: 'blur(12px)',
        position: 'relative', zIndex: 10, gap: 8,
      }}>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#F4F4F5', cursor: 'pointer',
          display: 'flex', alignItems: 'center', flexShrink: 0,
        }}>
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

      {input.length === 0 && (
        <div style={{ padding: '0 12px 8px', display: 'flex', gap: 6, overflowX: 'auto' }} className="phone-scroll">
          {QUICK_REPLIES.map((q, i) => (
            <button key={i} onClick={() => handleSend(q)} className="body" style={{
              fontSize: 12, padding: '8px 12px', borderRadius: 999,
              background: 'rgba(197,255,61,0.08)', border: '1px solid rgba(197,255,61,0.25)',
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
            borderRadius: 999, padding: '10px 16px', color: '#F4F4F5',
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
    </div>
  );
}

function Message({ m, trainer, isLastFromSender }) {
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
            <div className="display" style={{ fontSize: 22, lineHeight: 1, color: '#F4F4F5' }}>
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
          color: isMe ? '#000' : '#F4F4F5',
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
          background: 'linear-gradient(180deg, transparent 0%, rgba(197,255,61,0.06) 50%, transparent 100%)',
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
function SessionsView({ sessions, trainers = TRAINERS, onOpenTrainer, onGoToTrainers }) {
  const upcoming = sessions.filter(s => s.status === 'upcoming' || s.status === 'review');
  const past = sessions.filter(s => s.status === 'past');

  if (sessions.length === 0) {
    return (
      <div style={{ padding: '12px 0 24px' }}>
        <div style={{ padding: '0 16px 12px' }}>
          <div className="display" style={{ fontSize: 36, lineHeight: 1, marginBottom: 4 }}>YOUR <span style={{ color: '#C5FF3D' }}>SESSIONS</span></div>
          <div className="mono" style={{ fontSize: 11, color: '#9CA0A8', letterSpacing: '0.08em' }}>NO SESSIONS YET</div>
        </div>
        <div style={{ padding: '40px 16px 0', textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(197,255,61,0.1) 0%, rgba(197,255,61,0.02) 100%)',
            border: '1px solid rgba(197,255,61,0.25)',
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
    <div style={{ padding: '12px 0 24px' }}>
      <div style={{ padding: '0 16px 12px' }}>
        <div className="display" style={{ fontSize: 36, lineHeight: 1, marginBottom: 4 }}>YOUR <span style={{ color: '#C5FF3D' }}>SESSIONS</span></div>
        <div className="mono" style={{ fontSize: 11, color: '#9CA0A8', letterSpacing: '0.08em' }}>{upcoming.length} UPCOMING &middot; {past.length} COMPLETED</div>
      </div>

      {upcoming.length > 0 && (
        <>
          <div style={{ padding: '12px 16px 8px' }}>
            <SectionLabel>UPCOMING</SectionLabel>
          </div>
          <div style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcoming.map(s => <SessionCard key={s.id} session={s} trainers={trainers} onClickTrainer={() => onOpenTrainer(s.trainerId)}/>)}
          </div>
        </>
      )}

      {past.length > 0 && (
        <>
          <div style={{ padding: '12px 16px 8px' }}>
            <SectionLabel>COMPLETED</SectionLabel>
          </div>
          <div style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {past.map(s => <SessionCard key={s.id} session={s} trainers={trainers} onClickTrainer={() => onOpenTrainer(s.trainerId)}/>)}
          </div>
        </>
      )}
    </div>
  );
}

function SessionCard({ session, trainers = TRAINERS, onClickTrainer }) {
  const trainer = trainers.find(t => t.id === session.trainerId);
  const Mode = MODE_META[session.mode];
  const ModeIcon = Mode.icon;
  if (!trainer) return null;

  return (
    <div style={{
      background: 'linear-gradient(160deg, #1A1A20 0%, #0F0F14 100%)',
      border: '1px solid #2A2A30', borderRadius: 14, padding: 12, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 3, height: '100%',
        background: session.status === 'upcoming' ? '#C5FF3D' : session.status === 'review' ? '#FF9BCD' : '#2A2A30',
      }}/>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 4 }}>
        <button onClick={onClickTrainer} style={{ padding: 0, background: 'none', border: 'none', cursor: 'pointer' }}>
          <Avatar photo={trainer.photo} initials={trainer.initials} size={44} color={trainer.color} square/>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="display" style={{ fontSize: 18, lineHeight: 1, textTransform: 'uppercase' }}>{trainer.name}</div>
          <div className="mono" style={{ fontSize: 10, color: '#9CA0A8', marginTop: 5, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ModeIcon size={10} color={Mode.color}/>
            {Mode.label.toUpperCase()} &middot; {session.location.toUpperCase()}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="display" style={{ fontSize: 17, lineHeight: 1, color: session.status === 'past' ? '#9CA0A8' : '#C5FF3D' }}>{session.date.toUpperCase()}</div>
          <div className="mono" style={{ fontSize: 10, color: '#5F636B', marginTop: 4, letterSpacing: '0.06em' }}>{session.time}</div>
        </div>
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
  };

  const toggleLike = (id) => {
    save(posts.map(p => p.id === id ? {
      ...p, liked: !p.liked, likes: p.liked ? Math.max(0, p.likes - 1) : p.likes + 1,
    } : p));
  };

  const remove = (id) => {
    save(posts.filter(p => p.id !== id));
  };

  return (
    <div style={{ padding: '12px 0 24px' }}>
      <div style={{ padding: '0 16px 12px' }}>
        <div className="display" style={{ fontSize: 36, lineHeight: 1, marginBottom: 4 }}>THE <span style={{ color: '#C5FF3D' }}>FEED</span></div>
        <div className="mono" style={{ fontSize: 11, color: '#9CA0A8', letterSpacing: '0.08em' }}>
          ATHLETES &middot; TRAINING UPDATES &middot; PRS
        </div>
      </div>

      {/* Composer */}
      <div style={{ padding: '8px 16px 16px' }}>
        <div style={{
          background: 'linear-gradient(160deg, #1A1A20 0%, #0F0F14 100%)',
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
              color: '#F4F4F5', fontSize: 14, outline: 'none', resize: 'none',
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
            border: '1px solid rgba(197,255,61,0.25)',
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
          {posts.map(p => <PostCard key={p.id} post={p} currentName={athlete.name} onLike={() => toggleLike(p.id)} onDelete={() => remove(p.id)}/>)}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, currentName, onLike, onDelete }) {
  const mine = post.author?.name === currentName;
  const ago = timeAgo(post.ts);
  return (
    <div style={{
      background: 'linear-gradient(160deg, #1A1A20 0%, #0F0F14 100%)',
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
          <button onClick={onDelete} title="Delete post" style={{
            background: 'none', border: 'none', color: '#5F636B', cursor: 'pointer',
            padding: 4, display: 'flex',
          }}>
            <X size={14}/>
          </button>
        )}
      </div>
      <div className="body" style={{ fontSize: 14, color: '#F4F4F5', lineHeight: 1.5, whiteSpace: 'pre-wrap', marginBottom: 12 }}>
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
   BOTTOM NAV
   ============================================================ */
function BottomNav({ tab, switchTab, unread }) {
  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'trainers', label: 'Trainers', icon: Search },
    { id: 'community', label: 'Feed', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageCircle, badge: unread },
    { id: 'sessions', label: 'Sessions', icon: CalIcon },
  ];
  return (
    <div style={{
      borderTop: '1px solid #1F1F25',
      background: 'rgba(10,10,11,0.92)', backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex', justifyContent: 'space-around', padding: '12px 2px 18px',
      flexShrink: 0,
    }}>
      {tabs.map(t => {
        const Icon = t.icon;
        const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => switchTab(t.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer', padding: '6px 6px',
            color: active ? '#C5FF3D' : '#5F636B', position: 'relative',
            transition: 'color 0.15s', minWidth: 0,
          }}>
            <div style={{ position: 'relative' }}>
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
            <span className="mono" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t.label}</span>
            {active && <span style={{
              position: 'absolute', bottom: -12, width: 20, height: 2, background: '#C5FF3D', borderRadius: 2,
            }}/>}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
   TRAINER DETAIL OVERLAY
   ============================================================ */
function TrainerDetail({ trainer, onClose, onBook, onMessage, onCall }) {
  const [selectedMode, setSelectedMode] = useState(trainer.modes[0]);

  return (
    <div className="slide-up" style={{
      position: 'absolute', inset: 0, background: '#0A0A0B', zIndex: 100,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: '1px solid #1F1F25', flexShrink: 0,
        background: 'rgba(10,10,11,0.9)', backdropFilter: 'blur(12px)', position: 'relative', zIndex: 10,
      }}>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#F4F4F5', cursor: 'pointer',
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

          <div style={{ padding: '0 20px', marginTop: -55, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
              <Avatar photo={trainer.photo} initials={trainer.initials} size={96} square color={trainer.color} ring/>
              <div style={{ flex: 1, paddingBottom: 8 }}>
                <div className="display" style={{ fontSize: 30, lineHeight: 1, textTransform: 'uppercase' }}>{trainer.name}</div>
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
            color: '#F4F4F5', cursor: 'pointer', fontWeight: 600, fontSize: 13,
          }} className="body">
            <MessageCircle size={16} color="#C5FF3D"/> Message
          </button>
          <button onClick={() => onCall(trainer.id)} style={{
            background: '#18181C', border: '1px solid #2A2A30', borderRadius: 14,
            padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            color: '#F4F4F5', cursor: 'pointer', fontWeight: 600, fontSize: 13,
          }} className="body">
            <Video size={16} color="#5DA9FF"/> Video Call
          </button>
        </div>

        <div style={{ padding: '24px 20px 0' }}>
          <SectionLabel>TRACK RECORD</SectionLabel>
          <div style={{
            marginTop: 12, padding: 18,
            background: 'linear-gradient(160deg, #1A1A20 0%, #0F0F14 100%)',
            border: '1px solid #2A2A30', borderRadius: 14,
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, position: 'relative',
          }}>
            <BigStat num={trainer.athletes || 0} label="ATHLETES"/>
            <BigStat num={trainer.avgGain || '—'} label="AVG GAIN" small/>
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
                  background: sel ? 'rgba(197,255,61,0.06)' : 'linear-gradient(160deg, #1A1A20 0%, #0F0F14 100%)',
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
                    <div className="display" style={{ fontSize: 18, lineHeight: 1, textTransform: 'uppercase', color: sel ? '#C5FF3D' : '#F4F4F5' }}>
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
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div className="slide-up" onClick={e => e.stopPropagation()} style={{
        width: '100%', background: '#0F0F14', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, borderTop: '1px solid #2A2A30', position: 'relative', maxHeight: '90vh', overflowY: 'auto',
      }} className="phone-scroll">
        <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 36, height: 4, background: '#3A3A42', borderRadius: 999 }}/>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 4 }}>
          <div className="display" style={{ fontSize: 26, lineHeight: 1, textTransform: 'uppercase' }}>
            LOG <span style={{ color: '#C5FF3D' }}>WORKOUT</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#5F636B', cursor: 'pointer' }}>
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
            borderRadius: 12, padding: '14px 16px', color: '#F4F4F5',
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
            borderRadius: 12, padding: '12px 14px', color: '#F4F4F5',
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
function BookingFlow({ booking, setBooking, onConfirm, onClose }) {
  const { trainer, mode, step, slot } = booking;
  const Mode = MODE_META[mode];

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div className="slide-up" onClick={e => e.stopPropagation()} style={{
        width: '100%', background: '#0F0F14', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, borderTop: '1px solid #2A2A30', position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 36, height: 4, background: '#3A3A42', borderRadius: 999 }}/>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 4 }}>
          <span className="mono" style={{ fontSize: 10, color: '#5F636B', letterSpacing: '0.18em' }}>STEP {step} OF 2</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#5F636B', cursor: 'pointer' }}>
            <X size={18}/>
          </button>
        </div>

        {step === 1 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <Avatar photo={trainer.photo} initials={trainer.initials} size={48} square color={trainer.color}/>
              <div>
                <div className="display" style={{ fontSize: 22, lineHeight: 1, textTransform: 'uppercase' }}>PICK A TIME</div>
                <div className="mono" style={{ fontSize: 10, color: '#9CA0A8', marginTop: 6, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mode.icon size={10} color={Mode.color}/> {Mode.label.toUpperCase()} &middot; ${trainer.rate}/HR
                </div>
              </div>
            </div>

            {SLOTS.length === 0 && (
              <div style={{
                padding: 20, borderRadius: 12, background: '#18181C',
                border: '1px dashed #2A2A30', textAlign: 'center', marginBottom: 20,
              }}>
                <div className="display" style={{ fontSize: 18, marginBottom: 6, textTransform: 'uppercase' }}>
                  No Slots Available
                </div>
                <div className="body" style={{ fontSize: 12, color: '#9CA0A8', lineHeight: 1.5 }}>
                  Real availability loads from the trainer's calendar. Once a verified trainer is connected, their open times appear here.
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {SLOTS.map((s, i) => (
                <button key={i} onClick={() => setBooking({ ...booking, slot: i, step: 2 })} style={{
                  cursor: 'pointer', textAlign: 'left',
                  padding: 14, borderRadius: 12,
                  background: 'linear-gradient(160deg, #1A1A20 0%, #0F0F14 100%)',
                  border: '1px solid #2A2A30',
                  display: 'flex', alignItems: 'center', gap: 14, transition: 'border-color 0.15s',
                }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: 12,
                    background: 'rgba(197,255,61,0.08)', border: '1px solid rgba(197,255,61,0.3)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div className="mono" style={{ fontSize: 8, color: '#9CA0A8', letterSpacing: '0.08em' }}>{s.date.split(' ')[1].toUpperCase()}</div>
                    <div className="display" style={{ fontSize: 19, lineHeight: 1, color: '#C5FF3D' }}>{s.date.split(' ')[2]}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="display" style={{ fontSize: 17, lineHeight: 1, textTransform: 'uppercase' }}>{s.day}</div>
                    <div className="mono" style={{ fontSize: 11, color: '#9CA0A8', marginTop: 4, letterSpacing: '0.06em' }}>{s.time}</div>
                  </div>
                  <ChevronRight size={18} color="#5F636B"/>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="display" style={{ fontSize: 28, lineHeight: 1.05, marginBottom: 18 }}>
              CONFIRM YOUR<br/><span style={{ color: '#C5FF3D' }}>SESSION</span>
            </div>

            <div style={{
              padding: 18, borderRadius: 16, marginBottom: 20,
              background: 'linear-gradient(160deg, #1A1A20 0%, #0F0F14 100%)',
              border: '1px solid #2A2A30',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 14, borderBottom: '1px solid #2A2A30', marginBottom: 4 }}>
                <Avatar photo={trainer.photo} initials={trainer.initials} size={44} square color={trainer.color}/>
                <div>
                  <div className="display" style={{ fontSize: 18, lineHeight: 1, textTransform: 'uppercase' }}>{trainer.name}</div>
                  <div className="mono" style={{ fontSize: 10, color: '#9CA0A8', marginTop: 4, letterSpacing: '0.06em' }}>{trainer.title.toUpperCase()}</div>
                </div>
              </div>
              <Row k="MODE" v={Mode.label}/>
              <Row k="DATE" v={SLOTS[slot].date}/>
              <Row k="TIME" v={SLOTS[slot].time}/>
              <Row k="RATE" v={`$${trainer.rate}/hr`} last/>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setBooking({ ...booking, step: 1 })} style={{
                flex: 1, background: 'transparent', color: '#F4F4F5', border: '1px solid #3A3A42',
                padding: '14px', borderRadius: 999, fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }} className="body">Back</button>
              <button onClick={onConfirm} style={{
                flex: 2, background: '#C5FF3D', color: '#000', border: 'none',
                padding: '14px 20px', borderRadius: 999, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
              }} className="body">
                Confirm and book <ArrowRight size={15}/>
              </button>
            </div>
          </>
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
