import { ImageResponse } from "next/og";

export const alt = "CoachMe - The performance graph for emerging athletes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0A0A0B",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "70px",
              height: "70px",
              borderRadius: "16px",
              background: "#0A0A0B",
              border: "2px solid #C5FF3D",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="50" height="50" viewBox="0 0 32 32">
              <path
                d="M22 11.5a6.5 6.5 0 1 0 0 9"
                stroke="#C5FF3D"
                strokeWidth="3.6"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
          <div
            style={{
              color: "#C5FF3D",
              fontSize: "26px",
              fontWeight: 700,
              letterSpacing: "0.18em",
            }}
          >
            COACHME
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            color: "#F4F4F5",
            fontSize: "110px",
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
            marginBottom: "32px",
          }}
        >
          <span>PROVE YOUR</span>
          <span style={{ color: "#C5FF3D" }}>GAME.</span>
        </div>
        <div
          style={{
            color: "#9CA0A8",
            fontSize: "30px",
            lineHeight: 1.3,
            maxWidth: "900px",
          }}
        >
          The performance graph for emerging athletes. Find a real coach.
          Track every PR. Climb the ranks.
        </div>
      </div>
    ),
    { ...size }
  );
}
