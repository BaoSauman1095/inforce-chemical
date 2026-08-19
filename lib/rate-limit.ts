import type { NextRequest } from "next/server";

// Very small in-memory rate limiter: good enough to stop accidental
// double-submits and basic bot spam on a single-instance deployment.
// Not a strict limit across multiple serverless instances — see README.
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;
const requestLog = new Map<string, number[]>();

/** `key` should include a route-specific prefix (e.g. `order:${ip}`) so routes don't share buckets. */
export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  requestLog.set(key, timestamps);
  return timestamps.length > MAX_REQUESTS;
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
