/* Structured data for /pricing.
 *
 * The Offer nodes take their numbers from src/lib/offer.ts, the same
 * constant the visible page renders, so the schema cannot advertise a price
 * the page does not show.
 *
 * `availability: PreOrder` while payments are not live. That is the honest
 * schema.org value for a price that is published but not collected, and it
 * is chosen deliberately over InStock — a search result offering a $9
 * subscription nobody can buy is a bad experience and a bad claim.
 */

import { SITE_URL } from "@/lib/site";
import { OFFER } from "@/lib/offer";
import { PRICING_PUBLISHED } from "@/lib/sitemap-data";

const abs = (path: string) => `${SITE_URL}${path}`;
const PATH = "/pricing";

function Script({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function PricingJsonLd() {
  const page = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "What does KoachMe cost?",
    description:
      `A KoachMe athlete profile is free forever. The AI drill library is free for the first month, then $${OFFER.proPriceUsd} a month.`,
    url: abs(PATH),
    inLanguage: "en",
    datePublished: PRICING_PUBLISHED,
    dateModified: PRICING_PUBLISHED,
    isPartOf: { "@type": "WebSite", name: "KoachMe", url: SITE_URL },
    offers: [
      {
        "@type": "Offer",
        name: "KoachMe athlete profile",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: abs(PATH),
        description:
          "Free for athletes: profile, workout log, stats, community feed, messaging coaches, and booking sessions.",
      },
      {
        "@type": "Offer",
        name: OFFER.proName,
        price: String(OFFER.proPriceUsd),
        priceCurrency: "USD",
        availability: OFFER.paymentsLive
          ? "https://schema.org/InStock"
          : "https://schema.org/PreOrder",
        url: abs(PATH),
        description: OFFER.paymentsLive
          ? `AI drill library after the first free month, $${OFFER.proPriceUsd} per month.`
          : `AI drill library after the first free month, $${OFFER.proPriceUsd} per month. Subscriptions have not launched and nobody is charged yet.`,
      },
    ],
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Pricing", item: abs(PATH) },
    ],
  };

  return (
    <>
      <Script data={page} />
      <Script data={breadcrumb} />
    </>
  );
}
