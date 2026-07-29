"use client";

// Fires section_viewed (with the section id) once per pageload when a
// fifth of a section is on screen - so we learn which argument on the
// landing page people actually reach. Existing Vercel Analytics only.
// Event props carry the section slot, never anything about the visitor.

import { useEffect } from "react";
import { track } from "@vercel/analytics";

export function SectionViews({ ids }: { ids: string[] }) {
  useEffect(() => {
    const seen = new Set<string>();
    const sections = ids
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    // 0.2: low enough that phone-height sections (stacked drill videos)
    // still cross the threshold instead of never firing.
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting && !seen.has(e.target.id)) {
            seen.add(e.target.id);
            track("section_viewed", { id: e.target.id });
          }
        }
      },
      { threshold: 0.2 },
    );
    sections.forEach(s => io.observe(s));
    return () => io.disconnect();
  }, [ids]);
  return null;
}
