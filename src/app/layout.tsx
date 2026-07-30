import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { openGraph, twitter } from "@/lib/og";
import "./globals.css";

/* KoachMe type stack (see docs/design-system.md):
   display = Clash Display (Fontshare FFL, self-hosted) - headlines
   wide    = Panchang (Fontshare FFL, self-hosted) - eyebrows/stamps/labels
   body    = Archivo variable with width axis - prose + condensed stat contexts
   mono    = JetBrains Mono - numbers and stat-sheet voice ONLY */
const clash = localFont({
  src: [
    { path: "../fonts/ClashDisplay-Semibold.woff2", weight: "600" },
    { path: "../fonts/ClashDisplay-Bold.woff2", weight: "700" },
  ],
  variable: "--font-display",
  display: "swap",
});

const panchang = localFont({
  src: "../fonts/Panchang-Semibold.woff2",
  weight: "600",
  variable: "--font-wide",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://koachme.ai";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "KoachMe - The performance graph for emerging athletes",
    template: "%s - KoachMe",
  },
  description:
    "Find a real coach. Train. Track every PR. Climb the ranks. KoachMe is the performance graph for emerging athletes.",
  applicationName: "KoachMe",
  keywords: [
    "athlete training",
    "youth sports",
    "coaching",
    "performance tracking",
    "baseball",
    "basketball",
    "football",
    "soccer",
  ],
  /* Defaults for any page that does not set its own. NOTE: Next replaces
     the whole `openGraph` object when a page defines one — it does not
     merge into it — so a page that wants a custom OG title must build the
     object with the openGraph() helper in @/lib/og rather than writing it
     by hand, or it silently loses the image, type and siteName. */
  openGraph: openGraph({
    title: "The performance graph for emerging athletes",
    description: "Find a real coach. Train. Track every PR. Climb the ranks.",
    path: "/",
  }),
  twitter: twitter({
    title: "The performance graph for emerging athletes",
    description: "Find a real coach. Train. Track every PR. Climb the ranks.",
    path: "/",
  }),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0A0B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${clash.variable} ${panchang.variable} ${archivo.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col px-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
