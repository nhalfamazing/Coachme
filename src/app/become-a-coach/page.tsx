"use client";
/* eslint-disable @next/next/no-img-element, react/no-unknown-property */
// @ts-nocheck

import { useState, useId } from "react";
import { cloudUpsert } from "@/lib/cloud";
import { generateCoachCode } from "@/lib/codes";
import { ArrowRight, ChevronLeft, CheckCircle2 } from "lucide-react";

const SPORTS = [
  "Baseball", "Basketball", "Football", "Soccer",
  "Tennis", "Track", "Volleyball", "Wrestling",
];

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

const SPECIALTY_SUGGESTIONS = [
  'Hitting & plate discipline',
  'Pitching mechanics',
  'Catching & framing',
  'Fielding & infield work',
  'Outfield reads & routes',
  'Strength & conditioning',
  'Speed & agility training',
  'Mental performance',
  'Recovery & injury prevention',
  'Shooting form',
  'Ball handling',
  'Post moves',
  'Defensive footwork',
  'Quarterback mechanics',
  'Route running',
  'Offensive line technique',
  'Tackling & coverage',
  'Goalkeeping',
  'Finishing & shooting',
  'Passing & ball control',
  'Serve & return',
  'Sprint mechanics',
  'Distance & race strategy',
  'Throws technique',
  'Jumping technique',
  'Setting & passing',
  'Spike approach',
  'Takedowns & escapes',
  'Position-specific drills',
];

const MODES_OPTIONS = [
  { key: "in_person", label: "In person" },
  { key: "live_online", label: "Live online" },
  { key: "async", label: "Async (video review)" },
];

const COLORS = ["#FF6B3D", "#5DA9FF", "#C5FF3D", "#B17CFF", "#FF9BCD", "#FFB347"];

