import type { Metadata } from "next";

// The application page itself is a client component; route metadata
// lives here.
export const metadata: Metadata = {
  title: "Become a coach",
  description:
    "Apply to coach on CoachMe: set your own rate, choose how you train (in person, live online, or async video review), and keep 90% of what you charge.",
  alternates: { canonical: "/become-a-coach" },
  openGraph: {
    title: "Become a coach on CoachMe",
    description:
      "Set your own rate, train your way, and keep 90% of what you charge.",
    url: "/become-a-coach",
  },
};

export default function BecomeACoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
