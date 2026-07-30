"use client";

// Autoplaying muted drill demo inside the hero phone mockup.
//
// - muted is set BOTH as a JSX attribute and on the DOM node: React can
//   drop the property during hydration and iOS refuses autoplay without
//   the DOM property being true.
// - src is assigned AFTER the window load event, not on mount and not in
//   the server HTML. Assigning it on mount was measurably wrong: the
//   1.4 MB WebM started downloading while the LCP poster was still in
//   flight, and on a throttled mobile connection they competed. The
//   poster is the LCP element, so nothing else may race it.
// - Source choice: 480p VP8 WebM when the browser can play it, else the
//   H.264 mp4 - older iOS has no VP8 file playback.
// - MOBILE: no autoplay at all. See MOBILE_AUTOPLAY below.
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

    /* Phones do not autoplay this clip at all.
     *
     * Measured, not assumed: with the video loading on mount, mobile LCP
     * was 3.4s against a 2.5s threshold, and the poster's own load was
     * being delayed 551ms by the WebM downloading alongside it. Desktop
     * was never the problem (0.7s).
     *
     * A muted, looping decoration is not worth failing Core Web Vitals on
     * the device most parents arrive on. The poster still shows the drill,
     * and a tap plays it for anyone who wants the motion. */
    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    const load = () => {
      el.muted = true;
      const canWebm = el.canPlayType('video/webm; codecs="vp8"') !== "";
      el.src = canWebm ? webmUrl : mp4Url;
    };

    if (isMobile) {
      // Poster only. One tap loads and plays. The play glyph is shown by
      // toggling a DOM attribute rather than React state: it is a property
      // of an external system (the video element) and setting state
      // synchronously inside an effect just triggers a second render.
      const wrap = el.parentElement;
      wrap?.setAttribute("data-tap-to-play", "");
      const tapToPlay = () => {
        if (!el.src) load();
        el.play()
          .then(() => wrap?.removeAttribute("data-tap-to-play"))
          .catch(() => { /* still blocked; the glyph stays and they can tap again */ });
      };
      el.addEventListener("click", tapToPlay);
      return () => {
        el.removeEventListener("click", tapToPlay);
        wrap?.removeAttribute("data-tap-to-play");
      };
    }

    /* Desktop: autoplay, but only once the page has finished loading, so
       the clip never competes with the LCP poster for bandwidth. */
    let removed = false;
    function retry() {
      const v = ref.current;
      if (!v) return;
      v.muted = true;
      v.play().then(() => {
        setBlocked(false);
        removeRetries();
      }).catch(() => { /* still blocked; listeners stay armed */ });
    }
    const removeRetries = () => {
      if (removed) return;
      removed = true;
      window.removeEventListener("touchstart", retry);
      window.removeEventListener("scroll", retry);
      window.removeEventListener("click", retry);
    };

    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      load();
      // If play() is refused (Low Power Mode, data saver — OS-level blocks
      // we cannot override), show a play glyph and retry on first input.
      el.play().then(() => setBlocked(false)).catch(() => {
        setBlocked(true);
        window.addEventListener("touchstart", retry, { passive: true });
        window.addEventListener("scroll", retry, { passive: true });
        window.addEventListener("click", retry);
      });
    };

    /* Deliberately a timeout rather than requestAnimationFrame: rAF does
       not fire while a tab is backgrounded or otherwise not compositing,
       which would leave the hero permanently blank for anyone who opened
       the page in a background tab. A timeout fires regardless, and
       yielding the task is all we need to stay out of LCP's way. */
    let timer = 0;
    if (document.readyState === "complete") {
      timer = window.setTimeout(start, 0);
    } else {
      window.addEventListener("load", start, { once: true });
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener("load", start);
      removeRetries();
    };
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
      {/* preload="none": nothing is fetched until src is assigned, which
          happens after window load on desktop and only on tap on mobile. */}
      <video
        ref={ref}
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        aria-label="Muted looping AI-generated basketball drill demo"
      />
      {/* Shown when desktop autoplay was refused (React state), or on
          mobile where we never autoplay (the data-tap-to-play attribute,
          via CSS). */}
      <span className={`mk-hero-play${blocked ? " is-shown" : ""}`} aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
      {/* The AI disclosure follows the content everywhere, including here.
          Clay stamp = trust moment. */}
      <span className="stamp stamp--clay mk-hero-ai">AI demo</span>
    </div>
  );
}
