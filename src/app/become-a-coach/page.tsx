"use client";
/* eslint-disable @next/next/no-img-element, react/no-unknown-property */
// @ts-nocheck

import { useState } from "react";
import { ArrowRight, ChevronLeft, CheckCircle2 } from "lucide-react";

const SPORTS = [
  "Baseball", "Basketball", "Football", "Soccer",
  "Tennis", "Track", "Volleyball", "Wrestling",
];

const US_STATES = ['FL', 'CA', 'TX', 'NY', 'GA', 'NC', 'PA', 'OH', 'IL', 'MI', 'WA', 'AZ', 'CO', 'MA', 'NJ', 'VA'];

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
      const existing = JSON.parse(localStorage.getItem("coachme_coaches") || "[]");
      existing.push(submission);
      localStorage.setItem("coachme_coaches", JSON.stringify(existing));
    } catch (e) {
      console.error("Could not save coach submission:", e);
    }

    setStep(1);
  };

  const pageStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
    .display { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.005em; }
    .body { font-family: 'Manrope', system-ui, sans-serif; }
    .mono { font-family: 'JetBrains Mono', monospace; }
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
          <div style={{ fontSize: 15, color: "#9CA0A8", lineHeight: 1.6, marginBottom: 30, maxWidth: 440, margin: "0 auto 30px" }}>
            Thanks for applying to CoachMe, {form.firstName}. We review every coach personally. Expect a verification email at <strong style={{ color: "#F4F4F5" }}>{form.email}</strong> within 1-2 business days.
          </div>
          <div style={{
            display: "inline-block", padding: "16px 24px", borderRadius: 12,
            background: "#18181C", border: "1px solid #2A2A30", textAlign: "left", marginBottom: 30,
          }}>
            <div className="mono" style={{ fontSize: 10, color: "#5F636B", letterSpacing: "0.15em", marginBottom: 12 }}>
              WHAT HAPPENS NEXT
            </div>
            <div style={{ fontSize: 13, color: "#D4D6DA", lineHeight: 1.7 }}>
              1. We verify your coaching background<br />
              2. You set up your full profile and calendar<br />
              3. Athletes in {form.sport.toLowerCase()} start finding you
            </div>
          </div>
          <div>
            <a href="/" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#C5FF3D", color: "#000", padding: "12px 22px",
              borderRadius: 999, fontWeight: 700, fontSize: 14, textDecoration: "none",
            }}>
              See the athlete app <ArrowRight size={14} />
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
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SPORTS.map(s => (
                <Chip key={s} active={form.sport === s} onClick={() => upd("sport", s)}>{s}</Chip>
              ))}
            </div>
          </Field>
          <Field label="WHAT'S YOUR SPECIALTY? *" hint="One short phrase. Example: 'Hitting & plate discipline', 'Pitching mechanics', 'Strength & conditioning'.">
            <Input value={form.specialty} onChange={v => upd("specialty", v)} placeholder="Hitting & plate discipline" />
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
              <Input value={form.city} onChange={v => upd("city", v)} placeholder="Miami" />
            </Field>
            <Field label="STATE *">
              <select value={form.state} onChange={e => upd("state", e.target.value)}
                style={inputStyle}>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </Row>
        </Section>

        <Section label="YOUR STORY">
          <Field label="BIO *" hint="2-4 sentences. Tell athletes about your background and how you train. This becomes your public profile.">
            <textarea
              value={form.bio} onChange={e => upd("bio", e.target.value)}
              placeholder="Six seasons in AAA before moving into coaching. I specialize in catchers — pop time, framing, and game-calling. I work with players ages 12-18 who want to play at the next level."
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
