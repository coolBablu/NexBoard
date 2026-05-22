/**
 * Lightweight in-memory rate limiter.
 *
 * Designed for serverless: works fine on a single Vercel function
 * instance (each region keeps its own counters in module scope).
 * For multi-instance strict limits switch to Upstash / Vercel KV
 * (`@upstash/ratelimit`) — the API here is shaped to match.
 *
 * Usage:
 *   const limited = await rateLimit(req, { window: "10s", limit: 5 });
 *   if (!limited.ok) return tooMany(limited);
 *
 * Returns `{ ok, remaining, reset }` and a ready-to-spread headers
 * object compatible with the IETF draft `RateLimit-*` headers.
 */

import { NextResponse } from "next/server";

interface Bucket {
  tokens: number;
  resetAt: number;
}

const store: Map<string, Bucket> = (() => {
  const g = globalThis as unknown as { __nf_rate_store?: Map<string, Bucket> };
  if (!g.__nf_rate_store) g.__nf_rate_store = new Map();
  return g.__nf_rate_store;
})();

export type Window = "1s" | "5s" | "10s" | "30s" | "1m" | "5m" | "1h";

const WINDOW_MS: Record<Window, number> = {
  "1s": 1_000,
  "5s": 5_000,
  "10s": 10_000,
  "30s": 30_000,
  "1m": 60_000,
  "5m": 300_000,
  "1h": 3_600_000,
};

export interface RateLimitOptions {
  /** Time window (e.g. "10s"). */
  window: Window;
  /** Max requests inside that window per key. */
  limit: number;
  /** Custom key. Falls back to client IP + bucket name. */
  key?: string;
  /** Bucket name (so /api/login and /api/signup don't share counters). */
  name?: string;
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  /** Unix seconds when this bucket resets. */
  reset: number;
  /** Headers to spread on the outgoing response. */
  headers: Record<string, string>;
}

export function rateLimit(
  request: Request,
  opts: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const windowMs = WINDOW_MS[opts.window];
  const ip = getClientIp(request);
  const key = `${opts.name || "default"}:${opts.key || ip}`;

  // GC stale buckets opportunistically (cheap; ~once per 1k calls).
  if (Math.random() < 0.001) gc(now);

  let bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { tokens: opts.limit, resetAt: now + windowMs };
    store.set(key, bucket);
  }

  const ok = bucket.tokens > 0;
  if (ok) bucket.tokens -= 1;

  const remaining = Math.max(0, bucket.tokens);
  const reset = Math.ceil(bucket.resetAt / 1000);
  const headers: Record<string, string> = {
    "RateLimit-Limit": String(opts.limit),
    "RateLimit-Remaining": String(remaining),
    "RateLimit-Reset": String(Math.max(0, reset - Math.floor(now / 1000))),
    "RateLimit-Policy": `${opts.limit};w=${Math.floor(windowMs / 1000)}`,
  };
  if (!ok) headers["Retry-After"] = headers["RateLimit-Reset"];

  return { ok, limit: opts.limit, remaining, reset, headers };
}

/** 429 response with the right headers populated. */
export function tooMany(result: RateLimitResult, message?: string) {
  return NextResponse.json(
    {
      error: message || "Too many requests — please slow down.",
      retryAfter: Number(result.headers["Retry-After"]) || 60,
    },
    { status: 429, headers: result.headers }
  );
}

function getClientIp(req: Request): string {
  // Vercel sets x-forwarded-for; the first value is the real client.
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "anonymous";
}

function gc(now: number): void {
  for (const [k, b] of store) if (b.resetAt <= now) store.delete(k);
}
