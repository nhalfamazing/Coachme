"use client";

// Returning visitors (an athlete profile, a signed-out flag, or a coach
// account on this device) get a one-click path back into the product at
// the very top of the page, above the marketing content. Renders nothing
// for first-time visitors and during SSR.

import { useEffect, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";

type Returning = { label: string; href: string; name?: string } | null;

export function ReturningUserBanner() {
  const [returning, setReturning] = useState<Returning>(null);

  useEffect(() => {
    try {
      const athlete = JSON.parse(localStorage.getItem("coachme_athlete") || "null");
      const athletes = JSON.parse(localStorage.getItem("coachme_athletes") || "[]");
      const coaches = JSON.parse(localStorage.getItem("coachme_coaches") || "[]");
      const signedOut = localStorage.getItem("coachme_signed_out");

      const hasAthlete =
        (athlete && athlete.id) || (Array.isArray(athletes) && athletes.length > 0) || signedOut;
      const hasCoach = Array.isArray(coaches) && coaches.length > 0;

      if (hasAthlete) {
        setReturning({
          label: "Open the app",
          href: "/app",
          name: athlete?.firstName || athlete?.name || undefined,
        });
      } else if (hasCoach) {
        setReturning({ label: "Open the coach console", href: "/coach" });
      }
    } catch {
      // Unreadable storage just means no banner.
    }
  }, []);

  if (!returning) return null;

  return (
    <div className="mk-banner">
      <div className="mk-wrap mk-banner-in">
        <p className="body">
          <strong>Welcome back{returning.name ? `, ${returning.name}` : ""}.</strong>{" "}
          Your profile is on this device.
        </p>
        <Link
          href={returning.href}
          className="mk-btn mk-btn--primary mk-btn--sm body"
          onClick={() =>
            track("cta_click", {
              section: "returning_banner",
              cta: returning.href === "/coach" ? "returning_open_console" : "returning_open_app",
            })
          }
        >
          {returning.label} →
        </Link>
      </div>
    </div>
  );
}
