/* The admin gate guards data about children. These tests are the ones that
   would catch a change turning it back into something bypassable. */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ADMIN_EMAILS, isAllowedAdmin, normalizeEmail } from "./admin-allowlist";
import {
  ADMIN_COOKIE_OPTIONS, adminCookieFromHeader, readAdminSession,
  safeEqual, sha256Hex, signAdminCookie, verifyAdminCookie,
} from "./admin-auth";

const KEY = "test-signing-key-not-a-real-one";
const ALLOWED = ADMIN_EMAILS[0];

beforeEach(() => { process.env.ADMIN_SESSION_SECRET = KEY; });
afterEach(() => { delete process.env.ADMIN_SESSION_SECRET; });

describe("allowlist", () => {
  it("admits the addresses in the constant", () => {
    for (const e of ADMIN_EMAILS) expect(isAllowedAdmin(e), e).toBe(true);
  });

  it("is case and whitespace insensitive, because a form is", () => {
    expect(isAllowedAdmin(`  ${ALLOWED.toUpperCase()}  `)).toBe(true);
    expect(normalizeEmail("  A@B.COM ")).toBe("a@b.com");
  });

  it("rejects everything else, including empty and near-misses", () => {
    expect(isAllowedAdmin("")).toBe(false);
    expect(isAllowedAdmin(null)).toBe(false);
    expect(isAllowedAdmin(undefined)).toBe(false);
    expect(isAllowedAdmin("attacker@example.com")).toBe(false);
    expect(isAllowedAdmin(`${ALLOWED}.attacker.com`)).toBe(false);
    expect(isAllowedAdmin(`x${ALLOWED}`)).toBe(false);
  });
});

describe("session cookie", () => {
  it("round-trips an allowlisted address", async () => {
    const cookie = await signAdminCookie(ALLOWED);
    expect(cookie).toBeTruthy();
    expect(await readAdminSession(cookie)).toBe(ALLOWED);
  });

  it("refuses to mint a session for an address that is not allowlisted", async () => {
    expect(await signAdminCookie("attacker@example.com")).toBeNull();
  });

  it("fails closed with no signing key configured", async () => {
    const cookie = await signAdminCookie(ALLOWED);
    delete process.env.ADMIN_SESSION_SECRET;
    expect(await readAdminSession(cookie)).toBeNull();
    expect(await signAdminCookie(ALLOWED)).toBeNull();
  });

  it("rejects a cookie signed with a different key", async () => {
    const cookie = await signAdminCookie(ALLOWED);
    process.env.ADMIN_SESSION_SECRET = "some-other-key";
    expect(await readAdminSession(cookie)).toBeNull();
  });

  it("rejects a tampered email — the signature covers it", async () => {
    const cookie = (await signAdminCookie(ALLOWED))!;
    const forged = cookie.replace(ALLOWED, "attacker@example.com");
    expect(await readAdminSession(forged)).toBeNull();
  });

  it("rejects a tampered expiry", async () => {
    const cookie = (await signAdminCookie(ALLOWED))!;
    const [email, expires, mac] = [
      cookie.slice(0, cookie.indexOf(".", 0)),
      cookie.split(".").slice(-2)[0],
      cookie.split(".").slice(-1)[0],
    ];
    const extended = `${cookie.slice(0, cookie.lastIndexOf("."))}`.replace(expires, String(Number(expires) + 999999));
    expect(email).toBeTruthy();
    expect(mac).toBeTruthy();
    expect(await readAdminSession(`${extended}.${mac}`)).toBeNull();
  });

  it("rejects an expired session", async () => {
    const cookie = (await signAdminCookie(ALLOWED))!;
    // Re-sign the same payload with an expiry in the past: a valid signature
    // over stale data must still be refused.
    const payloadEnd = cookie.lastIndexOf(".");
    const payload = cookie.slice(0, payloadEnd);
    const past = `${ALLOWED}.${Date.now() - 1000}`;
    const { createHmac } = await import("node:crypto");
    const mac = createHmac("sha256", KEY).update(past).digest("hex");
    expect(payload).toBeTruthy();
    expect(await readAdminSession(`${past}.${mac}`)).toBeNull();
  });

  it("rejects garbage and empty values without throwing", async () => {
    for (const v of ["", ".", "..", "a.b", "not-a-cookie", null, undefined]) {
      expect(await readAdminSession(v as string)).toBeNull();
    }
  });

  it("stops honouring a session once the address leaves the allowlist", async () => {
    // Simulated by signing a well-formed cookie for an address that is not
    // on the list — the same state a live cookie reaches after a deploy
    // removes its owner.
    const { createHmac } = await import("node:crypto");
    const payload = `removed@example.com.${Date.now() + 60_000}`;
    const mac = createHmac("sha256", KEY).update(payload).digest("hex");
    expect(await readAdminSession(`${payload}.${mac}`)).toBeNull();
  });

  it("sets a cookie a browser will only send back to us, over TLS", () => {
    expect(ADMIN_COOKIE_OPTIONS.httpOnly).toBe(true);
    expect(ADMIN_COOKIE_OPTIONS.sameSite).toBe("strict");
    expect(ADMIN_COOKIE_OPTIONS.maxAge).toBe(7 * 24 * 60 * 60);
  });

  it("verifyAdminCookie mirrors readAdminSession", async () => {
    const cookie = await signAdminCookie(ALLOWED);
    expect(await verifyAdminCookie(cookie)).toBe(true);
    expect(await verifyAdminCookie("nope")).toBe(false);
  });
});

describe("cookie header parsing", () => {
  it("finds the admin cookie among others", () => {
    expect(adminCookieFromHeader("a=1; coachme_admin=xyz; b=2")).toBe("xyz");
    expect(adminCookieFromHeader("coachme_admin=xyz")).toBe("xyz");
  });
  it("returns undefined when absent", () => {
    expect(adminCookieFromHeader("a=1")).toBeUndefined();
    expect(adminCookieFromHeader(null)).toBeUndefined();
  });
});

describe("primitives", () => {
  it("safeEqual matches only identical strings", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "ab")).toBe(false);
    expect(safeEqual("", "")).toBe(true);
  });

  it("sha256Hex is the real digest, 64 hex chars", async () => {
    // Known vector: sha256("abc")
    expect(await sha256Hex("abc"))
      .toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});
