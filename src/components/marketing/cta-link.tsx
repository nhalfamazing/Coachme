"use client";

// A Link that reports which marketing CTA was clicked. Event props carry
// the CTA slot and the section it sits in, never anything about the visitor.
//
// The event is `cta_click` (it was `landing_cta_click`): the same component
// now serves drill pages and hubs, so a landing-specific name would have
// been wrong on most of the pages using it. `section` is what makes the
// event answerable — "which argument on the page produced the click" is the
// question, and a CTA slot alone does not answer it.

import Link from "next/link";
import { track } from "@vercel/analytics";

export function CtaLink({
  href,
  cta,
  section,
  event = "cta_click",
  className,
  children,
}: {
  href: string;
  cta: string;
  /** Section id the CTA sits in, matching the id used by SectionViews so
   *  views and clicks can be compared for the same section. */
  section?: string;
  /** Event name. Drill pages use `drill_page_cta_click` so the
   *  search-visitor funnel can be read on its own without filtering the
   *  whole site's clicks — that audience behaves nothing like a landing
   *  visitor and mixing them makes both numbers useless. */
  event?: "cta_click" | "drill_page_cta_click";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => track(event, { cta, ...(section ? { section } : {}) })}
    >
      {children}
    </Link>
  );
}
