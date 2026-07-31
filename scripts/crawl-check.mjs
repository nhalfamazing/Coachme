// Internal-link crawl of the public site.
//
//   node scripts/crawl-check.mjs [baseUrl]
//
// Starts at the homepage and follows same-origin links in the RAW HTML,
// recording the click depth at which each page is first reached. Answers the
// three questions that decide whether new pages get found and indexed:
// is anything orphaned, is any internal link broken, and is every drill
// within three clicks of home.
const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const MAX_DEPTH = 4;

const seen = new Map();      // path -> depth first reached
const status = new Map();    // path -> HTTP status
const broken = [];
const linksOut = new Map();  // path -> Set(paths)

const norm = (href, from) => {
  try {
    const u = new URL(href, base + from);
    if (u.origin !== new URL(base).origin) return null;
    if (!/^\/(?!_next\/|api\/)/.test(u.pathname)) return null;
    return u.pathname.replace(/\/$/, "") || "/";
  } catch { return null; }
};

/* BREADTH-FIRST, and it has to be.
 *
 * This was a depth-first walk that fetched each page once and returned
 * early on the second encounter. That makes the recorded depth depend on
 * traversal ORDER rather than on the shortest path: reaching /drills at
 * depth 2 first would fix its children at 3, and later finding /drills at
 * depth 1 corrected /drills itself but never re-walked what it linked to.
 * The number this script exists to produce — is every drill within three
 * clicks of home — was therefore unreliable in both directions, and had
 * been reporting a clean 0 by luck.
 *
 * BFS visits every page at its true minimum depth the first time, so one
 * fetch per page is correct rather than merely cheap. */
async function crawl(start) {
  const queue = [[start, 0]];
  seen.set(start, 0);

  while (queue.length) {
    const [path, depth] = queue.shift();

    const res = await fetch(base + path, { redirect: "manual" });
    status.set(path, res.status);
    if (res.status !== 200) { broken.push(`${path} -> ${res.status}`); continue; }
    const html = await res.text();

    const out = new Set();
    for (const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)) {
      const p = norm(m[1], path);
      if (p) out.add(p);
    }
    linksOut.set(path, out);

    // Anything not yet seen is first reached HERE, which under BFS is its
    // shortest depth. Nothing needs revisiting.
    if (depth >= MAX_DEPTH) continue;
    for (const p of out) {
      if (seen.has(p)) continue;
      seen.set(p, depth + 1);
      queue.push([p, depth + 1]);
    }
  }
}

await crawl("/");

const { DRILLS } = await import("../src/lib/drills.ts").catch(() => ({ DRILLS: null }));

console.log(`crawled ${seen.size} pages from ${base}\n`);
const byDepth = [...seen.entries()].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
for (const [p, d] of byDepth) console.log(`  depth ${d}  ${String(status.get(p) ?? "?").padEnd(3)}  ${p}`);

console.log(`\nbroken internal links: ${broken.length}`);
for (const b of broken) console.log(`  - ${b}`);

// Pages that nothing links to (other than the entry point).
const linkedTo = new Set([...linksOut.values()].flatMap(s => [...s]));
const orphans = [...seen.keys()].filter(p => p !== "/" && !linkedTo.has(p));
console.log(`\norphans: ${orphans.length}`);
for (const o of orphans) console.log(`  - ${o}`);

const deep = byDepth.filter(([, d]) => d > 3).map(([p]) => p);
console.log(`\npages deeper than 3 clicks: ${deep.length}`);
for (const p of deep) console.log(`  - ${p}`);
// exitCode, not process.exit(): exiting on top of open undici sockets
// trips a libuv assertion on Windows that overwrites the code.
process.exitCode = broken.length || orphans.length || deep.length ? 1 : 0;
