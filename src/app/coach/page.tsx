"use client";
/* eslint-disable @next/next/no-img-element, react/no-unknown-property */
// @ts-nocheck
// Coach Console: deliberately styled apart from the athlete app. Athletes
// get the black-and-lime hype app; coaches get a calm slate-and-sky
// professional tool. Shared data layer is the same localStorage stores.

import { useState, useEffect, useRef } from "react";
import {
  Home, MessageCircle, Users, User, Video, Send, ChevronLeft, X,
  ArrowRight, Mic, MicOff, VideoOff, PhoneOff, Camera, MoreHorizontal,
  Inbox, MapPin, Clock, CheckCircle2, LogOut, Calendar,
} from "lucide-react";

/* ----- palette: the coach side's own identity ----- */
const C = {
  bg: "#080D14",
  panel: "#0E1621",
  panelUp: "#131E2D",
  border: "#1C2A3A",
  text: "#E2E8F0",
  muted: "#64748B",
  faint: "#3B4A5E",
  accent: "#38BDF8",
  accentDim: "rgba(56,189,248,0.12)",
  accentBorder: "rgba(56,189,248,0.4)",
  amber: "#F59E0B",
  amberDim: "rgba(245,158,11,0.12)",
  green: "#34D399",
  red: "#F87171",
};

/* ----- shared store helpers (same keys the athlete app uses) ----- */
function loadThreads() {
  try {
    const t = JSON.parse(localStorage.getItem("coachme_threads") || "[]");
    return Array.isArray(t) ? t : [];
  } catch { return []; }
}
function saveThreads(threads) {
  try { localStorage.setItem("coachme_threads", JSON.stringify(threads)); } catch {}
}
function loadCoaches() {
  try {
    const c = JSON.parse(localStorage.getItem("coachme_coaches") || "[]");
    return Array.isArray(c) ? c : [];
  } catch { return []; }
}
function pushCoachReply(threadId, text) {
  const threads = loadThreads();
  const t = threads.find(x => x.id === threadId);
  if (!t) return;
  t.messages.push({ id: Date.now(), from: "coach", text, ts: Date.now() });
  t.updatedAt = Date.now();
  saveThreads(threads);
}
// Every athlete who signs up in the app registers here. Coaches browse
// this to find kids to train and can open the first conversation.
function loadAthleteDirectory() {
  try {
    const d = JSON.parse(localStorage.getItem("coachme_athletes") || "[]");
    return Array.isArray(d) ? d : [];
  } catch { return []; }
}
// Coach-initiated conversations: create the thread if it does not exist.
function ensureThread(coach, athleteSnap) {
  const threads = loadThreads();
  const id = `${athleteSnap.id}::${coach.id}`;
  let t = threads.find(x => x.id === id);
  if (!t) {
    t = { id, coachId: coach.id, coachName: coach.name, athlete: athleteSnap, messages: [], updatedAt: Date.now() };
    threads.push(t);
    saveThreads(threads);
  }
  return id;
}
function timeAgo(ts) {
  if (!ts) return "";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}
function athleteFirstName(athlete) {
  return athlete?.firstName
    || (athlete?.name && athlete.name.length > 3 ? athlete.name : null)
    || "athlete";
}
function needsReply(t) {
  const last = t.messages[t.messages.length - 1];
  return !!last && last.from === "athlete";
}

const VERIFY_META = {
  event: { label: "EVENT VERIFIED", color: C.green },
  facility: { label: "FACILITY VERIFIED", color: C.accent },
  trainer: { label: "TRAINER VERIFIED", color: C.accent },
  self: { label: "SELF-REPORTED", color: C.muted },
};

const MODE_LABELS = { in_person: "In person", live_online: "Live online", async: "Async review" };

const pageStyles = `
  .display { font-family: var(--font-display), 'Bebas Neue', sans-serif; letter-spacing: 0.005em; }
  .body { font-family: var(--font-body), 'Manrope', system-ui, sans-serif; }
  .mono { font-family: var(--font-mono), 'JetBrains Mono', monospace; }
  .scroll::-webkit-scrollbar { width: 8px; height: 8px; }
  .scroll::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
  .scroll::-webkit-scrollbar-track { background: transparent; }
  @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }
  .pulse-dot { animation: pulseDot 1.8s infinite; }
  .cc-sidebar { display: none; }
  .cc-mobilenav { display: flex; }
  @media (min-width: 880px) {
    .cc-sidebar { display: flex; }
    .cc-mobilenav { display: none; }
  }
  .cc-tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (min-width: 880px) { .cc-tiles { grid-template-columns: repeat(4, 1fr); } }
  .cc-roster { display: grid; grid-template-columns: 1fr; gap: 12px; }
  @media (min-width: 880px) { .cc-roster { grid-template-columns: 1fr 1fr; } }
`;

function Avatar({ initials, size = 44, color = C.accent, square = false }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: square ? Math.max(8, size * 0.2) : "50%",
      background: `linear-gradient(135deg, ${color}26 0%, ${color}0D 100%)`,
      border: `1px solid ${color}55`, display: "flex", alignItems: "center",
      justifyContent: "center", flexShrink: 0,
    }}>
      <span className="display" style={{ fontSize: size * 0.4, color, lineHeight: 1 }}>{initials}</span>
    </div>
  );
}

