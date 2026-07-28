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
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "KoachMe",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    description:
      "KoachMe gives young athletes a free training profile: logged workouts, honestly labeled stats, and access to real coaches.",
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
    offers: [
      {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description:
          "Free for athletes: profile, workout log, stats, messaging, and session booking. AI drill library included free for the first month.",
      },
      {
        // Subscriptions have not launched; PreOrder is the honest
        // availability until payments go live.
        "@type": "Offer",
        name: "KoachMe Pro (AI drill library)",
        price: "9",
        priceCurrency: "USD",
        availability: "https://schema.org/PreOrder",
        description: "AI drill library after the first free month, $9 per month.",
      },
    ],
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
