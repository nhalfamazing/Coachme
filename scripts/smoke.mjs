// Functional smoke test for the athlete app against a LOCAL dev server
// running with cloud sync disabled (see .env.development.local): signs up
// a fresh athlete through the wizard, logs a workout, opens a drill
// sheet, signs out, and reports every console error seen along the way.
//
//   node scripts/smoke.mjs [url] [width]
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:3000';
const width = Number(process.argv[3] || 1440);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width, height: width <= 480 ? 844 : 900 } });
const page = await context.newPage();

const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', err => errors.push(`PAGEERROR: ${err.message}`));
page.on('dialog', d => d.accept());

const step = async (name, fn) => {
  try { await fn(); console.log(`ok   ${name}`); }
  catch (e) { console.log(`FAIL ${name}: ${e.message.split('\n')[0]}`); process.exitCode = 1; }
};
const click = (text) => page.getByText(text, { exact: true }).last().click({ force: true, timeout: 8000 });

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);

await step('landing loads', async () => {
  await page.getByText('PROVE YOUR').first().waitFor({ timeout: 8000 });
});

await step('signup step 1: name', async () => {
  await page.getByText(/Sign up as athlete|New here\? Get started/).last().click({ force: true });
  await page.getByPlaceholder('Noah').fill('Smoke');
  await page.getByPlaceholder('Scarlett').fill('Tester');
  await click('Continue');
});

await step('signup step 2: sport/position/age', async () => {
  const selects = page.locator('select');
  await selects.nth(0).selectOption({ index: 1 }); // Baseball
  await page.waitForTimeout(300);
  await page.locator('select').nth(1).selectOption({ index: 1 }); // first position
  await page.locator('select').nth(2).selectOption({ index: 9 }); // an age
  await click('Continue');
});

await step('signup step 3: location', async () => {
  await page.getByPlaceholder('Start typing your city').fill('Miami');
  await click('Continue');
});

await step('signup step 4: skip stats', async () => {
  await click('Skip for now');
});

await step('signup done -> app', async () => {
  await click('Open my CoachMe');
  await page.getByText('TRAINING LOG').first().waitFor({ timeout: 8000 });
});

await step('log a workout', async () => {
  await click('LOG WORKOUT');
  await page.getByPlaceholder('60').fill('45');
  await click('Save workout');
  await page.getByText('45 MIN').first().waitFor({ timeout: 8000 });
});

await step('open a drill sheet', async () => {
  const re = /^\s*\d*\s*Trainers\s*$/i;
  await page.locator('button').filter({ hasText: re }).last().click({ force: true });
  await page.waitForTimeout(600);
  await page.getByText('Tee Work', { exact: false }).first().click({ force: true });
  await page.getByText('WATCH THE DEMO').first().waitFor({ timeout: 8000 });
  const videos = await page.locator('video').count();
  if (videos < 2) throw new Error(`expected 2 videos, saw ${videos}`);
  // Close the sheet via its backdrop (top-left corner is always backdrop
  // on phone and desktop; Escape is not wired up).
  await page.mouse.click(8, 8);
  await page.waitForTimeout(500);
});

await step('sign out', async () => {
  const re = /^\s*\d*\s*Profile\s*$/i;
  await page.locator('button').filter({ hasText: re }).last().click({ force: true });
  await page.waitForTimeout(600);
  await page.getByText('SIGN OUT', { exact: true }).last().click({ force: true });
  await page.getByText('PROVE YOUR').first().waitFor({ timeout: 8000 });
});

console.log(errors.length ? `\nconsole errors (${errors.length}):` : '\nno console errors');
for (const e of [...new Set(errors)]) console.log(`  - ${e.slice(0, 200)}`);
await browser.close();
