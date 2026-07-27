// Shared plumbing for the Phase 1 API routes. Everything that touches the
// SERVICE ROLE key lives under /app/api — never import this from client code.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import type { ZodType } from "zod";

let cached: SupabaseClient | null = null;

/** Service-role Supabase client, or null when the server env is not
 *  configured. Null must always surface to the caller as a 503 so the
 *  app falls back to localStorage-only. */
export function db(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // server-only, no NEXT_PUBLIC
  if (!url || !key) return null;
  if (!cached) {
    cached = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

export function cloudDisabled() {
  return NextResponse.json({ cloud: "disabled" }, { status: 503 });
}

export function jsonError(status: number, error: string, message?: string) {
  return NextResponse.json({ error, ...(message ? { message } : {}) }, { status });
}

export function ok(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status });
}

/** Wrap a route body: known errors pass through, everything unexpected is
 *  reported to Sentry and becomes a typed 500. */
export async function guarded(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (err) {
    Sentry.captureException(err);
    return jsonError(500, "internal", "Something went wrong.");
  }
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<{ data: T } | { response: Response }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { response: jsonError(400, "bad_json", "Body must be JSON.") };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { response: jsonError(400, "invalid_input", parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ")) };
  }
  return { data: parsed.data };
}

/* Best-effort rate limiting: an in-memory token bucket per IP per route.
   LIMITATION: on serverless (Vercel), each lambda instance holds its own
   buckets, they reset on cold start, and instances do not share state —
   so this only smooths bursts against a single warm instance. Real rate
   limiting needs a shared store (Upstash/Redis) in a later phase. */
const buckets = new Map<string, { tokens: number; last: number }>();
const CAPACITY = 40;
const REFILL_PER_SEC = 1;

export function rateLimited(req: Request, route: string): Response | null {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const key = `${ip}:${route}`;
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: CAPACITY, last: now };
  b.tokens = Math.min(CAPACITY, b.tokens + ((now - b.last) / 1000) * REFILL_PER_SEC);
  b.last = now;
  if (b.tokens < 1) {
    buckets.set(key, b);
    return jsonError(429, "rate_limited", "Too many requests, slow down.");
  }
  b.tokens -= 1;
  buckets.set(key, b);
  if (buckets.size > 10_000) buckets.clear(); // crude memory cap
  return null;
}

export function normalizeCode(input: string): string {
  return String(input || "")
    .trim().toLowerCase()
    .replace(/[\s._,/]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Look up one profile row by 3-word code. Returns null when not found. */
export async function profileByCode(client: SupabaseClient, code: string) {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("code", normalizeCode(code))
    .limit(1);
  if (error) throw new Error(`profiles lookup failed: ${error.message}`);
  return (data && data[0]) || null;
}
