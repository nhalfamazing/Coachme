import type { Metadata } from "next";

// The Coach Console. Like /app it renders per-device state and would only
// ever be a thin, duplicate page in an index.
//
// It used to be disallowed in robots.txt but carried no noindex, which is
// the worst of both worlds: Google could still index the URL from an
// inbound link, and could never fetch the page to discover it should not.
// robots.txt now allows the fetch so this directive is actually seen.
//
// No canonical here on purpose — a page must never carry both a canonical
// and a noindex, because they ask for opposite things.
export const metadata: Metadata = {
  title: "Coach console",
  description:
    "Open the KoachMe coach console: your athletes, messages, availability, and session requests.",
  robots: { index: false, follow: false },
};

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return children;
}
