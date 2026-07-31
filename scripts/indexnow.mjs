/* Tell IndexNow which URLs changed. Run AFTER a deploy.

   Usage:
     node scripts/indexnow.mjs                    # changes since HEAD~1
     node scripts/indexnow.mjs --since <ref>      # changes since a ref
     node scripts/indexnow.mjs --all              # every sitemap URL
     node scripts/indexnow.mjs <url> [url...]     # exactly these
     node scripts/indexnow.mjs --dry-run          # print, submit nothing

   IndexNow is a push notification to Bing, Yandex and others that a URL's
   content changed, so they can recrawl it instead of waiting. Google does
   not participate.

   AFTER A DEPLOY, NOT DURING A BUILD. The protocol requires that the key
   file and the submitted URLs are already live and fetchable — a build-time
   hook would announce pages that do not exist yet, and would fire on
   preview builds against the production host. This script verifies the key
   file resolves before it submits anything.

   The key is NOT a secret: IndexNow works by hosting it publicly at
   /<key>.txt, which is exactly how the receiving engine verifies that
   whoever submitted the URLs controls the site. */

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { changedPaths, toAbsolute } from './indexnow-urls.mjs';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://koachme.ai').replace(/\/$/, '');
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const root = fileURLToPath(new URL('..', import.meta.url));

const argv = process.argv.slice(2);
const has = (flag) => argv.includes(flag);
const valueOf = (flag) => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
};
const dryRun = has('--dry-run');
const explicit = argv.filter(a => a.startsWith('http'));

/* The key is whatever is actually published in public/<key>.txt. Reading it
   from disk rather than hardcoding it here means the file and the
   submission can never disagree — a mismatch is the one failure mode that
   makes every submission bounce. */
function readKey() {
  const files = readdirSync(new URL('../public', import.meta.url))
    .filter(f => /^[a-f0-9]{8,128}\.txt$/i.test(f));
  if (files.length !== 1) {
    throw new Error(
      files.length
        ? `Expected exactly one IndexNow key file in public/, found ${files.length}: ${files.join(', ')}`
        : 'No IndexNow key file in public/. Expected public/<key>.txt.',
    );
  }
  const name = files[0];
  const key = readFileSync(new URL(`../public/${name}`, import.meta.url), 'utf8').trim();
  if (name !== `${key}.txt`) {
    throw new Error(`Key file ${name} does not contain its own key (${key}); IndexNow requires they match.`);
  }
  return key;
}

function git(...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

/** The manifest as it was at a git ref, or null if it did not exist. */
function manifestAt(ref) {
  try {
    return JSON.parse(git('show', `${ref}:data/drills-manifest.json`));
  } catch {
    return null;
  }
}

function sitemapPaths() {
  const manifest = JSON.parse(readFileSync(new URL('../data/drills-manifest.json', import.meta.url), 'utf8'));
  const sports = [...new Set(manifest.drills.map(d => d.sport))];
  return [
    '/', '/about', '/become-a-coach', '/contact', '/privacy', '/terms',
    '/drills',
    ...sports.map(s => `/drills/${s}`),
    ...manifest.drills.map(d => `/drills/${d.sport}/${d.slug}`),
  ];
}

/** Refuse to submit until the key file is actually reachable. A submission
 *  whose key cannot be fetched is rejected wholesale, silently. */
async function keyFileIsLive(key) {
  const url = `${SITE_URL}/${key}.txt`;
  try {
    const res = await fetch(url);
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
    const body = (await res.text()).trim();
    if (body !== key) return { ok: false, reason: `serves "${body.slice(0, 40)}", expected the key` };
    return { ok: true, url };
  } catch (err) {
    return { ok: false, reason: String(err) };
  }
}

const key = readKey();

let urls;
if (explicit.length) {
  urls = explicit;
} else if (has('--all')) {
  urls = toAbsolute(sitemapPaths(), SITE_URL);
} else {
  const since = valueOf('--since') ?? 'HEAD~1';
  const before = manifestAt(since);
  const after = manifestAt('HEAD') ?? JSON.parse(readFileSync(new URL('../data/drills-manifest.json', import.meta.url), 'utf8'));
  const changedFiles = git('diff', '--name-only', `${since}..HEAD`).split('\n').filter(Boolean);
  urls = toAbsolute(changedPaths({ before, after, changedFiles }), SITE_URL);
}

/* Sets process.exitCode and returns rather than calling process.exit().
   On Windows, exiting while undici still holds open sockets trips a libuv
   assertion that overwrites the exit code — a script that reports failure
   after doing its job correctly is worse than useless in a deploy pipeline. */
async function main() {
  if (!urls.length) {
    console.log(JSON.stringify({ submitted: 0, urls: [], note: 'nothing changed' }, null, 2));
    return;
  }

  const live = await keyFileIsLive(key);

  /* A dry run reports what it WOULD do, including a key file that is not
     live yet — that is exactly the state you are in before the first
     deploy, and hiding the URL selection there would make this unusable
     for checking the selection itself. */
  if (dryRun) {
    console.log(JSON.stringify({
      dryRun: true,
      keyFile: `${SITE_URL}/${key}.txt`,
      keyFileLive: live.ok,
      ...(live.ok ? {} : { keyFileProblem: live.reason }),
      count: urls.length,
      urls,
    }, null, 2));
    return;
  }

  if (!live.ok) {
    console.error(`FATAL: key file ${SITE_URL}/${key}.txt is not serving the key (${live.reason}).`);
    console.error('Deploy first — IndexNow verifies the key by fetching it, and rejects the whole batch if it cannot.');
    process.exitCode = 1;
    return;
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: new URL(SITE_URL).host,
      key,
      keyLocation: live.url,
      urlList: urls,
    }),
  });

  // 200 accepted; 202 accepted with the key still being validated. Both fine.
  const ok = res.status === 200 || res.status === 202;
  const body = ok ? '' : await res.text();
  console.log(JSON.stringify({ status: res.status, ok, count: urls.length, urls }, null, 2));
  if (!ok) {
    console.error(body);
    process.exitCode = 1;
  }
}

await main();
