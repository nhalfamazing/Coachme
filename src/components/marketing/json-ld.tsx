// JSON-LD structured data for the marketing pages. Every claim in here
// must be true of the actual product: free athlete tier, labeled AI
// content, no invented ratings or review counts (so no aggregateRating,
// deliberately).

import { SITE_URL } from "@/lib/site";
import { FAQ_ITEMS } from "./faq-data";

function Script({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function LandingJsonLd() {
  /* NO `sameAs`, ON PURPOSE.
   *
   * A 2026-07-30 audit flagged the empty sameAs as HIGH severity, and it
   * stays empty: Rasheid confirmed on 2026-07-30 that KoachMe has no social
   * profiles yet. sameAs exists so a search engine can reconcile this
   * organization with the same organization elsewhere. Pointing it at a
   * handle nobody has registered does not resolve an entity — it asserts a
   * presence that does not exist, and anyone who follows the link finds out.
   *
   * WHEN PROFILES EXIST: add them here as an array of the exact profile
   * URLs, each verified to return 200. Do not guess handles from the brand
   * name, and do not add a profile that has never been posted to. Fixing
   * the audit finding is not worth a claim we cannot stand behind.
   */
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "KoachMe",
    url: SITE_URL,
    logo: `${SITE_URL}/brand/mark.png`,
    description:
      "KoachMe gives young athletes a free training profile: logged workouts, honestly labeled stats, and access to real coaches.",
    /* foundingDate is the date the KoachMe repository's first commit
       landed — the earliest date we can actually evidence for the project
       existing, rather than a rounder one that would read better. If the
       family considers a different date the real founding, change it here;
       do not widen it to a year to look established. */
    foundingDate: "2026-05-22",
    /* Miami is stated on /about and in the AboutPage schema already. No
       street address: this is a father-and-son project run from a home,
       and publishing a child's home address to strengthen an entity
       signal is not a trade we make. areaServed is deliberately absent
       too — the product is a website with no geographic restriction, and
       claiming a service area we have not defined would be invention. */
    foundingLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Miami",
        addressRegion: "FL",
        addressCountry: "US",
      },
    },
    knowsAbout: [
      "youth sports training",
      "athlete performance tracking",
      "sports skill drills",
      "youth coach verification",
    ],
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "KoachMe",
    url: SITE_URL,
  };
  const webApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "KoachMe",
    url: `${SITE_URL}/app`,
    applicationCategory: "SportsApplication",
    operatingSystem: "Any (web browser)",
    /* ONE Offer, because there is one offer: KoachMe is free during beta.
       This node previously carried a second Offer at price "9" with
       PreOrder availability — a price nobody was ever charged, published as
       structured data on every marketing page and read by search engines
       and AI assistants as fact. Structured data describes what IS. No
       future pricing belongs here, and none may be added back before it is
       actually being charged. */
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      description:
        "KoachMe is free during beta and nobody is charged. Athletes get a profile, workout and drill logging, stats, streaks and XP, the community feed, the drill library, coach messaging, and session booking.",
    },
  };
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a.join(" ") },
    })),
  };
  return (
    <>
      <Script data={organization} />
      <Script data={website} />
      <Script data={webApp} />
      <Script data={faq} />
    </>
  );
}

export function AboutJsonLd() {
  const aboutPage = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About KoachMe",
    url: `${SITE_URL}/about`,
    description:
      "KoachMe is a family-built platform from Miami that gives young athletes an honest training profile.",
    about: {
      "@type": "Organization",
      name: "KoachMe",
      url: SITE_URL,
    },
  };
  return <Script data={aboutPage} />;
}
