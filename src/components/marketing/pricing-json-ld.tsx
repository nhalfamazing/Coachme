/* Structured data for /pricing.
 *
 * ONE Offer, because there is one offer: free during beta. This file used
 * to emit a second Offer at OFFER.proPriceUsd with PreOrder availability,
 * on the reasoning that PreOrder was the honest value for a price published
 * but not collected. That reasoning was wrong. The honest thing to do with
 * a price we never charge is not to publish it — the availability field
 * cannot rescue a price claim that was never true.
 *
 * The description below comes from src/lib/offer.ts, the same module the
 * visible page renders, so the schema cannot drift from the page.
 */

import { SITE_URL } from "@/lib/site";
import { costSentence, foundingBenefitsProse } from "@/lib/offer";
import { PRICING_PUBLISHED, PRICING_UPDATED } from "@/lib/sitemap-data";

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
      `${costSentence()} Anyone who signs up during beta becomes a founding member and keeps today's features free while their account stays active.`,
    url: abs(PATH),
    inLanguage: "en",
    datePublished: PRICING_PUBLISHED,
    dateModified: PRICING_UPDATED,
    isPartOf: { "@type": "WebSite", name: "KoachMe", url: SITE_URL },
    offers: {
      "@type": "Offer",
      name: "KoachMe during beta",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: abs(PATH),
      description: `${costSentence()} Founding members keep these free while their account stays active: ${foundingBenefitsProse()}.`,
    },
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
