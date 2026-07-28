import type { Metadata } from "next";

// The product itself. Not for crawlers: it renders per-device state and
// would only ever be a thin/duplicate page in an index. The marketing
// pages at / carry the indexable content.
export const metadata: Metadata = {
  title: "Open the app",
  description:
    "Open CoachMe: your training profile, workout log, drills, and coach messages.",
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
