import "server-only";

import { ApiError } from "@/lib/server/api";

/**
 * Lightweight in-memory sliding-window rate limiter.
 *
 * Scope: per server instance. On serverless deployments each instance keeps
 * its own window, so treat this as burst protection / abuse friction, not a
 * hard quota. Hard guarantees (single quiz attempt, one submission per
 * challenge) are enforced with Firestore transactions, not this limiter.
 */

const buckets = new Map<string, number[]>();
const MAX_KEYS = 5_000;

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): void {
  const now = Date.now();

  if (buckets.size >= MAX_KEYS) {
    // Purge expired keys
    for (const [k, timestamps] of buckets.entries()) {
      const active = timestamps.filter((t) => now - t < windowMs);
      if (active.length === 0) {
        buckets.delete(k);
      } else {
        buckets.set(k, active);
      }
    }
    if (buckets.size >= MAX_KEYS) {
      buckets.clear();
    }
  }

  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    throw new ApiError(429, "Too many requests. Please slow down and try again.");
  }
  hits.push(now);
  buckets.set(key, hits);
}
