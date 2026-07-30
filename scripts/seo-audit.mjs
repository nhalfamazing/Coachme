// Crawl-side SEO audit of the public site.
//
//   node scripts/seo-audit.mjs [baseUrl] [--json]
//
// Fetches every known public route plus everything in the sitemap, and
// reports the things that decide whether a page can rank at all: status,
// title, meta description, canonical, robots directives, H1 count, and the
// JSON-LD @types present. Deliberately uses raw HTML, not a headless browser
// — this is what a crawler sees before running any JavaScript, and anything
// that only appears after hydration is not reliably indexable.
//
// Written to be run before and after a change so the diff is mechanical
// rather than remembered. See docs/seo-baseline.md.

const base = (process.argv.find(a => a.startsWith("http")) || "https://koachme.ai").replace(/\/$/, "");
const asJson = process.argv.includes("--json");

/** Routes we know about. The sitemap is merged in on top of these, so a page
 *  that is live but missing from the sitemap still gets audited (and shows
 *  up as not-in-sitemap, which is usually the bug). */
const KNOWN_ROUTES = [
  "/", "/about", "/contact", "/privacy", "/terms", "/become-a-coach",
  "/app", "/coach", "/admin/login",
];

const text = (html, re) => (html.match(re) || [])[1]?.trim() ?? null;
const decode = (s) => s == null ? null : s
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&apos;/g, "'");

function metaContent(html, nameOrProp) {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${nameOrProp}["'][^>]*content=["']([^"']*)["']|` +
    `<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${nameOrProp}["']`, "i");
  const m = html.match(re);
  return decode(m ? (m[1] ?? m[2]) : null);
}

function jsonLdTypes(html) {
  const types = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      const walk = (node) => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (node && typeof node === "object") {
          if (node["@type"]) types.push(...[].concat(node["@type"]));
          if (node["@graph"]) walk(node["@graph"]);
        }
      };
      walk(JSON.parse(m[1]));
    } catch { types.push("(unparseable)"); }
  }
  return types;
}

async function auditRoute(path) {
  const url = base + path;
  let res, html = "";
  try {
    res = await fetch(url, { redirect: "manual" });
    html = await res.text();
  } catch (err) {
    return { path, error: String(err.message || err) };
  }

  // Follow one redirect so we describe the page a crawler lands on.
  let finalPath = path, status = res.status;
  if (status >= 300 && status < 400) {
    const loc = res.headers.get("location");
    if (loc) {
      try {
        const followed = await fetch(new URL(loc, url), { redirect: "follow" });
        html = await followed.text();
        finalPath = new URL(followed.url).pathname;
        status = `${res.status} -> ${followed.status}`;
      } catch { /* leave as-is */ }
    }
  }

  const robots = metaContent(html, "robots");
  const canonical = decode(text(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i));
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)]
    .map(m => decode(m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()));
  const title = decode(text(html, /<title[^>]*>([\s\S]*?)<\/title>/i));
  const description = metaContent(html, "description");

  return {
    path, finalPath: finalPath === path ? undefined : finalPath, status,
    indexable: !/noindex/i.test(robots ?? ""),
    robots,
    title, titleLen: title?.length ?? 0,
    description, descLen: description?.length ?? 0,
    canonical,
    canonicalAbsolute: canonical ? canonical.startsWith("http") : null,
    h1Count: h1s.length,
    h1: h1s[0] ?? null,
    jsonLd: jsonLdTypes(html),
  };
}

async function sitemapUrls() {
  const out = [];
  const seen = new Set();
  const pull = async (url) => {
    if (seen.has(url)) return;
    seen.add(url);
    try {
      const xml = await (await fetch(url)).text();
      // A sitemap index points at more sitemaps; follow one level.
      const children = [...xml.matchAll(/<sitemap>[\s\S]*?<loc>([^<]+)<\/loc>/gi)].map(m => m[1]);
      if (children.length) { for (const c of children) await pull(c); return; }
      for (const m of xml.matchAll(/<url>[\s\S]*?<loc>([^<]+)<\/loc>(?:[\s\S]*?<lastmod>([^<]+)<\/lastmod>)?/gi)) {
        out.push({ loc: m[1], lastmod: m[2] ?? null });
      }
    } catch { /* no sitemap */ }
  };
  await pull(`${base}/sitemap.xml`);
  return out;
}

