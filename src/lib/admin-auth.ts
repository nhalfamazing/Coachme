// Admin gate for /admin and /api/admin/*.
//
// Model: one shared ADMIN_SECRET (env, never in the client bundle).
// Logging in posts the secret; the server compares in constant time and
// sets an httpOnly cookie holding an HMAC-signed expiry. The cookie
// value is `${expiresMs}.${hmacSHA256(expiresMs, ADMIN_SECRET)}` so it
// is unforgeable without the secret and self-expires. Web Crypto only,
// so the same code runs in middleware (edge) and node routes.
//
// This is deliberately NOT a user-auth system (house rule: no auth work
// beyond this gate). One admin, one secret, 24h sessions.

export const ADMIN_COOKIE = "coachme_admin";
const SESSION_MS = 24 * 60 * 60 * 1000;

function secret(): string | null {
  return process.env.ADMIN_SECRET || null;
}

async function hmacHex(value: string, key: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(value));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time string equality (length leak only). */
export function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

/** True when the posted secret matches ADMIN_SECRET. */
export function checkAdminSecret(candidate: string): boolean {
  const s = secret();
  if (!s) return false;
  return safeEqual(candidate, s);
}

/** Mint the signed cookie value. */
export async function signAdminCookie(): Promise<string | null> {
  const s = secret();
  if (!s) return null;
  const expires = String(Date.now() + SESSION_MS);
  return `${expires}.${await hmacHex(expires, s)}`;
}

/** Verify a cookie value: signature and expiry. */
export async function verifyAdminCookie(value: string | undefined | null): Promise<boolean> {
  const s = secret();
  if (!s || !value) return false;
  const dot = value.indexOf(".");
  if (dot <= 0) return false;
  const expires = value.slice(0, dot);
  const mac = value.slice(dot + 1);
  if (!/^\d{10,16}$/.test(expires)) return false;
  if (Number(expires) < Date.now()) return false;
  const expected = await hmacHex(expires, s);
  return safeEqual(mac, expected);
}
