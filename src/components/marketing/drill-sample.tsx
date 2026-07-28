"use client";

// Tap-to-play drill sample for the landing page. Poster-first on
// purpose: the <video> element is not mounted until the visitor taps,
// so no video bytes download on page load (mobile-friendly, and the
// Phase 4 network assertion checks exactly this). Muted playback - the
// landing sample sells the motion, the app has the full clip with sound.

import { useState } from "react";
import Image from "next/image";
import { track } from "@vercel/analytics";

export function DrillSample({
  id,
  title,
  sport,
  posterUrl,
  videoUrl,
  coachName,
}: {
  id: string;
  title: string;
  sport: string;
  posterUrl: string;
  videoUrl: string;
  coachName: string;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure className="mk-drill">
      <div className="mk-drill-media">
        {playing ? (
          <video
            src={videoUrl}
            poster={posterUrl}
            autoPlay
            muted
            playsInline
            controls
            loop
            preload="auto"
            aria-label={`${title} drill demo, AI-generated clip`}
          />
        ) : (
          <button
            type="button"
            className="mk-drill-play"
            onClick={() => {
              setPlaying(true);
              track("landing_drill_play", { drill: id });
            }}
            aria-label={`Play the ${title} drill demo`}
          >
            <Image
              src={posterUrl}
              alt={`${title} drill demonstration frame from the AI-generated ${sport.toLowerCase()} coaching clip`}
              width={640}
              height={360}
              sizes="(min-width: 768px) 340px, 92vw"
            />
            <span className="mk-drill-play-btn" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>
      <figcaption className="mk-drill-cap">
        <span className="mk-drill-title display">{title}</span>
        <span className="mk-drill-meta mono">
          {sport} · {coachName} · <span className="mk-drill-ai">AI</span>
        </span>
      </figcaption>
    </figure>
  );
}
