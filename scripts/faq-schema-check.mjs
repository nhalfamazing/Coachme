/* Does every FAQPage answer actually appear on the page?

   Usage:  node scripts/faq-schema-check.mjs [baseUrl]

   Google's FAQPage guidance is explicit: the marked-up question and answer
   must be visible on the page. Schema that says more than the page does is
   the fastest way to lose a rich result and the slowest way to notice,
   because nobody reads their own JSON-LD.

   This strips the rendered HTML back to visible text and asserts that every
   Question name and every acceptedAnswer text is present in it, verbatim.
   It runs against a real server rather than the source, so it catches the
   two failure modes source inspection cannot: a component rendering a
   different string than the constant it was given, and copy that is in the
   schema but conditionally not rendered. */

const base = (process.argv[2] ?? 'http://localhost:3100').replace(/\/$/, '');

const PAGES = ['/', '/verification'];

/** Rendered HTML -> the text a reader sees. */
function visibleText(html) {
  return html
    // Anything that is not shown to a reader.
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    // React's text-node separator, which would otherwise split a sentence.
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&apos;|&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Every FAQPage node in the document. */
function faqNodes(html) {
  const nodes = [];
  for (const m of html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    let data;
    try {
      data = JSON.parse(m[1]);
    } catch {
      nodes.push({ parseError: m[1].slice(0, 120) });
      continue;
    }
    for (const node of Array.isArray(data) ? data : [data]) {
      if (node?.['@type'] === 'FAQPage') nodes.push(node);
    }
  }
  return nodes;
}

const problems = [];
let checked = 0;

for (const path of PAGES) {
  const res = await fetch(`${base}${path}`);
  if (!res.ok) {
    problems.push(`${path}: HTTP ${res.status}`);
    continue;
  }
  const html = await res.text();
  const text = visibleText(html);
  const nodes = faqNodes(html);

  if (!nodes.length) {
    problems.push(`${path}: no FAQPage node found`);
    continue;
  }

  for (const node of nodes) {
    if (node.parseError) {
      problems.push(`${path}: unparseable JSON-LD near "${node.parseError}"`);
      continue;
    }
    for (const q of node.mainEntity ?? []) {
      checked++;
      const question = q?.name ?? '';
      const answer = q?.acceptedAnswer?.text ?? '';
      if (!text.includes(question)) {
        problems.push(`${path}: question NOT visible — "${question.slice(0, 70)}"`);
      }
      if (!answer) {
        problems.push(`${path}: "${question.slice(0, 40)}" has no answer text`);
      } else if (!text.includes(answer)) {
        // Report the first clause that diverges, which is almost always
        // where the drift is.
        const head = answer.slice(0, 60);
        problems.push(
          `${path}: answer NOT visible verbatim — "${question.slice(0, 50)}"\n`
          + `        schema starts: "${head}..."\n`
          + `        page contains that opening: ${text.includes(head)}`,
        );
      }
    }
  }
}

console.log(`FAQ schema check — ${base}`);
console.log(`  pages: ${PAGES.length}, question/answer pairs checked: ${checked}`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exitCode = 1;
} else {
  console.log('  every marked-up question and answer is visible on its page.');
}