export default function BecomeACoachPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    sport: "", specialty: "", years: "",
    city: "", state: "FL",
    bio: "", rate: "",
    modes: [] as string[],
    formerPro: false,
  });
  const [error, setError] = useState("");
  const [submittedCoach, setSubmittedCoach] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // Their 3-word login code (sam-coach-tiger style), issued at signup
  // and stored on the profile forever.
  const coachCode = submittedCoach ? submittedCoach.code : null;

  const copyCode = async () => {
    if (!coachCode) return;
    try {
      await navigator.clipboard.writeText(coachCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2200);
    } catch {
      if (typeof window !== "undefined") window.prompt("Copy your coach login code:", coachCode);
    }
  };

  const upd = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const toggleMode = (key) => {
    setForm(f => ({
      ...f,
      modes: f.modes.includes(key) ? f.modes.filter(m => m !== key) : [...f.modes, key],
    }));
  };

  const submit = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return setError("Please enter your full name.");
    if (!form.email.trim() || !form.email.includes("@")) return setError("Please enter a valid email.");
    if (!form.sport) return setError("Please pick a sport.");
    if (!form.specialty.trim()) return setError("Please tell us your specialty.");
    if (!form.years || isNaN(parseInt(form.years))) return setError("How many years have you been coaching?");
    if (!form.city.trim()) return setError("Please enter your city.");
    if (!form.bio.trim() || form.bio.trim().length < 30) return setError("Please write a short bio (at least 30 characters).");
    if (!form.rate || isNaN(parseFloat(form.rate))) return setError("Please enter your hourly rate.");
    if (form.modes.length === 0) return setError("Please pick at least one training mode.");

    setError("");

    const initials = form.firstName[0].toUpperCase() + form.lastName[0].toUpperCase();
    const submission = {
      id: Date.now(),
      name: `${form.firstName.trim()} ${form.lastName.trim()}`,
      initials,
      photo: null,
      cover: null,
      title: form.specialty.trim(),
      sport: form.sport,
      years: parseInt(form.years),
      specialty: form.specialty.trim(),
      location: `${form.city.trim()}, ${form.state}`,
      rate: parseFloat(form.rate),
      rating: null,
      reviews: 0,
      athletes: 0,
      avgGain: null,
      commits: 0,
      modes: form.modes,
      badge: form.formerPro ? "FORMER PRO" : "NEW COACH",
      bio: form.bio.trim(),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      email: form.email.trim(),
      phone: form.phone.trim(),
      submittedAt: new Date().toISOString(),
      verified: false,
    };
    try {
      const others = JSON.parse(localStorage.getItem("coachme_coaches") || "[]");
      submission.code = generateCoachCode(submission, others.map(c => c && c.code));
    } catch {
      submission.code = generateCoachCode(submission);
    }

    try {
      const existing = JSON.parse(localStorage.getItem("coachme_coaches") || "[]");
      existing.push(submission);
      localStorage.setItem("coachme_coaches", JSON.stringify(existing));
    } catch (e) {
      console.error("Could not save coach submission:", e);
    }

    // Share with every device so athletes anywhere can find this coach.
    cloudUpsert("coaches", submission.id, submission);

    // Sign them straight in so the Console opens without the picker.
    try { sessionStorage.setItem("coachme_active_coach", JSON.stringify(submission)); } catch {}

    setSubmittedCoach(submission);
    setStep(1);
  };

  const pageStyles = `
    .display { font-family: var(--font-display), 'Bebas Neue', sans-serif; letter-spacing: 0.005em; }
    .body { font-family: var(--font-body), 'Manrope', system-ui, sans-serif; }
    .mono { font-family: var(--font-mono), 'JetBrains Mono', monospace; }
  `;

  if (step === 1) {
    return (
      <div className="body" style={{ background: "#000", minHeight: "100vh", color: "#F4F4F5" }}>
        <style>{pageStyles}</style>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 24px", textAlign: "center" }}>
          <div style={{
            width: 88, height: 88, borderRadius: "50%", background: "#C5FF3D",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px",
          }}>
            <CheckCircle2 size={48} color="#000" />
          </div>
          <div className="display" style={{ fontSize: 44, lineHeight: 1, marginBottom: 12, textTransform: "uppercase" }}>
            APPLICATION RECEIVED
          </div>
          <div style={{ fontSize: 15, color: "#9CA0A8", lineHeight: 1.6, marginBottom: 26, maxWidth: 440, margin: "0 auto 26px" }}>
            Thanks for applying to CoachMe, {form.firstName}. We review every coach personally. Expect a verification email at <strong style={{ color: "#F4F4F5" }}>{form.email}</strong> within 1-2 business days.
          </div>

          {coachCode && (
            <div style={{
              padding: "18px 20px", borderRadius: 14, textAlign: "left", marginBottom: 26,
              background: "rgba(197,255,61,0.07)", border: "1px solid rgba(197,255,61,0.45)",
            }}>
              <div className="mono" style={{ fontSize: 10.5, color: "#C5FF3D", letterSpacing: "0.18em", marginBottom: 6, fontWeight: 700 }}>
                YOUR 3-WORD LOGIN CODE - SAVE IT
              </div>
              <div style={{ fontSize: 13, color: "#D4D6DA", lineHeight: 1.55, marginBottom: 12 }}>
                These three words are how you log in to your coach console on this device or any other. Write them down or copy them, and keep them private.
              </div>
              <div className="mono" style={{
                background: "#0A0A0B", border: "1px solid rgba(197,255,61,0.4)",
                borderRadius: 10, padding: "12px 14px", marginBottom: 10,
                fontSize: 18, fontWeight: 700, color: "#C5FF3D", lineHeight: 1.5,
                wordBreak: "break-word", textAlign: "center", userSelect: "all",
              }}>
                {coachCode}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "stretch", flexWrap: "wrap" }}>
                <button onClick={copyCode} className="body" style={{
                  background: codeCopied ? "#34D399" : "#C5FF3D", color: "#000", border: "none",
                  padding: "10px 18px", borderRadius: 10, fontWeight: 700, fontSize: 13,
                  cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", gap: 7,
                  transition: "all 0.15s",
                }}>
                  {codeCopied ? (<><CheckCircle2 size={14}/> Copied!</>) : "Copy code"}
                </button>
              </div>
            </div>
          )}

          <div style={{
            display: "inline-block", padding: "16px 24px", borderRadius: 12,
            background: "#18181C", border: "1px solid #2A2A30", textAlign: "left", marginBottom: 30,
          }}>
            <div className="mono" style={{ fontSize: 10, color: "#5F636B", letterSpacing: "0.15em", marginBottom: 12 }}>
              WHAT HAPPENS NEXT
            </div>
            <div style={{ fontSize: 13, color: "#D4D6DA", lineHeight: 1.7 }}>
              1. Save your login code above<br />
              2. We verify your coaching background<br />
              3. Athletes in {form.sport.toLowerCase()} start finding you
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/coach" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#C5FF3D", color: "#000", padding: "12px 22px",
              borderRadius: 999, fontWeight: 700, fontSize: 14, textDecoration: "none",
            }}>
              Go to my coach dashboard <ArrowRight size={14} />
            </a>
            <a href="/" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "transparent", color: "#F4F4F5", padding: "12px 22px",
              borderRadius: 999, fontWeight: 600, fontSize: 14, textDecoration: "none",
              border: "1px solid #3A3A42",
            }}>
              See the athlete app
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="body" style={{ background: "#000", minHeight: "100vh", color: "#F4F4F5" }}>
      <style>{pageStyles}</style>

      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1F1F25",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/" style={{
            color: "#9CA0A8", textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
            fontSize: 13,
          }} className="mono">
            <ChevronLeft size={16} /> BACK
          </a>
          <span className="mono" style={{ fontSize: 11, color: "#5F636B", letterSpacing: "0.15em" }}>
            COACHME &middot; FOR COACHES
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div className="display" style={{ fontSize: 56, lineHeight: 0.95, marginBottom: 14, textTransform: "uppercase" }}>
          JOIN COACHME<br/>
          <span style={{ color: "#C5FF3D" }}>AS A COACH.</span>
        </div>
        <div style={{ fontSize: 15, color: "#9CA0A8", lineHeight: 1.6, marginBottom: 36, maxWidth: 560 }}>
          We're building a platform where verified coaches train emerging athletes. Tell us about your coaching and we'll verify your background before your profile goes live.
        </div>

        <Section label="ABOUT YOU">
          <Row>
            <Field label="FIRST NAME *">
              <Input value={form.firstName} onChange={v => upd("firstName", v)} placeholder="Mike" />
            </Field>
            <Field label="LAST NAME *">
              <Input value={form.lastName} onChange={v => upd("lastName", v)} placeholder="Torres" />
            </Field>
          </Row>
          <Row>
            <Field label="EMAIL *">
              <Input type="email" value={form.email} onChange={v => upd("email", v)} placeholder="you@example.com" />
            </Field>
            <Field label="PHONE (OPTIONAL)">
              <Input type="tel" value={form.phone} onChange={v => upd("phone", v)} placeholder="555 123 4567" />
            </Field>
          </Row>
        </Section>

        <Section label="YOUR COACHING">
          <Field label="SPORT *">
            <Select value={form.sport} onChange={v => upd("sport", v)} options={SPORTS} placeholder="Pick a sport" />
          </Field>
          <Field label="WHAT'S YOUR SPECIALTY? *" hint="Pick from the list or type your own.">
            <Autocomplete value={form.specialty} onChange={v => upd("specialty", v)} options={SPECIALTY_SUGGESTIONS} placeholder="Hitting & plate discipline" />
          </Field>
          <Row>
            <Field label="YEARS COACHING *">
              <Input type="number" value={form.years} onChange={v => upd("years", v)} placeholder="5" />
            </Field>
            <Field label="HOURLY RATE (USD) *">
              <Input type="number" value={form.rate} onChange={v => upd("rate", v)} placeholder="65" />
            </Field>
          </Row>
          <Field label="HOW DO YOU TRAIN? *" hint="Pick all that apply.">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {MODES_OPTIONS.map(m => (
                <Chip key={m.key} active={form.modes.includes(m.key)} onClick={() => toggleMode(m.key)}>{m.label}</Chip>
              ))}
            </div>
          </Field>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginTop: 6 }}>
            <input
              type="checkbox" checked={form.formerPro}
              onChange={e => upd("formerPro", e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "#C5FF3D" }}
            />
            <span style={{ fontSize: 14, color: "#D4D6DA" }}>
              I played professionally or at the collegiate level.
            </span>
          </label>
        </Section>

        <Section label="WHERE YOU TRAIN">
          <Row>
            <Field label="CITY *">
              <Autocomplete value={form.city} onChange={v => upd("city", v)} options={CITY_SUGGESTIONS} placeholder="Start typing your city" />
            </Field>
            <Field label="STATE *">
              <Select value={form.state} onChange={v => upd("state", v)} options={US_STATES} />
            </Field>
          </Row>
        </Section>

        <Section label="YOUR STORY">
          <Field label="BIO *" hint="2-4 sentences. Tell athletes about your background and how you train. This becomes your public profile.">
            <textarea
              value={form.bio} onChange={e => upd("bio", e.target.value)}
              placeholder="Six seasons in AAA before moving into coaching. I specialize in catchers: pop time, framing, and game-calling. I work with players ages 12-18 who want to play at the next level."
              rows={5}
              style={{ ...inputStyle, resize: "vertical", minHeight: 110, fontFamily: "inherit" }}
            />
          </Field>
        </Section>

        {error && (
          <div style={{
            padding: "12px 14px", borderRadius: 10, marginBottom: 16,
            background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.4)",
            color: "#FF8888", fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <button onClick={submit} className="body" style={{
          background: "#C5FF3D", color: "#000", border: "none",
          padding: "16px 28px", borderRadius: 999,
          fontWeight: 700, fontSize: 15, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 8,
        }}>
          Submit application <ArrowRight size={16} />
        </button>

        <div style={{ marginTop: 24, fontSize: 12, color: "#5F636B", lineHeight: 1.6 }}>
          By submitting, you confirm the information above is accurate and that you consent to being listed on CoachMe after verification. We never list anyone who hasn't applied.
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FORM UI BITS
   ============================================================ */
const inputStyle = {
  width: "100%", background: "#18181C", border: "1px solid #2A2A30",
  borderRadius: 10, padding: "12px 14px", color: "#F4F4F5",
  fontSize: 15, outline: "none", fontFamily: "inherit",
};

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div className="mono" style={{
        fontSize: 11, color: "#5F636B", letterSpacing: "0.18em",
        marginBottom: 18, display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ width: 16, height: 1, background: "#C5FF3D" }}/>
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

function Row({ children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="mono" style={{
        fontSize: 10.5, color: "#9CA0A8", letterSpacing: "0.12em",
        marginBottom: 8, textTransform: "uppercase",
      }}>
        {label}
      </div>
      {children}
      {hint && (
        <div style={{ fontSize: 11.5, color: "#5F636B", marginTop: 6, lineHeight: 1.5 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={inputStyle}
      onFocus={e => e.currentTarget.style.borderColor = "#C5FF3D"}
      onBlur={e => e.currentTarget.style.borderColor = "#2A2A30"}
    />
  );
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          ...inputStyle,
          paddingRight: 40,
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          cursor: "pointer",
          color: value ? "#F4F4F5" : "#5F636B",
        }}
        onFocus={e => e.currentTarget.style.borderColor = "#C5FF3D"}
        onBlur={e => e.currentTarget.style.borderColor = "#2A2A30"}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => {
          const value = typeof opt === "string" ? opt : opt.value;
          const label = typeof opt === "string" ? opt : opt.label;
          return <option key={value} value={value} style={{ background: "#18181C", color: "#F4F4F5" }}>{label}</option>;
        })}
      </select>
      <span style={{
        position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
        pointerEvents: "none", color: "#9CA0A8", fontSize: 12,
      }}>▾</span>
    </div>
  );
}

function Autocomplete({ value, onChange, options, placeholder }) {
  // useId gives a stable id that matches between server render and client
  // hydration. Math.random() here caused a hydration mismatch.
  const listId = `dl-${useId()}`;
  return (
    <>
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} list={listId}
        style={inputStyle}
        onFocus={e => e.currentTarget.style.borderColor = "#C5FF3D"}
        onBlur={e => e.currentTarget.style.borderColor = "#2A2A30"}
      />
      <datalist id={listId}>
        {options.map(opt => <option key={opt} value={opt} />)}
      </datalist>
    </>
  );
}

function Chip({ children, active, onClick }) {
  return (
    <button onClick={onClick} type="button" style={{
      padding: "8px 14px", borderRadius: 999,
      background: active ? "rgba(197,255,61,0.12)" : "#18181C",
      border: active ? "1px solid #C5FF3D" : "1px solid #2A2A30",
      color: active ? "#C5FF3D" : "#D4D6DA",
      fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
      transition: "all 0.15s",
    }}>{children}</button>
  );
}