/* ============================================================
   ROOT
   ============================================================ */
export default function CoachConsole() {
  const [coach, setCoachState] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [threads, setThreads] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState("overview");
  const [openThreadId, setOpenThreadId] = useState(null);
  const [callOpen, setCallOpen] = useState(false);

  const setCoach = (c) => {
    setCoachState(c);
    try {
      if (c) sessionStorage.setItem("coachme_active_coach", JSON.stringify(c));
      else sessionStorage.removeItem("coachme_active_coach");
    } catch {}
  };

  useEffect(() => {
    const allCoaches = loadCoaches();
    setCoaches(allCoaches);
    setThreads(loadThreads());
    setDirectory(loadAthleteDirectory());
    try {
      const savedRaw = sessionStorage.getItem("coachme_active_coach");
      if (savedRaw) {
        const saved = JSON.parse(savedRaw);
        const fresh = allCoaches.find(c => c.id === saved.id);
        if (fresh) setCoachState(fresh);
        else if (saved && saved.id) setCoachState(saved);
      }
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "coachme_threads") setThreads(loadThreads());
      if (e.key === "coachme_coaches") setCoaches(loadCoaches());
      if (e.key === "coachme_athletes") setDirectory(loadAthleteDirectory());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const refresh = () => setThreads(loadThreads());

  const myThreads = coach
    ? threads.filter(t => t.coachId === coach.id).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    : [];
  const openThread = myThreads.find(t => t.id === openThreadId);

  const reply = (text) => {
    if (!openThread) return;
    pushCoachReply(openThread.id, text);
    refresh();
  };

  const goToThread = (id) => {
    setOpenThreadId(id);
    setView("messages");
  };

  // Coach picks a kid from the directory and starts the conversation.
  const messageAthlete = (athleteSnap) => {
    const id = ensureThread(coach, athleteSnap);
    refresh();
    setOpenThreadId(id);
    setView("messages");
  };

  return (
    <div className="body" style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      <style>{pageStyles}</style>

      {!ready ? null : !coach ? (
        <CoachPicker coaches={coaches} onSelect={setCoach} />
      ) : (
        <Shell
          coach={coach}
          view={view}
          setView={(v) => { setView(v); if (v !== "messages") setOpenThreadId(null); }}
          onSwitch={() => setCoach(null)}
          needsReplyCount={myThreads.filter(needsReply).length}
        >
          {view === "overview" && (
            <OverviewView coach={coach} threads={myThreads} directoryCount={directory.length} onOpenThread={goToThread} onGoAthletes={() => setView("roster")}/>
          )}
          {view === "messages" && (
            openThread ? (
              <ConversationView
                thread={openThread}
                onBack={() => setOpenThreadId(null)}
                onReply={reply}
                onCall={() => setCallOpen(true)}
              />
            ) : (
              <InboxView threads={myThreads} onOpen={setOpenThreadId}/>
            )
          )}
          {view === "roster" && (
            <AthletesView threads={myThreads} directory={directory} onOpenThread={goToThread} onStart={messageAthlete}/>
          )}
          {view === "profile" && (
            <MyProfileView coach={coach}/>
          )}
        </Shell>
      )}

      {callOpen && openThread && (
        <CoachCallView athlete={openThread.athlete} onClose={() => setCallOpen(false)}/>
      )}
    </div>
  );
}

/* ============================================================
   PICKER (coach "login")
   ============================================================ */
function CoachPicker({ coaches, onSelect }) {
  return (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "56px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9, background: C.accentDim,
          border: `1px solid ${C.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Users size={16} color={C.accent}/>
        </div>
        <span className="mono" style={{ fontSize: 11, color: C.muted, letterSpacing: "0.2em" }}>
          COACHME · COACH CONSOLE
        </span>
      </div>

      <div className="display" style={{ fontSize: 46, lineHeight: 0.95, textTransform: "uppercase", marginBottom: 12 }}>
        YOUR ATHLETES.<br/><span style={{ color: C.accent }}>YOUR CONSOLE.</span>
      </div>
      <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 34, maxWidth: 480 }}>
        Manage the athletes you train: answer messages, review their stats, jump on video calls, and keep your coaching profile sharp.
      </div>

      {coaches.length === 0 ? (
        <div style={{
          padding: 28, borderRadius: 16, background: C.panel,
          border: `1px dashed ${C.border}`, textAlign: "center",
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: 14, margin: "0 auto 14px",
            background: C.accentDim, border: `1px solid ${C.accentBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <User size={26} color={C.accent}/>
          </div>
          <div className="display" style={{ fontSize: 22, marginBottom: 6, textTransform: "uppercase" }}>NO COACH ACCOUNTS YET</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, marginBottom: 18 }}>
            Apply as a coach first. Once your application is in, your console appears here.
          </div>
          <a href="/become-a-coach" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: C.accent, color: "#04121D", padding: "12px 22px",
            borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none",
          }}>
            Apply as a coach <ArrowRight size={14}/>
          </a>
        </div>
      ) : (
        <>
          <div className="mono" style={{ fontSize: 10.5, color: C.muted, letterSpacing: "0.15em", marginBottom: 12 }}>
            SELECT YOUR PROFILE
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {coaches.map(c => (
              <button key={c.id} onClick={() => onSelect(c)} className="body" style={{
                width: "100%", textAlign: "left", cursor: "pointer",
                background: C.panel, border: `1px solid ${C.border}`,
                borderRadius: 12, padding: 14,
                display: "flex", alignItems: "center", gap: 14, color: C.text,
              }}>
                <Avatar initials={c.initials} size={46} square/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{c.name}</div>
                  <div className="mono" style={{ fontSize: 10, color: C.muted, marginTop: 3, letterSpacing: "0.05em" }}>
                    {(c.specialty || "").toUpperCase()} · {(c.sport || "").toUpperCase()}
                  </div>
                </div>
                <ArrowRight size={16} color={C.muted}/>
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 16, lineHeight: 1.5 }}>
            No password in this preview. Secure coach login arrives with the Phase 1 backend.
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   SHELL: sidebar (desktop) + top nav (mobile)
   ============================================================ */
function Shell({ coach, view, setView, onSwitch, needsReplyCount, children }) {
  const NAV = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "messages", label: "Messages", icon: MessageCircle, badge: needsReplyCount },
    { id: "roster", label: "Athletes", icon: Users },
    { id: "profile", label: "My Profile", icon: User },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column" }}>
      {/* Mobile top nav */}
      <div className="cc-mobilenav" style={{
        position: "sticky", top: 0, zIndex: 20, background: "rgba(8,13,20,0.92)",
        backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.border}`,
        padding: "10px 12px", alignItems: "center", gap: 8, overflowX: "auto",
      }}>
        <Avatar initials={coach.initials} size={32} square/>
        {NAV.map(n => {
          const Icon = n.icon;
          const active = view === n.id;
          return (
            <button key={n.id} onClick={() => setView(n.id)} className="body" style={{
              display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
              background: active ? C.accentDim : "transparent",
              border: active ? `1px solid ${C.accentBorder}` : "1px solid transparent",
              color: active ? C.accent : C.muted,
              padding: "7px 11px", borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              position: "relative",
            }}>
              <Icon size={14}/>{n.label}
              {n.badge > 0 && (
                <span className="mono" style={{
                  background: C.amber, color: "#1A1204", fontSize: 9, fontWeight: 700,
                  minWidth: 15, height: 15, borderRadius: 8, padding: "0 4px",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}>{n.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Desktop sidebar */}
        <aside className="cc-sidebar" style={{
          width: 232, flexShrink: 0, flexDirection: "column",
          borderRight: `1px solid ${C.border}`, background: C.panel2 || C.panel,
          padding: "20px 14px", position: "sticky", top: 0, height: "100vh",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 8px", marginBottom: 22 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, background: C.accentDim,
              border: `1px solid ${C.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Users size={14} color={C.accent}/>
            </div>
            <div>
              <div className="display" style={{ fontSize: 16, lineHeight: 1, letterSpacing: "0.04em" }}>COACH CONSOLE</div>
              <div className="mono" style={{ fontSize: 8.5, color: C.faint, letterSpacing: "0.2em", marginTop: 2 }}>COACHME PRO</div>
            </div>
          </div>

          <div style={{
            background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12,
            padding: 12, display: "flex", alignItems: "center", gap: 10, marginBottom: 18,
          }}>
            <Avatar initials={coach.initials} size={38} square/>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{coach.name}</div>
              <div className="mono" style={{ fontSize: 9, color: C.muted, letterSpacing: "0.06em", marginTop: 2 }}>
                {(coach.sport || "").toUpperCase()} COACH
              </div>
            </div>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
            {NAV.map(n => {
              const Icon = n.icon;
              const active = view === n.id;
              return (
                <button key={n.id} onClick={() => setView(n.id)} className="body" style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: active ? C.accentDim : "transparent",
                  border: active ? `1px solid ${C.accentBorder}` : "1px solid transparent",
                  color: active ? C.accent : C.muted,
                  padding: "10px 12px", borderRadius: 10, fontSize: 13.5, fontWeight: 600,
                  cursor: "pointer", textAlign: "left", width: "100%",
                }}>
                  <Icon size={16}/>
                  <span style={{ flex: 1 }}>{n.label}</span>
                  {n.badge > 0 && (
                    <span className="mono" style={{
                      background: C.amber, color: "#1A1204", fontSize: 9.5, fontWeight: 700,
                      minWidth: 17, height: 17, borderRadius: 9, padding: "0 5px",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}>{n.badge}</span>
                  )}
                </button>
              );
            })}
          </nav>

          <button onClick={onSwitch} className="body" style={{
            display: "flex", alignItems: "center", gap: 9,
            background: "transparent", border: `1px solid ${C.border}`, color: C.muted,
            padding: "9px 12px", borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
          }}>
            <LogOut size={14}/> Switch coach
          </button>
        </aside>

        <main className="scroll" style={{ flex: 1, minWidth: 0, overflowY: "auto", height: "100%", maxHeight: "100vh" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

/* ============================================================
   OVERVIEW
   ============================================================ */
function OverviewView({ coach, threads, directoryCount = 0, onOpenThread, onGoAthletes }) {
  const replyQueue = threads.filter(needsReply);
  const allMessages = threads
    .flatMap(t => t.messages.map(m => ({ ...m, athlete: t.athlete, threadId: t.id })))
    .sort((a, b) => (b.ts || 0) - (a.ts || 0))
    .slice(0, 6);

  return (
    <div style={{ padding: "28px 24px 48px", maxWidth: 920, margin: "0 auto" }}>
      <div className="mono" style={{ fontSize: 10, color: C.faint, letterSpacing: "0.2em", marginBottom: 8 }}>
        {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}
      </div>
      <div className="display" style={{ fontSize: 36, lineHeight: 1, textTransform: "uppercase", marginBottom: 26 }}>
        WELCOME BACK, <span style={{ color: C.accent }}>{coach.name.split(" ")[0].toUpperCase()}</span>
      </div>

      <div className="cc-tiles" style={{ marginBottom: 26 }}>
        <Tile icon={<Users size={15} color={C.accent}/>} value={threads.length} label="MY ATHLETES"/>
        <Tile
          icon={<Inbox size={15} color={replyQueue.length > 0 ? C.amber : C.accent}/>}
          value={replyQueue.length} label="NEED A REPLY"
          highlight={replyQueue.length > 0 ? C.amber : null}
        />
        <Tile
          icon={<User size={15} color={C.green}/>}
          value={directoryCount} label="KIDS ON COACHME"
          highlight={directoryCount > threads.length ? C.green : null}
        />
        <Tile
          icon={<Clock size={15} color={C.amber}/>}
          value="PENDING" label="VERIFICATION" small
          highlight={C.amber}
        />
      </div>

      {directoryCount > threads.length && (
        <button onClick={onGoAthletes} className="body" style={{
          width: "100%", textAlign: "left", cursor: "pointer",
          background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.35)",
          borderRadius: 14, padding: "14px 16px", marginBottom: 26,
          display: "flex", alignItems: "center", gap: 14, color: C.text,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: "rgba(52,211,153,0.12)",
            border: "1px solid rgba(52,211,153,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Users size={18} color={C.green}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              {directoryCount - threads.length} athlete{directoryCount - threads.length !== 1 ? "s" : ""} on CoachMe you have not talked to yet
            </div>
            <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>
              Browse their profiles and send the first message. Great coaches recruit.
            </div>
          </div>
          <ArrowRight size={15} color={C.green}/>
        </button>
      )}

      <SectionHead>REPLY QUEUE</SectionHead>
      {replyQueue.length === 0 ? (
        <div style={{
          background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14,
          padding: 22, display: "flex", alignItems: "center", gap: 14, marginBottom: 26,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: "rgba(52,211,153,0.1)",
            border: "1px solid rgba(52,211,153,0.35)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <CheckCircle2 size={18} color={C.green}/>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>All caught up</div>
            <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>
              No athletes are waiting on you. New messages land here first.
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 26 }}>
          {replyQueue.map(t => {
            const last = t.messages[t.messages.length - 1];
            return (
              <button key={t.id} onClick={() => onOpenThread(t.id)} className="body" style={{
                width: "100%", textAlign: "left", cursor: "pointer",
                background: C.panel, border: `1px solid ${C.amberDim ? "rgba(245,158,11,0.35)" : C.border}`,
                borderRadius: 12, padding: 13,
                display: "flex", alignItems: "center", gap: 12, color: C.text,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.amber, flexShrink: 0 }} className="pulse-dot"/>
                <Avatar initials={t.athlete?.initials || "?"} size={38}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>{t.athlete?.name}</div>
                  <div style={{
                    fontSize: 12.5, color: C.muted, whiteSpace: "nowrap", overflow: "hidden",
                    textOverflow: "ellipsis", marginTop: 2,
                  }}>{last?.text}</div>
                </div>
                <span className="mono" style={{ fontSize: 9.5, color: C.faint, flexShrink: 0 }}>{timeAgo(last?.ts)}</span>
                <ArrowRight size={14} color={C.muted}/>
              </button>
            );
          })}
        </div>
      )}

      <SectionHead>RECENT ACTIVITY</SectionHead>
      {allMessages.length === 0 ? (
        <div style={{
          background: C.panel, border: `1px dashed ${C.border}`, borderRadius: 14,
          padding: 26, textAlign: "center", marginBottom: 26,
        }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>No activity yet</div>
          <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>
            When athletes message you, everything shows up here.
          </div>
        </div>
      ) : (
        <div style={{
          background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14,
          overflow: "hidden", marginBottom: 26,
        }}>
          {allMessages.map((m, i) => (
            <div key={m.id} style={{
              padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
              borderBottom: i < allMessages.length - 1 ? `1px solid ${C.border}` : "none",
            }}>
              <Avatar initials={m.athlete?.initials || "?"} size={30}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700 }}>
                  {m.from === "coach" ? "You" : athleteFirstName(m.athlete)}
                </span>
                <span style={{
                  fontSize: 12.5, color: C.muted, marginLeft: 8,
                }}>{m.text.length > 70 ? m.text.slice(0, 70) + "..." : m.text}</span>
              </div>
              <span className="mono" style={{ fontSize: 9.5, color: C.faint, flexShrink: 0 }}>{timeAgo(m.ts)}</span>
            </div>
          ))}
        </div>
      )}

      <SectionHead>QUICK ACTIONS</SectionHead>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={onGoAthletes} className="body" style={{
          background: C.accentDim, border: `1px solid ${C.accentBorder}`, color: C.accent,
          padding: "11px 18px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <Users size={14}/> Find athletes to coach
        </button>
        <a href="/" target="_blank" rel="noopener" className="body" style={{
          background: "transparent", border: `1px solid ${C.border}`, color: C.muted,
          padding: "11px 18px", borderRadius: 10, fontWeight: 600, fontSize: 13, textDecoration: "none",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          See the athlete app <ArrowRight size={13}/>
        </a>
      </div>
    </div>
  );
}

function Tile({ icon, value, label, highlight, small }) {
  return (
    <div style={{
      background: C.panel, borderRadius: 14, padding: "16px 16px 14px",
      border: `1px solid ${highlight ? `${highlight}55` : C.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span className="mono" style={{ fontSize: 9, color: C.muted, letterSpacing: "0.14em" }}>{label}</span>
        {icon}
      </div>
      <div className="display" style={{
        fontSize: small ? 20 : 34, lineHeight: 1,
        color: highlight || C.text,
      }}>{value}</div>
    </div>
  );
}

function SectionHead({ children }) {
  return (
    <div className="mono" style={{
      fontSize: 10, color: C.muted, letterSpacing: "0.2em", marginBottom: 10,
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <span style={{ width: 14, height: 1, background: C.accent }}/>
      {children}
    </div>
  );
}

/* ============================================================
   INBOX + CONVERSATION
   ============================================================ */
function InboxView({ threads, onOpen }) {
  return (
    <div style={{ padding: "28px 24px 48px", maxWidth: 920, margin: "0 auto" }}>
      <div className="display" style={{ fontSize: 32, lineHeight: 1, textTransform: "uppercase", marginBottom: 4 }}>
        MESSAGES
      </div>
      <div className="mono" style={{ fontSize: 10, color: C.muted, letterSpacing: "0.12em", marginBottom: 22 }}>
        {threads.length} CONVERSATION{threads.length !== 1 ? "S" : ""}
      </div>

      {threads.length === 0 ? (
        <div style={{
          background: C.panel, border: `1px dashed ${C.border}`, borderRadius: 14,
          padding: 34, textAlign: "center",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: "0 auto 14px",
            background: C.accentDim, border: `1px solid ${C.accentBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Inbox size={24} color={C.accent}/>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>No conversations yet</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, maxWidth: 340, margin: "0 auto" }}>
            When an athlete messages you from the CoachMe app, the conversation appears here with their stats attached.
          </div>
        </div>
      ) : (
        <div style={{
          background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden",
        }}>
          {threads.map((t, i) => {
            const last = t.messages[t.messages.length - 1];
            const waiting = needsReply(t);
            return (
              <button key={t.id} onClick={() => onOpen(t.id)} className="body" style={{
                width: "100%", textAlign: "left", cursor: "pointer",
                background: "transparent", border: "none", color: C.text,
                padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
                borderBottom: i < threads.length - 1 ? `1px solid ${C.border}` : "none",
              }}>
                <Avatar initials={t.athlete?.initials || "?"} size={42}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{t.athlete?.name}</span>
                    <span className="mono" style={{ fontSize: 9.5, color: C.faint }}>{timeAgo(last?.ts)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 3 }}>
                    {waiting && <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.amber, flexShrink: 0 }}/>}
                    <span style={{
                      fontSize: 12.5, color: waiting ? C.text : C.muted, fontWeight: waiting ? 600 : 400,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {last ? (last.from === "coach" ? "You: " : "") + last.text : "No messages"}
                    </span>
                  </div>
                  <div className="mono" style={{ fontSize: 9, color: C.faint, marginTop: 3, letterSpacing: "0.05em" }}>
                    {(t.athlete?.sport || "").toUpperCase()}
                    {t.athlete?.position ? ` · ${t.athlete.position.toUpperCase()}` : ""}
                    {t.athlete?.age ? ` · AGE ${t.athlete.age}` : ""}
                  </div>
                </div>
                <ArrowRight size={15} color={C.faint}/>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const QUICK_OPENERS = [
  "I would like to be your coach.",
  "What position do you play?",
  "When do you usually train?",
  "What are you working on right now?",
];

function ConversationView({ thread, onBack, onReply, onCall }) {
  const [input, setInput] = useState("");
  const [showStats, setShowStats] = useState(false);
  const scrollRef = useRef(null);
  const messages = thread.messages || [];
  const athlete = thread.athlete || {};

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const send = () => {
    const t = input.trim();
    if (!t) return;
    onReply(t);
    setInput("");
  };

  const first = athleteFirstName(athlete);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", maxWidth: 920, margin: "0 auto" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "14px 16px",
        borderBottom: `1px solid ${C.border}`, background: "rgba(8,13,20,0.95)",
        backdropFilter: "blur(12px)", flexShrink: 0,
      }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.text, cursor: "pointer", display: "flex" }}>
          <ChevronLeft size={20}/>
        </button>
        <button onClick={() => setShowStats(s => !s)} className="body" style={{
          flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10,
          background: "none", border: "none", cursor: "pointer", textAlign: "left", color: C.text,
        }}>
          <Avatar initials={athlete.initials || "?"} size={36}/>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{athlete.name}</div>
            <div className="mono" style={{ fontSize: 9, color: C.muted, marginTop: 2, letterSpacing: "0.06em" }}>
              {(athlete.sport || "").toUpperCase()}{athlete.position ? ` · ${athlete.position.toUpperCase()}` : ""} · TAP FOR STATS
            </div>
          </div>
        </button>
        <button onClick={onCall} style={{
          background: C.accent, border: "none", color: "#04121D", cursor: "pointer",
          width: 36, height: 36, borderRadius: 9, display: "flex",
          alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Video size={16}/>
        </button>
      </div>

      {showStats && (
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, background: C.panel, flexShrink: 0 }}>
          <div className="mono" style={{ fontSize: 9.5, color: C.muted, letterSpacing: "0.15em", marginBottom: 10 }}>
            ATHLETE STATS · {(athlete.city || "").toUpperCase()}{athlete.age ? ` · AGE ${athlete.age}` : ""}
          </div>
          {athlete.stats && athlete.stats.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
              {athlete.stats.map((s, i) => {
                const v = VERIFY_META[s.verified] || VERIFY_META.self;
                return (
                  <div key={i} style={{
                    background: C.panelUp, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px",
                  }}>
                    <div className="mono" style={{ fontSize: 8.5, color: C.muted, letterSpacing: "0.1em", marginBottom: 4, textTransform: "uppercase" }}>{s.label}</div>
                    <div className="display" style={{ fontSize: 22, lineHeight: 1 }}>
                      {s.value}<span className="mono" style={{ fontSize: 9, color: C.muted, marginLeft: 3 }}>{s.unit}</span>
                    </div>
                    <div className="mono" style={{ fontSize: 7.5, color: v.color, letterSpacing: "0.08em", marginTop: 5, fontWeight: 700 }}>{v.label}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>
              {first} has not logged any stats yet. You can verify their numbers in person and they will appear here.
            </div>
          )}
        </div>
      )}

      <div ref={scrollRef} className="scroll" style={{
        flex: 1, overflowY: "auto", padding: "18px 16px",
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 30 }}>
            <Avatar initials={athlete.initials || "?"} size={64}/>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 14 }}>{athlete.name}</div>
            <div style={{ fontSize: 13, color: C.muted, maxWidth: 300, lineHeight: 1.5, marginTop: 6, marginBottom: 18 }}>
              Send {first} the first message. Tap a starter or write your own.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 340 }}>
              {QUICK_OPENERS.map((q, i) => (
                <button key={i} onClick={() => onReply(q)} className="body" style={{
                  background: C.accentDim, border: `1px solid ${C.accentBorder}`, color: C.accent,
                  padding: "11px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", textAlign: "left",
                }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(m => {
            const mine = m.from === "coach";
            return (
              <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "72%" }}>
                <div style={{
                  background: mine ? C.accent : C.panelUp,
                  color: mine ? "#04121D" : C.text,
                  border: mine ? "none" : `1px solid ${C.border}`,
                  borderRadius: 14, padding: "9px 14px", fontSize: 13.5, lineHeight: 1.45,
                  fontWeight: mine ? 600 : 400,
                }}>{m.text}</div>
                <div className="mono" style={{ fontSize: 8.5, color: C.faint, marginTop: 4, textAlign: mine ? "right" : "left", letterSpacing: "0.05em" }}>
                  {new Date(m.ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{
        padding: "12px 16px 18px", borderTop: `1px solid ${C.border}`,
        background: "rgba(8,13,20,0.95)", flexShrink: 0,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") send(); }}
          placeholder={`Message ${first}...`}
          className="body"
          style={{
            flex: 1, background: C.panelUp, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "11px 14px", color: C.text,
            fontSize: 13.5, outline: "none", minWidth: 0,
          }}
          onFocus={e => e.currentTarget.style.borderColor = C.accent}
          onBlur={e => e.currentTarget.style.borderColor = C.border}
        />
        <button onClick={send} disabled={!input.trim()} style={{
          width: 40, height: 40, borderRadius: 10,
          background: input.trim() ? C.accent : C.panelUp,
          border: input.trim() ? "none" : `1px solid ${C.border}`,
          color: input.trim() ? "#04121D" : C.faint,
          cursor: input.trim() ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Send size={15}/>
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   ROSTER
   ============================================================ */
function AthleteCard({ athlete: a, statusBadge, actionLabel, onAction, accentColor = C.accent }) {
  const accentDim = accentColor === C.green ? "rgba(52,211,153,0.1)" : C.accentDim;
  const accentBorder = accentColor === C.green ? "rgba(52,211,153,0.4)" : C.accentBorder;
  return (
    <div style={{
      background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <Avatar initials={a.initials || "?"} size={46} square color={accentColor}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{a.name}</span>
            {statusBadge}
          </div>
          <div className="mono" style={{ fontSize: 9, color: C.muted, letterSpacing: "0.05em", marginTop: 3 }}>
            {(a.sport || "").toUpperCase()}
            {a.position ? ` · ${a.position.toUpperCase()}` : ""}
            {a.age ? ` · AGE ${a.age}` : ""}
          </div>
          {a.city && (
            <div className="mono" style={{ fontSize: 9, color: C.faint, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
              <MapPin size={9}/>{a.city.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {a.stats && a.stats.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
          {a.stats.map((s, i) => {
            const v = VERIFY_META[s.verified] || VERIFY_META.self;
            return (
              <div key={i} style={{
                background: C.panelUp, border: `1px solid ${C.border}`, borderRadius: 9, padding: "8px 10px",
              }}>
                <div className="mono" style={{ fontSize: 8, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</div>
                <div className="display" style={{ fontSize: 19, lineHeight: 1, marginTop: 3 }}>
                  {s.value}<span className="mono" style={{ fontSize: 8.5, color: C.muted, marginLeft: 2 }}>{s.unit}</span>
                </div>
                <div className="mono" style={{ fontSize: 7, color: v.color, letterSpacing: "0.06em", marginTop: 3, fontWeight: 700 }}>{v.label}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          background: C.panelUp, border: `1px dashed ${C.border}`, borderRadius: 9,
          padding: "10px 12px", marginBottom: 12, fontSize: 11.5, color: C.muted, lineHeight: 1.4,
        }}>
          No stats logged yet. Verify their numbers at your next session.
        </div>
      )}

      <button onClick={onAction} className="body" style={{
        width: "100%", background: accentDim, border: `1px solid ${accentBorder}`,
        color: accentColor, padding: "9px 14px", borderRadius: 9, fontWeight: 700,
        fontSize: 12.5, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
      }}>
        <MessageCircle size={13}/> {actionLabel}
      </button>
    </div>
  );
}

function AthletesView({ threads, directory, onOpenThread, onStart }) {
  const myAthleteIds = new Set(threads.map(t => t.athlete?.id).filter(Boolean));
  const prospects = directory.filter(a => !myAthleteIds.has(a.id));

  return (
    <div style={{ padding: "28px 24px 48px", maxWidth: 920, margin: "0 auto" }}>
      <div className="display" style={{ fontSize: 32, lineHeight: 1, textTransform: "uppercase", marginBottom: 4 }}>
        ATHLETES
      </div>
      <div className="mono" style={{ fontSize: 10, color: C.muted, letterSpacing: "0.12em", marginBottom: 22 }}>
        {threads.length} TRAINING WITH YOU · {prospects.length} MORE ON COACHME
      </div>

      <SectionHead>TRAINING WITH YOU</SectionHead>
      {threads.length === 0 ? (
        <div style={{
          background: C.panel, border: `1px dashed ${C.border}`, borderRadius: 14,
          padding: 24, textAlign: "center", marginBottom: 26,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>No athletes training with you yet</div>
          <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5, maxWidth: 380, margin: "0 auto" }}>
            Message a kid from the list below to start coaching. Once you talk, they move up here.
          </div>
        </div>
      ) : (
        <div className="cc-roster" style={{ marginBottom: 26 }}>
          {threads.map(t => (
            <AthleteCard
              key={t.id}
              athlete={t.athlete || {}}
              statusBadge={
                <span className="mono" style={{
                  fontSize: 7.5, color: C.accent, background: C.accentDim,
                  border: `1px solid ${C.accentBorder}`, borderRadius: 5,
                  padding: "2px 6px", letterSpacing: "0.08em", fontWeight: 700,
                }}>YOUR ATHLETE</span>
              }
              actionLabel={`Open chat with ${athleteFirstName(t.athlete)}`}
              onAction={() => onOpenThread(t.id)}
            />
          ))}
        </div>
      )}

      <SectionHead>FIND NEW ATHLETES</SectionHead>
      {prospects.length === 0 ? (
        <div style={{
          background: C.panel, border: `1px dashed ${C.border}`, borderRadius: 14,
          padding: 24, textAlign: "center",
        }}>
          <div style={{
            width: 50, height: 50, borderRadius: 12, margin: "0 auto 12px",
            background: C.accentDim, border: `1px solid ${C.accentBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Users size={22} color={C.accent}/>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>No new athletes right now</div>
          <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5, maxWidth: 380, margin: "0 auto" }}>
            Every kid who signs up on CoachMe appears here so you can recruit them. Check back soon.
          </div>
        </div>
      ) : (
        <div className="cc-roster">
          {prospects.map(a => (
            <AthleteCard
              key={a.id}
              athlete={a}
              accentColor={C.green}
              statusBadge={
                <span className="mono" style={{
                  fontSize: 7.5, color: C.green, background: "rgba(52,211,153,0.1)",
                  border: "1px solid rgba(52,211,153,0.4)", borderRadius: 5,
                  padding: "2px 6px", letterSpacing: "0.08em", fontWeight: 700,
                }}>NEW ON COACHME</span>
              }
              actionLabel={`Message ${athleteFirstName(a)}`}
              onAction={() => onStart(a)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MY PROFILE
   ============================================================ */
function MyProfileView({ coach }) {
  return (
    <div style={{ padding: "28px 24px 48px", maxWidth: 720, margin: "0 auto" }}>
      <div className="display" style={{ fontSize: 32, lineHeight: 1, textTransform: "uppercase", marginBottom: 4 }}>
        MY PROFILE
      </div>
      <div className="mono" style={{ fontSize: 10, color: C.muted, letterSpacing: "0.12em", marginBottom: 22 }}>
        HOW ATHLETES SEE YOU
      </div>

      <div style={{
        background: C.amberDim, border: "1px solid rgba(245,158,11,0.4)", borderRadius: 12,
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 18,
      }}>
        <Clock size={16} color={C.amber} style={{ flexShrink: 0 }}/>
        <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.5 }}>
          <strong>Verification pending.</strong> We review every coach before their profile is marked verified. You can still message athletes who reach out.
        </div>
      </div>

      <div style={{
        background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 18,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <Avatar initials={coach.initials} size={58} square/>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{coach.name}</div>
            <div className="mono" style={{ fontSize: 10, color: C.muted, letterSpacing: "0.06em", marginTop: 3 }}>
              {(coach.specialty || "").toUpperCase()} · {(coach.sport || "").toUpperCase()}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <ProfileFact label="HOURLY RATE" value={coach.rate ? `$${coach.rate}/hr` : "Not set"}/>
          <ProfileFact label="EXPERIENCE" value={coach.years ? `${coach.years} years` : "Not set"}/>
          <ProfileFact label="LOCATION" value={coach.location || "Not set"}/>
          <ProfileFact label="BACKGROUND" value={coach.badge === "FORMER PRO" ? "Former pro / college" : "Coach"}/>
        </div>

        {Array.isArray(coach.modes) && coach.modes.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="mono" style={{ fontSize: 9, color: C.muted, letterSpacing: "0.14em", marginBottom: 7 }}>TRAINING MODES</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {coach.modes.map(m => (
                <span key={m} className="body" style={{
                  background: C.accentDim, border: `1px solid ${C.accentBorder}`, color: C.accent,
                  padding: "6px 12px", borderRadius: 8, fontSize: 11.5, fontWeight: 700,
                }}>{MODE_LABELS[m] || m}</span>
              ))}
            </div>
          </div>
        )}

        {coach.bio && (
          <div>
            <div className="mono" style={{ fontSize: 9, color: C.muted, letterSpacing: "0.14em", marginBottom: 7 }}>BIO</div>
            <div style={{ fontSize: 13.5, color: C.text, lineHeight: 1.6 }}>{coach.bio}</div>
          </div>
        )}
      </div>

      <div style={{
        background: C.panel, border: `1px dashed ${C.border}`, borderRadius: 12,
        padding: "14px 16px", fontSize: 12.5, color: C.muted, lineHeight: 1.55,
      }}>
        Profile editing, your calendar, and payout settings arrive with full coach accounts in Phase 1. For now, submit a new application at{" "}
        <a href="/become-a-coach" style={{ color: C.accent, textDecoration: "none", fontWeight: 700 }}>/become-a-coach</a>{" "}
        if something needs to change.
      </div>
    </div>
  );
}

function ProfileFact({ label, value }) {
  return (
    <div style={{ background: C.panelUp, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px" }}>
      <div className="mono" style={{ fontSize: 8.5, color: C.muted, letterSpacing: "0.12em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

/* ============================================================
   VIDEO CALL
   ============================================================ */
function CoachCallView({ athlete, onClose }) {
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 250, background: C.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Avatar initials={athlete.initials || "?"} size={150}/>
        <div className="display" style={{ fontSize: 30, marginTop: 22, textTransform: "uppercase", color: C.text }}>{athlete.name}</div>
        <div className="mono" style={{ fontSize: 11, color: C.accent, marginTop: 8, letterSpacing: "0.2em", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent }} className="pulse-dot"/>
          LIVE COACHING SESSION
        </div>
      </div>

      <div style={{ position: "absolute", top: 20, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, padding: "6px 14px", borderRadius: 999, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.red }} className="pulse-dot"/>
          <span className="mono" style={{ fontSize: 12, color: C.text, fontWeight: 700 }}>{fmt(duration)}</span>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 16px 36px", display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <CallBtn onClick={() => setMuted(!muted)} active={muted}>{muted ? <MicOff size={20}/> : <Mic size={20}/>}</CallBtn>
        <CallBtn onClick={() => setVideoOff(!videoOff)} active={videoOff}>{videoOff ? <VideoOff size={20}/> : <Video size={20}/>}</CallBtn>
        <button onClick={onClose} style={{
          width: 62, height: 62, borderRadius: "50%", background: C.red, border: "none",
          color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <PhoneOff size={24}/>
        </button>
        <CallBtn><Camera size={20}/></CallBtn>
        <CallBtn><MoreHorizontal size={20}/></CallBtn>
      </div>
    </div>
  );
}

function CallBtn({ children, onClick, active }) {
  return (
    <button onClick={onClick} style={{
      width: 50, height: 50, borderRadius: "50%",
      background: active ? C.text : C.panelUp,
      border: `1px solid ${C.border}`, color: active ? C.bg : C.text,
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    }}>{children}</button>
  );
}
