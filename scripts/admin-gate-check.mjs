// Verifies the /admin magic-link gate end to end against a running server.
//
//   node scripts/admin-gate-check.mjs [baseUrl]
//
// Reads ADMIN_SESSION_SECRET from the env files to mint test session cookies
// locally, and NEVER prints it. No magic-link token is ever created, printed,
// or logged here — token lifecycle (expiry, single use, hashing at rest) is
// exercised directly against the database, not through this script.
//
// What this asserts, in one line each:
//   - every admin surface is closed while signed out,
//   - the link-request endpoint tells a stranger exactly what it tells an
//     admin, so it cannot be used to find out who has access,
//   - failed redemption never issues a session,
//   - and expired, tampered, or off-allowlist cookies are all refused.
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";

const base = process.argv[2] || "http://localhost:3000";

let KEY = null;
for (const file of [".env.production.local", ".env.development.local", ".env.local"]) {
  try {
    const m = readFileSync(file, "utf8").match(/^ADMIN_SESSION_SECRET=(.+)$/m);
    if (m && m[1].trim()) { KEY = m[1].trim(); break; }
  } catch { /* file may not exist */ }
}
if (!KEY) { console.log("FAIL: no ADMIN_SESSION_SECRET found in env files"); process.exit(1); }

// Must match src/lib/admin-allowlist.ts.
const ALLOWED = "rscarlett@netaesthetics.com";
const STRANGER = "someone-else@example.com";

let pass = 0, fail = 0;
const check = (name, ok, extra = "") => {
  ok ? pass++ : fail++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${extra ? `  (${extra})` : ""}`);
};

/** Mint a session cookie the way the server does. Local verification only. */
const cookieFor = (email, expiresAt = Date.now() + 60_000) => {
  const payload = `${email}.${expiresAt}`;
  return `${payload}.${createHmac("sha256", KEY).update(payload).digest("hex")}`;
};
const get = (path, cookie) => fetch(base + path, {
  redirect: "manual", headers: cookie ? { cookie: `coachme_admin=${cookie}` } : {},
});

// 1. Signed out, nothing in the console is reachable.
for (const path of ["/admin", "/admin/audit", "/admin/flags", "/admin/reports", "/admin/coaches"]) {
  const r = await get(path);
  const loc = r.headers.get("location") || "";
  check(`signed out: ${path} -> login`, r.status >= 300 && r.status < 400 && loc.includes("/admin/login"), String(r.status));
}

// 2. Admin APIs answer 401 rather than redirecting a form post into HTML.
const api = await fetch(`${base}/api/admin/flags/some-id`, { method: "POST", body: new URLSearchParams({ action: "dismiss" }) });
check("signed out: admin API -> 401", api.status === 401, String(api.status));

// 3. The login page itself stays open, or nobody could ever sign in.
const login = await get("/admin/login");
check("login page is reachable", login.status === 200, String(login.status));

// 4. The request endpoint must not reveal who is on the allowlist.
const post = (email) => fetch(`${base}/api/admin/auth/request`, {
  method: "POST", redirect: "manual",
  headers: { "content-type": "application/json" }, body: JSON.stringify({ email }),
});
const [ra, rb, rc] = [await post(ALLOWED), await post(STRANGER), await post("not-an-email")];
const [ta, tb, tc] = [await ra.text(), await rb.text(), await rc.text()];
check("allowlisted and stranger get the same status", ra.status === rb.status, `${ra.status} vs ${rb.status}`);
check("allowlisted and stranger get the same body", ta === tb);
check("malformed input gets the same answer", tc === ta);
check("no token appears in any response body", !/[0-9a-f]{64}/.test(ta + tb + tc));
check("a link request never sets a session cookie", !ra.headers.get("set-cookie"));

// 5. Redemption failures issue nothing.
const bad = await get("/api/admin/auth/verify?token=nope");
check("malformed token refused", (bad.headers.get("location") || "").includes("status=invalid"), String(bad.status));
const unknown = await get(`/api/admin/auth/verify?token=${"a".repeat(64)}`);
check("unknown token refused", (unknown.headers.get("location") || "").includes("status=invalid"));
check("no session cookie on failed redemption",
  !(bad.headers.get("set-cookie") || "").includes("coachme_admin="));

// 6. A real session opens the console and names who is signed in.
const good = await get("/admin", cookieFor(ALLOWED));
const goodBody = await good.text();
check("valid session opens the console", good.status === 200, String(good.status));
check("console header shows the signed-in address", goodBody.includes(ALLOWED));

// 7. The three ways a cookie can be wrong.
check("off-allowlist cookie refused", (await get("/admin", cookieFor(STRANGER))).status >= 300);
check("expired cookie refused", (await get("/admin", cookieFor(ALLOWED, Date.now() - 1000))).status >= 300);
check("tampered signature refused", (await get("/admin", cookieFor(ALLOWED).slice(0, -2) + "ff")).status >= 300);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
