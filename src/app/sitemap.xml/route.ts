import { SITE_URL } from "@/lib/site";
import { SITEMAP_CHILDREN, entriesFor, newestLastModified } from "@/lib/sitemap-data";

/* Sitemap INDEX. Points at one child per kind of page so the drill library
   can grow without the marketing pages' lastmod churning alongside it.
   Written as a route handler rather than Next's sitemap convention because
   the convention has no way to express an index, and its default lastmod is
   the build time — the exact thing this replaces. */

export const dynamic = "force-static";

export async function GET() {
  const children = SITEMAP_CHILDREN.map(child => ({
    loc: `${SITE_URL}/sitemaps/${child}.xml`,
    lastmod: newestLastModified(entriesFor(child)),
  }));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${children.map(c => `  <sitemap>
    <loc>${c.loc}</loc>
    <lastmod>${c.lastmod}</lastmod>
  </sitemap>`).join("\n")}
</sitemapindex>
`;

  return new Response(xml, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
