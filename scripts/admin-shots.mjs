// Screenshots of the admin console: login gate (unauthenticated) and
// each queue view (authenticated via the same login flow a human uses).
// Reads ADMIN_SECRET like admin-gate-check.mjs and never prints it.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const base = process.argv[2] || "http://localhost:3000";
let SECRET = null;
for (const file of [".env.production.local", ".env.development.local", ".env.local"]) {
  try {
    const m = readFileSync(file, "utf8").match(/^ADMIN_SECRET=(.+)$/m);
    if (m && m[1].trim()) { SECRET = m[1].trim(); break; }
  } catch { /* skip */ }
}

const browser = await chromium.launch();
for (const width of [390, 1440]) {
  const context = await browser.newContext({ viewport: { width, height: width <= 480 ? 844 : 900 } });
  const page = await context.newPage();

  await page.goto(`${base}/admin`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `.screenshots/adm-login-${width}.png` });

  if (SECRET) {
    await page.fill('input[name="secret"]', SECRET);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `.screenshots/adm-overview-${width}.png` });
    for (const view of ["flags", "reports", "coaches"]) {
      await page.goto(`${base}/admin/${view}`, { waitUntil: "networkidle" });
      await page.screenshot({ path: `.screenshots/adm-${view}-${width}.png` });
    }
  }
  await context.close();
}
await browser.close();
console.log("admin screenshots saved");
