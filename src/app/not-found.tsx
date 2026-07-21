"use client";

import { useEffect } from "react";

// Any URL that doesn't exist sends people to the landing page, so nobody
// ever gets stranded on a broken or outdated link.
export default function NotFound() {
  useEffect(() => {
    const t = setTimeout(() => {
      window.location.href = "/";
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#0A0A0B",
        color: "#F4F4F5",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 24,
        fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display), 'Bebas Neue', sans-serif",
          fontSize: 56,
          lineHeight: 1,
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        WRONG <span style={{ color: "#C5FF3D" }}>PLAY</span>.
      </div>
      <p style={{ fontSize: 14, color: "#9CA0A8", lineHeight: 1.6, maxWidth: 320, marginBottom: 24 }}>
        That page does not exist. Taking you back to CoachMe home in a few seconds.
      </p>
      <a
        href="/"
        style={{
          background: "#C5FF3D",
          color: "#000",
          padding: "14px 26px",
          borderRadius: 999,
          fontWeight: 700,
          fontSize: 14,
          textDecoration: "none",
        }}
      >
        Go to CoachMe home now
      </a>
    </main>
  );
}
