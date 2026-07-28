// Viewport screenshot tool for the responsive retrofit.
//
//   node scripts/screenshot.mjs <url> [options]
//
// Options:
//   --widths 390,768,1024,1440   viewport widths to capture (default all four)
//   --out landing                filename prefix; files land in .screenshots/
//   --seed                       seed a signed-in test athlete into localStorage
//   --tab trainers               click a bottom-nav/sidebar tab after load
//   --click "Some text"          click element(s) by visible text after load
//                                (repeatable; runs in order after --tab)
//   --tall                       use a 2400px-tall viewport to expose content
//                                below the fold of the app's internal scroller
//
// The app scrolls inside its own container (not the document), so fullPage
// screenshots would not show below-the-fold content; --tall is the substitute.

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const url = args.find(a => !a.startsWith('--'));
if (!url) {
  console.error('Usage: node scripts/screenshot.mjs <url> [--widths ...] [--out name] [--seed] [--tab name] [--click "text"] [--tall]');
  process.exit(1);
}

function opt(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
}
const widths = opt('widths', '390,768,1024,1440').split(',').map(Number);
const out = opt('out', 'shot');
const seed = args.includes('--seed');
const tall = args.includes('--tall');
// --click and --tab actions run in the order they appear on the command line.
const actions = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--click') actions.push({ kind: 'click', value: args[i + 1] });
  if (args[i] === '--tab') actions.push({ kind: 'tab', value: args[i + 1] });
}

// Realistic viewport heights per width tier (phone / tablet / desktop).
const HEIGHTS = { 390: 844, 768: 1024, 1024: 768, 1440: 900 };

const TEST_ATHLETE = {
  id: 424242,
  firstName: 'Test', lastName: 'Athlete',
  name: 'T. Athlete', initials: 'TA',
  sport: 'Baseball', position: 'Shortstop', age: 14,
  city: 'Miami', state: 'FL', location: 'Miami, FL',
  photo: null, banner: '/banner.jpg',
  stats: [
    { label: 'Exit Velo', value: 85, unit: 'mph', delta: null, pct: null, verified: 'self' },
    { label: '60 Yd Dash', value: 7.4, unit: 's', delta: null, pct: null, verified: 'self' },
    { label: 'Throw Velo', value: 74, unit: 'mph', delta: null, pct: null, verified: 'self' },
    { label: 'Pop Time', value: 2.2, unit: 's', delta: null, pct: null, verified: 'self' },
  ],
  level: 1, xp: 120, xpMax: 500,
  code: 'test-tiger-moon',
};
const TEST_WORKOUTS = [
  { id: 1, date: new Date().toISOString(), type: 'practice', duration: 90, intensity: 3, notes: 'Team practice, live at-bats.' },
  { id: 2, date: new Date(Date.now() - 86400000).toISOString(), type: 'strength', duration: 45, intensity: 4, notes: '' },
];
// A device-local coach so trainer detail / chat / booking flows render.
// Only ever seeded against a dev server running with cloud sync disabled.
const TEST_COACH = {
  id: 'test-coach-1', name: 'Sam Rivera', initials: 'SR',
  sport: 'Baseball', title: 'Hitting Coach', specialty: 'Exit velo development',
  location: 'Miami, FL', city: 'Miami', state: 'FL',
  rate: 60, rating: null, reviews: 0, athletes: 0, avgGain: null, commits: 0,
  modes: ['in_person', 'live_online', 'async'], badge: 'NEW COACH',
  bio: 'Former college infielder. Ten years coaching youth baseball in South Florida.',
  color: '#C5FF3D', cover: null, photo: null, years: 10,
  code: 'sam-coach-tiger',
};

const dir = resolve('.screenshots');
mkdirSync(dir, { recursive: true });

const browser = await chromium.launch();
try {
  for (const width of widths) {
    const height = tall ? 2400 : (HEIGHTS[width] || 900);
    const context = await browser.newContext({ viewport: { width, height } });
    if (seed) {
      await context.addInitScript(({ athlete, workouts, coach }) => {
        localStorage.setItem('coachme_athlete', JSON.stringify(athlete));
        localStorage.setItem(`coachme_workouts::${athlete.id}`, JSON.stringify(workouts));
        localStorage.setItem('coachme_coaches', JSON.stringify([coach]));
        localStorage.removeItem('coachme_signed_out');
      }, { athlete: TEST_ATHLETE, workouts: TEST_WORKOUTS, coach: TEST_COACH });
    }
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle' }).catch(() => page.goto(url));
    await page.waitForTimeout(1200);
    for (const action of actions) {
      if (action.kind === 'click') {
        // Exact text match first (so "Message" cannot hit the "Messages"
        // nav), falling back to substring; .last() prefers overlay content,
        // which renders after the app body. force: true skips the stability
        // check - cards scale down on mousedown (pressed state), which
        // otherwise loops the check forever.
        let loc = page.getByText(action.value, { exact: true }).last();
        if (await loc.count() === 0) loc = page.getByText(action.value, { exact: false }).last();
        await loc.click({ timeout: 5000, force: true }).catch(e => {
          console.error(`  [${width}] click "${action.value}" failed: ${e.message.split('\n')[0]}`);
        });
      } else {
        // Nav buttons have exactly the tab label as text (plus an optional
        // numeric unread badge); .last() skips same-named content buttons.
        const re = new RegExp(`^\\s*${action.value}\\s*\\d*\\s*$`, 'i');
        await page.locator('button').filter({ hasText: re }).last().click({ timeout: 5000 }).catch(e => {
          console.error(`  [${width}] tab click "${action.value}" failed: ${e.message.split('\n')[0]}`);
        });
      }
      await page.waitForTimeout(700);
    }
    const file = `${dir}/${out}-${width}${tall ? '-tall' : ''}.png`;
    await page.screenshot({ path: file });
    console.log(`saved ${file}`);
    await context.close();
  }
} finally {
  await browser.close();
}
