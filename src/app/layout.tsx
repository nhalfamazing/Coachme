import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Manrope, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
  openGraph: {
    type: "website",
    siteName: "KoachMe",
    title: "KoachMe - The performance graph for emerging athletes",
    description:
      "Find a real coach. Train. Track every PR. Climb the ranks.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "KoachMe - The performance graph for emerging athletes",
    description:
      "Find a real coach. Train. Track every PR. Climb the ranks.",
  },
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
      className={`${bebas.variable} ${manrope.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col px-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
