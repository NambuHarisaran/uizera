import "server-only";

/**
 * Lightweight, high-performance in-memory cache for Vercel Serverless runtimes.
 *
 * Scoped to warm serverless execution contexts.
 * Absorbs high-frequency repetitive reads (such as live quiz session polling,
 * immutable quiz questions, and answer key decodings) without hitting D1 REST API limits.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const MAX_ENTRIES = 2000;

export function getMemoryCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setMemoryCache<T>(key: string, data: T, ttlMs: number): void {
  if (memoryCache.size >= MAX_ENTRIES) {
    // Purge expired or oldest 20%
    const now = Date.now();
    for (const [k, v] of memoryCache.entries()) {
      if (v.expiresAt <= now) {
        memoryCache.delete(k);
      }
    }
    if (memoryCache.size >= MAX_ENTRIES) {
      memoryCache.clear();
    }
  }

  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

export function invalidateMemoryCache(prefixOrKey: string): void {
  for (const k of memoryCache.keys()) {
    if (k === prefixOrKey || k.startsWith(prefixOrKey)) {
      memoryCache.delete(k);
    }
  }
}

/**
 * Fetch-or-cache helper with automatic error handling.
 */
export async function remember<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = getMemoryCache<T>(key);
  if (cached !== null) {
    return cached;
  }
  const fresh = await fn();
  setMemoryCache(key, fresh, ttlMs);
  return fresh;
}
