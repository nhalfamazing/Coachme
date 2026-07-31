/* Structured data for /verification.
 *
 * The FAQPage is built from the SAME verificationQa() array the page
 * renders, so the two cannot drift. Only the plain question-and-answer
 * sections are marked up — the tier table and the "what we do not verify"
 * list are richer markup, and marking up content that is not a literal
 * question and answer is how a rich result gets withdrawn.
 */

import { SITE_URL } from "@/lib/site";
import { verificationQa } from "@/lib/verification";
import { VERIFICATION_PUBLISHED } from "@/lib/sitemap-data";

const abs = (path: string) => `${SITE_URL}${path}`;
const PATH = "/verification";

function Script({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function VerificationJsonLd() {
  const qa = verificationQa();

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qa.map(item => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        // Joined with a space: the paragraphs are rendered in order on the
        // page, so this is the visible text, unedited.
        text: item.answer.join(" "),
      },
    })),
  };

  const page = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "How KoachMe verifies athlete stats",
    description:
      "KoachMe labels every athlete stat SELF, TRAINER, FACILITY or EVENT, showing exactly how it was verified.",
    url: abs(PATH),
    inLanguage: "en",
    // Real dates, never a build timestamp, matching the visible Updated line.
    datePublished: VERIFICATION_PUBLISHED,
    dateModified: VERIFICATION_PUBLISHED,
    isPartOf: { "@type": "WebSite", name: "KoachMe", url: SITE_URL },
    publisher: { "@type": "Organization", name: "KoachMe", url: SITE_URL },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Verification", item: abs(PATH) },
    ],
  };

  return (
    <>
      <Script data={page} />
      <Script data={faq} />
      <Script data={breadcrumb} />
    </>
  );
}
