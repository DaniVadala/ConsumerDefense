// SEC: Rate limiter with Upstash Redis backend (production, global across all serverless instances)
// and in-memory sliding-window fallback (dev/test, no env vars needed).
// Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable the Redis backend.

import { Ratelimit } from '@upstash/ratelimit';
import { getRedisClient } from '@/lib/redis';

// ─── In-memory fallback ───────────────────────────────────────────────────────

interface SlidingWindow {
  timestamps: number[];
}

const windows = new Map<string, SlidingWindow>();
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupMemory(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  for (const [key, win] of windows) {
    win.timestamps = win.timestamps.filter((t) => t > cutoff);
    if (win.timestamps.length === 0) windows.delete(key);
  }
}

function rateLimitMemory(
  key: string,
  { maxRequests, windowMs }: { maxRequests: number; windowMs: number },
): { success: boolean } {
  cleanupMemory(windowMs);
  const now = Date.now();
  const cutoff = now - windowMs;
  let win = windows.get(key);
  if (!win) {
    win = { timestamps: [] };
    windows.set(key, win);
  }
  win.timestamps = win.timestamps.filter((t) => t > cutoff);
  if (win.timestamps.length >= maxRequests) return { success: false };
  win.timestamps.push(now);
  return { success: true };
}

// ─── Upstash backend ──────────────────────────────────────────────────────────

// Convert milliseconds to Upstash Duration string (e.g. 60_000 → "60 s")
function msToUpstashDuration(ms: number): string {
  if (ms < 1_000) return `${ms} ms`;
  if (ms < 60_000) return `${Math.round(ms / 1_000)} s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)} m`;
  return `${Math.round(ms / 3_600_000)} h`;
}

// Cache Ratelimit instances by config to avoid re-creating on every request
const limiters = new Map<string, Ratelimit>();

function getLimiter(maxRequests: number, windowMs: number): Ratelimit {
  const cacheKey = `${maxRequests}:${windowMs}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: getRedisClient()!,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      limiter: Ratelimit.slidingWindow(maxRequests, msToUpstashDuration(windowMs) as any),
      prefix: '@defensaya/rl',
      analytics: false,
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Check if a request should be rate-limited.
 * Uses Upstash Redis when configured (global across serverless instances),
 * falls back to in-memory sliding window in dev/test.
 */
export async function rateLimit(
  key: string,
  { maxRequests, windowMs }: { maxRequests: number; windowMs: number },
): Promise<{ success: boolean }> {
  if (!getRedisClient()) {
    return rateLimitMemory(key, { maxRequests, windowMs });
  }
  const { success } = await getLimiter(maxRequests, windowMs).limit(key);
  return { success };
}