const sitemap = await sitemapUrls();
const sitemapPaths = sitemap.map(u => { try { return new URL(u.loc).pathname; } catch { return u.loc; } });
const paths = [...new Set([...KNOWN_ROUTES, ...sitemapPaths])].sort();

const results = [];
for (const p of paths) results.push(await auditRoute(p));

// lastmod that is identical everywhere is a build timestamp, not real data.
const lastmods = new Set(sitemap.map(u => u.lastmod));
const lastmodIsBuildTime = sitemap.length > 1 && lastmods.size === 1;

const indexable = results.filter(r => r.indexable && String(r.status).startsWith("200"));
const summary = {
  base,
  checkedAt: new Date().toISOString(),
  routesChecked: results.length,
  indexablePages: indexable.length,
  sitemapUrls: sitemap.length,
  lastmodIsBuildTime,
  inSitemapButNoindex: sitemapPaths.filter(p => results.find(r => r.path === p && !r.indexable)),
  indexableNotInSitemap: indexable.map(r => r.path).filter(p => !sitemapPaths.includes(p)),
  jsonLdTypes: [...new Set(results.flatMap(r => r.jsonLd ?? []))].sort(),
  problems: results.flatMap(r => {
    const out = [];
    if (!r.indexable) return out;
    if (!String(r.status).startsWith("200")) out.push(`${r.path}: status ${r.status}`);
    if (!r.title) out.push(`${r.path}: no title`);
    else if (r.titleLen > 60) out.push(`${r.path}: title ${r.titleLen} chars (>60)`);
    if (!r.description) out.push(`${r.path}: no meta description`);
    else if (r.descLen > 155) out.push(`${r.path}: description ${r.descLen} chars (>155)`);
    if (r.h1Count !== 1) out.push(`${r.path}: ${r.h1Count} H1 elements (want exactly 1)`);
    if (!r.canonical) out.push(`${r.path}: no canonical`);
    else if (!r.canonicalAbsolute) out.push(`${r.path}: canonical is relative`);
    if (r.canonical && r.robots && /noindex/i.test(r.robots)) out.push(`${r.path}: canonical AND noindex`);
    return out;
  }),
};

if (asJson) {
  console.log(JSON.stringify({ summary, results, sitemap }, null, 2));
} else {
  console.log(`SEO audit of ${base}  (${summary.checkedAt})\n`);
  for (const r of results) {
    if (r.error) { console.log(`${r.path}\n  ERROR ${r.error}\n`); continue; }
    console.log(`${r.path}${r.finalPath ? ` -> ${r.finalPath}` : ""}`);
    console.log(`  status ${r.status}   ${r.indexable ? "INDEXABLE" : `noindex (${r.robots})`}`);
    console.log(`  title  [${r.titleLen}] ${r.title ?? "(none)"}`);
    console.log(`  desc   [${r.descLen}] ${(r.description ?? "(none)").slice(0, 90)}`);
    console.log(`  canon  ${r.canonical ?? "(none)"}`);
    console.log(`  h1     ${r.h1Count}${r.h1 ? ` — ${r.h1.slice(0, 60)}` : ""}`);
    console.log(`  ld+json ${r.jsonLd.length ? r.jsonLd.join(", ") : "(none)"}`);
    console.log("");
  }
  console.log("--- summary ---");
  console.log(`indexable pages:      ${summary.indexablePages}`);
  console.log(`sitemap urls:         ${summary.sitemapUrls}`);
  console.log(`lastmod is build time: ${summary.lastmodIsBuildTime}`);
  console.log(`JSON-LD types:        ${summary.jsonLdTypes.join(", ") || "(none)"}`);
  if (summary.indexableNotInSitemap.length) console.log(`indexable, not in sitemap: ${summary.indexableNotInSitemap.join(", ")}`);
  if (summary.inSitemapButNoindex.length) console.log(`in sitemap but noindex:    ${summary.inSitemapButNoindex.join(", ")}`);
  console.log(`\nproblems (${summary.problems.length}):`);
  for (const p of summary.problems) console.log(`  - ${p}`);
}
