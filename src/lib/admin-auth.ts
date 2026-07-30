// Admin session cookie for /admin and /api/admin/*.
//
// Model: passwordless. The email inbox is the credential — a magic link is
// emailed, redeemed once, and exchanged for this cookie. Nothing here is a
// password: there is no shared secret an admin types, so there is nothing to
// leak, forget, or phish out of them.
//
// The cookie value is `${email}.${expiresMs}.${hmacSHA256(email.expiresMs)}`,
// signed with ADMIN_SESSION_SECRET. That secret is a SIGNING KEY, never a
// credential: knowing it does not get you in, because verification also
// re-checks the email against the code allowlist on every request. Deleting
// somebody from ADMIN_EMAILS and deploying therefore kills their live session
// immediately, rather than leaving it valid until the cookie expires.
//
// Web Crypto only, so the same code runs in edge middleware and node routes.
//
// Fails CLOSED: no signing key configured means no session verifies and the
// console is inaccessible. For a console holding data about children, locked
// out is the correct failure mode.

import { isAllowedAdmin, normalizeEmail } from "./admin-allowlist";

export const ADMIN_COOKIE = "coachme_admin";
export const ADMIN_SESSION_DAYS = 7;
const SESSION_MS = ADMIN_SESSION_DAYS * 24 * 60 * 60 * 1000;

function signingKey(): string | null {
  return process.env.ADMIN_SESSION_SECRET || null;
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

/** SHA-256 hex. Used to hash magic-link tokens at rest. */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/** Mint the signed cookie value for a verified admin. Returns null when the
 *  address is not allowlisted or no signing key is configured. */
export async function signAdminCookie(email: string): Promise<string | null> {
  const key = signingKey();
  const normalized = normalizeEmail(email);
  if (!key || !isAllowedAdmin(normalized)) return null;
  const expires = String(Date.now() + SESSION_MS);
  const payload = `${normalized}.${expires}`;
  return `${payload}.${await hmacHex(payload, key)}`;
}

/** Verify a cookie value and return the signed-in address, or null.
 *
 *  Three independent checks, all of which must pass: the signature is ours,
 *  the session has not expired, and the address is STILL on the allowlist.
 *
 *  Parsed from the right, because an email address contains dots: the last
 *  two segments are always the expiry and the signature. */
export async function readAdminSession(value: string | undefined | null): Promise<string | null> {
  const key = signingKey();
  if (!key || !value) return null;

  const lastDot = value.lastIndexOf(".");
  if (lastDot <= 0) return null;
  const mac = value.slice(lastDot + 1);
  const payload = value.slice(0, lastDot);
  const secondDot = payload.lastIndexOf(".");
  if (secondDot <= 0) return null;
  const expires = payload.slice(secondDot + 1);
  const email = payload.slice(0, secondDot);

  if (!/^\d{10,16}$/.test(expires)) return null;
  if (Number(expires) < Date.now()) return null;

  const expected = await hmacHex(payload, key);
  if (!safeEqual(mac, expected)) return null;

  // Re-checked on every request, not only at sign-in: this is what makes
  // removing an address from ADMIN_EMAILS take effect on the next deploy.
  if (!isAllowedAdmin(email)) return null;
  return email;
}

/** Convenience for callers that only need a yes/no. */
export async function verifyAdminCookie(value: string | undefined | null): Promise<boolean> {
  return (await readAdminSession(value)) !== null;
}

/** Pull the admin cookie value out of a raw Cookie header. */
export function adminCookieFromHeader(cookieHeader: string | null): string | undefined {
  const match = (cookieHeader ?? "").match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
  return match?.[1];
}

/** The options every place that sets this cookie must use. SameSite=Strict:
 *  the console is never legitimately reached by a cross-site navigation. */
export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: SESSION_MS / 1000,
};
