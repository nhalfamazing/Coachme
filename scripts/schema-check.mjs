/* Validate every JSON-LD node the site emits.

   Usage:  node scripts/schema-check.mjs [baseUrl]

   Not a substitute for Google's Rich Results Test, which is the authority.
   This catches the things that test would flag, on every page at once, before
   a deploy: unparseable JSON, missing @context/@type, required properties
   absent, dates that are not ISO, absolute URLs that are not absolute, and
   the two integrity rules this project cares about most —
     - HowTo only where the drill actually has steps
     - every VideoObject discloses that the demo is AI-generated
   A rich result withdrawn for a bad node is invisible until traffic drops. */

const base = (process.argv[2] ?? "http://localhost:3100").replace(/\/$/, "");

const PAGES = [
  "/", "/about", "/pricing", "/verification", "/drills",
  "/drills/softball", "/drills/basketball",
  "/drills/softball/windmill-pitching",
  "/drills/basketball/mikan-drill",
  "/privacy", "/terms", "/contact", "/become-a-coach",
];

/** Required properties per type, beyond @context/@type. */
const REQUIRED = {
  Organization: ["name", "url"],
  WebSite: ["name", "url"],
  WebApplication: ["name", "url", "applicationCategory"],
  FAQPage: ["mainEntity"],
  AboutPage: ["name", "url"],
  WebPage: ["name", "url"],
  VideoObject: ["name", "description", "thumbnailUrl", "uploadDate", "contentUrl"],
  HowTo: ["name", "step"],
  BreadcrumbList: ["itemListElement"],
  ItemList: ["name", "itemListElement", "numberOfItems"],
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_PROPS = ["uploadDate", "datePublished", "dateModified", "foundingDate"];
const URL_PROPS = ["url", "contentUrl", "logo", "item"];

const problems = [];
const typeCounts = new Map();

function check(node, page, path = "root") {
  if (!node || typeof node !== "object") return;
  const type = node["@type"];
  if (!type) return;
  typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);

  for (const prop of REQUIRED[type] ?? []) {
    if (node[prop] === undefined || node[prop] === null || node[prop] === "") {
      problems.push(`${page} ${path}/${type}: missing required "${prop}"`);
    }
  }

  for (const prop of DATE_PROPS) {
    const v = node[prop];
    if (v !== undefined && !ISO_DATE.test(String(v))) {
      problems.push(`${page} ${path}/${type}: "${prop}" is "${v}", expected yyyy-mm-dd`);
    }
  }

  for (const prop of URL_PROPS) {
    const v = node[prop];
    if (typeof v === "string" && v.startsWith("/")) {
      problems.push(`${page} ${path}/${type}: "${prop}" is relative ("${v}"); scrapers do not resolve those`);
    }
  }

  // dateModified must not precede datePublished.
  if (node.datePublished && node.dateModified && node.dateModified < node.datePublished) {
    problems.push(`${page} ${path}/${type}: dateModified ${node.dateModified} precedes datePublished ${node.datePublished}`);
  }

  // INTEGRITY: a VideoObject for an AI-generated demo must say so.
  if (type === "VideoObject" && !/AI-generated/i.test(String(node.description ?? ""))) {
    problems.push(`${page} ${path}/VideoObject: description does not disclose AI generation`);
  }

  // INTEGRITY: HowTo requires real steps, never an empty shell.
  if (type === "HowTo" && (!Array.isArray(node.step) || node.step.length === 0)) {
    problems.push(`${page} ${path}/HowTo: emitted with no steps`);
  }

  for (const [k, v] of Object.entries(node)) {
    if (Array.isArray(v)) v.forEach((item, i) => check(item, page, `${path}/${k}[${i}]`));
    else if (v && typeof v === "object") check(v, page, `${path}/${k}`);
  }
}

let nodeCount = 0;
for (const page of PAGES) {
  const res = await fetch(`${base}${page}`);
  if (!res.ok) { problems.push(`${page}: HTTP ${res.status}`); continue; }
  const html = await res.text();
  for (const m of html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    let data;
    try {
      data = JSON.parse(m[1]);
    } catch (err) {
      problems.push(`${page}: unparseable JSON-LD — ${String(err).slice(0, 90)}`);
      continue;
    }
    for (const node of Array.isArray(data) ? data : [data]) {
      nodeCount++;
      if (!node["@context"]) problems.push(`${page}: node missing @context`);
      if (!node["@type"]) problems.push(`${page}: node missing @type`);
      check(node, page);
    }
  }
}

console.log(`Schema check — ${base}`);
console.log(`  pages: ${PAGES.length}, top-level nodes: ${nodeCount}\n`);
console.log("  types emitted:");
for (const [t, n] of [...typeCounts.entries()].sort()) console.log(`    ${String(n).padStart(3)}  ${t}`);

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exitCode = 1;
} else {
  console.log("\n  no problems.");
}
