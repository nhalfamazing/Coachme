import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/site";
import { SITEMAP_CHILDREN, entriesFor, type SitemapChild } from "@/lib/sitemap-data";

/* Child sitemaps: /sitemaps/pages.xml and /sitemaps/drills.xml.
   Every lastmod is a real content date (see src/lib/sitemap-data.ts). */

export const dynamic = "force-static";

export function generateStaticParams() {
  return SITEMAP_CHILDREN.map(child => ({ child: `${child}.xml` }));
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ child: string }> },
) {
  const { child } = await ctx.params;
  const name = child.replace(/\.xml$/, "") as SitemapChild;
  if (!SITEMAP_CHILDREN.includes(name)) notFound();

  const entries = entriesFor(name);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(e => `  <url>
    <loc>${SITE_URL}${e.path === "/" ? "/" : e.path}</loc>
    <lastmod>${e.lastModified}</lastmod>${e.changeFrequency ? `
    <changefreq>${e.changeFrequency}</changefreq>` : ""}${e.priority != null ? `
    <priority>${e.priority}</priority>` : ""}
  </url>`).join("\n")}
</urlset>
`;

  return new Response(xml, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
