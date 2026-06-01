"use client";
/* eslint-disable @next/next/no-img-element, react/no-unknown-property */
// @ts-nocheck

import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft, Send, Video, Mic, MicOff, VideoOff, PhoneOff, Camera,
  MoreHorizontal, MessageCircle, Inbox, Users, ArrowRight, X,
} from "lucide-react";

/* ----- shared store helpers (same 'coachme_threads' the athlete app uses) ----- */
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

const VERIFY_META = {
  event: { label: "EVENT", color: "#C5FF3D" },
  facility: { label: "FACILITY", color: "#5DA9FF" },
  trainer: { label: "TRAINER", color: "#FF9BCD" },
  self: { label: "SELF", color: "#5F636B" },
};

const pageStyles = `
  .display { font-family: var(--font-display), 'Bebas Neue', sans-serif; letter-spacing: 0.005em; }
  .body { font-family: var(--font-body), 'Manrope', system-ui, sans-serif; }
  .mono { font-family: var(--font-mono), 'JetBrains Mono', monospace; }
  .scroll::-webkit-scrollbar { display: none; }
  .scroll { -ms-overflow-style: none; scrollbar-width: none; }
  @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }
  .pulse-dot { animation: pulseDot 1.8s infinite; }
`;

function Avatar({ initials, size = 44, color = "#C5FF3D", square = false }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: square ? Math.max(10, size * 0.22) : "50%",
      background: `linear-gradient(135deg, ${color}30 0%, ${color}10 100%)`,
      border: `1px solid ${color}50`, display: "flex", alignItems: "center",
      justifyContent: "center", flexShrink: 0,
    }}>
      <span className="display" style={{ fontSize: size * 0.42, color, lineHeight: 1 }}>{initials}</span>
    </div>
  );
}

export default function CoachDashboard() {
  const [coach, setCoachState] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [threads, setThreads] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [callOpen, setCallOpen] = useState(false);
  const [ready, setReady] = useState(false);

  // Persist coach selection across refresh (sessionStorage so it's per-tab,
  // not leaked across browser sessions). Real auth lands in Phase 1.
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
    try {
      const savedRaw = sessionStorage.getItem("coachme_active_coach");
      if (savedRaw) {
        const saved = JSON.parse(savedRaw);
        // Re-resolve from the latest stored coach (in case profile got updated)
        const fresh = allCoaches.find(c => c.id === saved.id);
        if (fresh) setCoachState(fresh);
        else if (saved && saved.id) setCoachState(saved);
      }
    } catch {}
    setReady(true);
  }, []);

  // Live sync: athlete sends a message in another tab -> refresh.
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "coachme_threads") setThreads(loadThreads());
      if (e.key === "coachme_coaches") setCoaches(loadCoaches());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const refresh = () => setThreads(loadThreads());

  const myThreads = coach
    ? threads.filter(t => t.coachId === coach.id).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    : [];
  const openThread = myThreads.find(t => t.id === openId);

  const reply = (text) => {
    if (!openThread) return;
    pushCoachReply(openThread.id, text);
    refresh();
  };

  return (
    <div className="body" style={{ background: "#0A0A0B", minHeight: "100vh", color: "#F4F4F5" }}>
      <style>{pageStyles}</style>

      {!ready ? null : !coach ? (
        <CoachPicker coaches={coaches} onSelect={setCoach} />
      ) : openThread ? (
        <ConversationView
          coach={coach}
          thread={openThread}
          onBack={() => setOpenId(null)}
          onReply={reply}
          onCall={() => setCallOpen(true)}
        />
      ) : (
        <Dashboard
          coach={coach}
          threads={myThreads}
          onOpen={setOpenId}
          onSwitch={() => setCoach(null)}
        />
      )}

      {callOpen && openThread && (
        <CoachCallView athlete={openThread.athlete} onClose={() => setCallOpen(false)} />
      )}
    </div>
  );
}

