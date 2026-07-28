"use client";

// Autoplaying muted drill demo inside the hero phone mockup.
//
// - muted is set BOTH as a JSX attribute and on the DOM node: React can
//   drop the property during hydration and iOS refuses autoplay without
//   the DOM property being true.
// - src is assigned on mount, not in the server HTML, so the poster
//   paints first and the clip never competes with LCP.
// - Source choice: ~0.4 MB 480p VP8 WebM when the browser can play it,
//   else the original H.264 mp4 (~6 MB) - older iOS has no VP8 file
//   playback.
// - If play() rejects (iOS Low Power Mode, data saver - OS-level blocks
//   we cannot override), show a subtle play glyph and retry on the
//   user's first touch/scroll/click anywhere; listeners are removed
//   after the first successful play.
// - No prefers-reduced-motion gate: explicit product decision.

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export function HeroVideo({
  webmUrl,
  mp4Url,
  posterUrl,
}: {
  webmUrl: string;
  mp4Url: string;
  posterUrl: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.muted = true;
    const canWebm = el.canPlayType('video/webm; codecs="vp8"') !== "";
    el.src = canWebm ? webmUrl : mp4Url;

    let removed = false;
    const removeRetries = () => {
      if (removed) return;
      removed = true;
      window.removeEventListener("touchstart", retry);
      window.removeEventListener("scroll", retry);
      window.removeEventListener("click", retry);
    };
    function retry() {
      const v = ref.current;
      if (!v) return;
      v.muted = true;
      v.play().then(() => {
        setBlocked(false);
        removeRetries();
      }).catch(() => { /* still blocked; listeners stay armed */ });
    }
    el.play().then(() => setBlocked(false)).catch(() => {
      setBlocked(true);
      window.addEventListener("touchstart", retry, { passive: true });
      window.addEventListener("scroll", retry, { passive: true });
      window.addEventListener("click", retry);
    });
    return removeRetries;
  }, [webmUrl, mp4Url]);

  return (
    <div className="mk-hero-video">
      <Image
        src={posterUrl}
        alt="AI-generated basketball crossover drill demo shown on a phone"
        fill
        priority
        sizes="(min-width: 1024px) 360px, 82vw"
      />
      <video
        ref={ref}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="Muted looping AI-generated basketball drill demo"
      />
      {blocked && (
        <span className="mk-hero-play" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      )}
      {/* The AI disclosure follows the content everywhere, including here. */}
      <span className="mk-tag mono mk-hero-ai">AI demo</span>
    </div>
  );
}