/* ----- Coach picker (no real auth: pick which signed-up coach you are) ----- */
function CoachPicker({ coaches, onSelect }) {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px" }}>
      <div className="mono" style={{ fontSize: 11, color: "#5F636B", letterSpacing: "0.18em", marginBottom: 14 }}>
        COACHME · COACH DASHBOARD
      </div>
      <div className="display" style={{ fontSize: 44, lineHeight: 0.95, textTransform: "uppercase", marginBottom: 12 }}>
        WELCOME,<br /><span style={{ color: "#C5FF3D" }}>COACH.</span>
      </div>
      <div className="body" style={{ fontSize: 14, color: "#9CA0A8", lineHeight: 1.6, marginBottom: 32 }}>
        This is where you manage the athletes you train: read and answer their messages, jump on a video call, and see their stats.
      </div>

      {coaches.length === 0 ? (
        <div style={{
          padding: 24, borderRadius: 16, background: "#18181C",
          border: "1px dashed #2A2A30", textAlign: "center",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, margin: "0 auto 16px",
            background: "rgba(197,255,61,0.1)", border: "1px solid rgba(197,255,61,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Users size={28} color="#C5FF3D" />
          </div>
          <div className="display" style={{ fontSize: 22, marginBottom: 8, textTransform: "uppercase" }}>NO COACH ACCOUNTS YET</div>
          <div className="body" style={{ fontSize: 13, color: "#9CA0A8", lineHeight: 1.5, marginBottom: 20 }}>
            Apply as a coach first. Once you submit the form, your dashboard shows up here.
          </div>
          <a href="/become-a-coach" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#C5FF3D", color: "#000", padding: "12px 22px",
            borderRadius: 999, fontWeight: 700, fontSize: 14, textDecoration: "none",
          }}>
            Apply as a coach <ArrowRight size={14} />
          </a>
        </div>
      ) : (
        <>
          <div className="mono" style={{ fontSize: 10.5, color: "#9CA0A8", letterSpacing: "0.12em", marginBottom: 12 }}>
            SELECT YOUR COACH PROFILE
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {coaches.map(c => (
              <button key={c.id} onClick={() => onSelect(c)} style={{
                width: "100%", textAlign: "left", cursor: "pointer",
                background: "linear-gradient(160deg, #1A1A20 0%, #0F0F14 100%)",
                border: "1px solid #2A2A30", borderRadius: 14, padding: 14,
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <Avatar initials={c.initials} size={48} color={c.color || "#C5FF3D"} square />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="display" style={{ fontSize: 19, lineHeight: 1, textTransform: "uppercase" }}>{c.name}</div>
                  <div className="mono" style={{ fontSize: 10, color: "#9CA0A8", marginTop: 4, letterSpacing: "0.05em" }}>
                    {(c.specialty || c.title || "").toUpperCase()} · {(c.sport || "").toUpperCase()}
                  </div>
                </div>
                <ArrowRight size={18} color="#5F636B" />
              </button>
            ))}
          </div>
          <div className="body" style={{ fontSize: 11, color: "#5F636B", marginTop: 18, lineHeight: 1.5 }}>
            No password needed in this preview. Real coach login with secure auth comes with the Phase 1 backend.
          </div>
        </>
      )}
    </div>
  );
}

/* ----- Dashboard: athlete inbox ----- */
function Dashboard({ coach, threads, onOpen, onSwitch }) {
  const totalUnreadAthletes = threads.length;
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{
        position: "sticky", top: 0, zIndex: 10, background: "rgba(10,10,11,0.9)",
        backdropFilter: "blur(12px)", borderBottom: "1px solid #1F1F25",
        padding: "16px 20px", display: "flex", alignItems: "center", gap: 12,
      }}>
        <Avatar initials={coach.initials} size={40} color={coach.color || "#C5FF3D"} square />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="display" style={{ fontSize: 18, lineHeight: 1, textTransform: "uppercase" }}>{coach.name}</div>
          <div className="mono" style={{ fontSize: 9.5, color: "#9CA0A8", marginTop: 3, letterSpacing: "0.06em" }}>
            COACH · {(coach.sport || "").toUpperCase()}
          </div>
        </div>
        <button onClick={onSwitch} className="mono" style={{
          background: "#18181C", border: "1px solid #2A2A30", color: "#9CA0A8",
          padding: "6px 12px", borderRadius: 999, fontSize: 10, letterSpacing: "0.1em",
          cursor: "pointer", fontWeight: 700,
        }}>SWITCH</button>
      </div>

      <div style={{ padding: "20px 20px 8px" }}>
        <div className="display" style={{ fontSize: 34, lineHeight: 1, marginBottom: 4 }}>
          YOUR <span style={{ color: "#C5FF3D" }}>ATHLETES</span>
        </div>
        <div className="mono" style={{ fontSize: 11, color: "#9CA0A8", letterSpacing: "0.08em" }}>
          {totalUnreadAthletes} ACTIVE CONVERSATION{totalUnreadAthletes !== 1 ? "S" : ""}
        </div>
      </div>

      {threads.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18, margin: "0 auto 16px",
            background: "rgba(197,255,61,0.1)", border: "1px solid rgba(197,255,61,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Inbox size={30} color="#C5FF3D" />
          </div>
          <div className="display" style={{ fontSize: 24, marginBottom: 8, textTransform: "uppercase" }}>NO ATHLETES YET</div>
          <div className="body" style={{ fontSize: 13, color: "#9CA0A8", lineHeight: 1.5, maxWidth: 320, margin: "0 auto" }}>
            When an athlete messages you in the CoachMe app, the conversation shows up here. Their stats and call options come with it.
          </div>
        </div>
      ) : (
        <div style={{ padding: "12px 12px" }}>
          {threads.map(t => {
            const last = t.messages[t.messages.length - 1];
            const lastFromAthlete = last && last.from === "athlete";
            return (
              <button key={t.id} onClick={() => onOpen(t.id)} style={{
                width: "100%", textAlign: "left", cursor: "pointer",
                background: "transparent", border: "none", borderRadius: 14, padding: 12,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <Avatar initials={t.athlete?.initials || "?"} size={50} color="#C5FF3D" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div className="display" style={{ fontSize: 18, lineHeight: 1, textTransform: "uppercase" }}>{t.athlete?.name}</div>
                    <span className="mono" style={{ fontSize: 9, color: "#5F636B" }}>{timeAgo(last?.ts)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {lastFromAthlete && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#C5FF3D", flexShrink: 0 }} />}
                    <span className="body" style={{
                      fontSize: 13, color: lastFromAthlete ? "#F4F4F5" : "#9CA0A8",
                      fontWeight: lastFromAthlete ? 600 : 400,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {last ? (last.from === "coach" ? "You: " : "") + last.text : "No messages"}
                    </span>
                  </div>
                  <div className="mono" style={{ fontSize: 9, color: "#5F636B", marginTop: 4, letterSpacing: "0.05em" }}>
                    {(t.athlete?.sport || "").toUpperCase()}
                    {t.athlete?.position ? ` · ${t.athlete.position.toUpperCase()}` : ""}
                    {t.athlete?.age ? ` · AGE ${t.athlete.age}` : ""}
                  </div>
                </div>
                <MessageCircle size={18} color="#5F636B" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ----- Conversation: messages + reply + athlete stats ----- */
function ConversationView({ coach, thread, onBack, onReply, onCall }) {
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

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "14px 12px",
        borderBottom: "1px solid #1F1F25", background: "rgba(10,10,11,0.95)",
        backdropFilter: "blur(12px)", flexShrink: 0,
      }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#F4F4F5", cursor: "pointer", display: "flex" }}>
          <ChevronLeft size={22} />
        </button>
        <button onClick={() => setShowStats(s => !s)} style={{
          flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10,
          background: "none", border: "none", cursor: "pointer", textAlign: "left",
        }}>
          <Avatar initials={athlete.initials || "?"} size={36} color="#C5FF3D" />
          <div style={{ minWidth: 0 }}>
            <div className="display" style={{ fontSize: 16, lineHeight: 1, textTransform: "uppercase", color: "#F4F4F5" }}>{athlete.name}</div>
            <div className="mono" style={{ fontSize: 9, color: "#9CA0A8", marginTop: 3, letterSpacing: "0.06em" }}>
              {(athlete.sport || "").toUpperCase()}{athlete.position ? ` · ${athlete.position.toUpperCase()}` : ""} · TAP FOR STATS
            </div>
          </div>
        </button>
        <button onClick={onCall} style={{
          background: "#C5FF3D", border: "none", color: "#000", cursor: "pointer",
          width: 36, height: 36, borderRadius: "50%", display: "flex",
          alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Video size={16} />
        </button>
      </div>

      {/* Athlete stats panel (toggle) */}
      {showStats && (
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #1F1F25", background: "#0F0F14" }}>
          <div className="mono" style={{ fontSize: 10, color: "#5F636B", letterSpacing: "0.15em", marginBottom: 10 }}>
            ATHLETE STATS · {(athlete.city || "").toUpperCase()}{athlete.age ? ` · AGE ${athlete.age}` : ""}
          </div>
          {athlete.stats && athlete.stats.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {athlete.stats.map((s, i) => {
                const v = VERIFY_META[s.verified] || VERIFY_META.self;
                return (
                  <div key={i} style={{
                    background: "linear-gradient(160deg, #1A1A20 0%, #0F0F14 100%)",
                    border: "1px solid #2A2A30", borderRadius: 12, padding: "12px 12px",
                  }}>
                    <div className="mono" style={{ fontSize: 9, color: "#5F636B", letterSpacing: "0.1em", marginBottom: 5, textTransform: "uppercase" }}>{s.label}</div>
                    <div className="display" style={{ fontSize: 26, lineHeight: 1 }}>
                      {s.value}<span className="mono" style={{ fontSize: 10, color: "#9CA0A8", marginLeft: 3 }}>{s.unit}</span>
                    </div>
                    <div className="mono" style={{ fontSize: 8.5, color: v.color, letterSpacing: "0.1em", marginTop: 6, fontWeight: 700 }}>{v.label}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="body" style={{ fontSize: 12.5, color: "#9CA0A8", lineHeight: 1.5 }}>
              This athlete hasn't logged any stats yet. You can verify their numbers in person and they'll appear here.
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="scroll" style={{ flex: 1, overflow: "auto", padding: "16px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 40 }}>
            <div className="body" style={{ fontSize: 13, color: "#9CA0A8", maxWidth: 260, lineHeight: 1.5 }}>
              No messages yet. Say hi to {athlete.name?.split(" ")[0]} and start coaching.
            </div>
          </div>
        ) : (
          messages.map(m => {
            const mine = m.from === "coach";
            return (
              <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "78%" }}>
                <div className="body" style={{
                  background: mine ? "#C5FF3D" : "#18181C",
                  color: mine ? "#000" : "#F4F4F5",
                  border: mine ? "none" : "1px solid #2A2A30",
                  borderRadius: 18, padding: "9px 14px", fontSize: 14, lineHeight: 1.4,
                  fontWeight: mine ? 600 : 400,
                }}>{m.text}</div>
                <div className="mono" style={{ fontSize: 9, color: "#5F636B", marginTop: 4, textAlign: mine ? "right" : "left", letterSpacing: "0.05em" }}>
                  {new Date(m.ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reply box */}
      <div style={{
        padding: "10px 12px 16px", borderTop: "1px solid #1F1F25",
        background: "rgba(10,10,11,0.95)", flexShrink: 0,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") send(); }}
          placeholder={`Message ${athlete.name?.split(" ")[0] || "athlete"}...`}
          className="body"
          style={{
            flex: 1, background: "#18181C", border: "1px solid #2A2A30",
            borderRadius: 999, padding: "10px 16px", color: "#F4F4F5",
            fontSize: 14, outline: "none", minWidth: 0,
          }}
        />
        <button onClick={send} disabled={!input.trim()} style={{
          width: 38, height: 38, borderRadius: "50%",
          background: input.trim() ? "#C5FF3D" : "#18181C",
          border: input.trim() ? "none" : "1px solid #2A2A30",
          color: input.trim() ? "#000" : "#5F636B",
          cursor: input.trim() ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

/* ----- Coach-side video call ----- */
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
    <div style={{ position: "fixed", inset: 0, zIndex: 250, background: "#000", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Avatar initials={athlete.initials || "?"} size={150} color="#C5FF3D" />
        <div className="display" style={{ fontSize: 30, marginTop: 22, textTransform: "uppercase", color: "#fff" }}>{athlete.name}</div>
        <div className="mono" style={{ fontSize: 11, color: "#C5FF3D", marginTop: 8, letterSpacing: "0.2em", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#C5FF3D" }} className="pulse-dot" />
          LIVE COACHING SESSION
        </div>
      </div>

      <div style={{ position: "absolute", top: 20, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", padding: "6px 14px", borderRadius: 999, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF4444" }} className="pulse-dot" />
          <span className="mono" style={{ fontSize: 12, color: "#fff", fontWeight: 700 }}>{fmt(duration)}</span>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 16px 36px", display: "flex", alignItems: "center", justifyContent: "center", gap: 18, background: "linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)" }}>
        <CallBtn onClick={() => setMuted(!muted)} active={muted}>{muted ? <MicOff size={22} /> : <Mic size={22} />}</CallBtn>
        <CallBtn onClick={() => setVideoOff(!videoOff)} active={videoOff}>{videoOff ? <VideoOff size={22} /> : <Video size={22} />}</CallBtn>
        <button onClick={onClose} style={{ width: 64, height: 64, borderRadius: "50%", background: "#FF4444", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <PhoneOff size={26} />
        </button>
        <CallBtn><Camera size={22} /></CallBtn>
        <CallBtn><MoreHorizontal size={22} /></CallBtn>
      </div>
    </div>
  );
}

function CallBtn({ children, onClick, active }) {
  return (
    <button onClick={onClick} style={{
      width: 52, height: 52, borderRadius: "50%",
      background: active ? "#fff" : "rgba(255,255,255,0.15)",
      border: "1px solid rgba(255,255,255,0.1)", color: active ? "#000" : "#fff",
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    }}>{children}</button>
  );
}
