/**
 * IP-based conversation rate limiter.
 * Allows MAX_CONVERSATIONS new chat sessions per IP per WINDOW_SECONDS.
 * Uses the same Redis setup as redis-session.ts (in-memory fallback for local dev).
 */

const WINDOW_SECONDS = 24 * 60 * 60; // 24 hours
const MAX_CONVERSATIONS = 3;
const KEY_PREFIX = 'rl:conv:';

// In-memory fallback (mirrors redis-session.ts pattern)
const inMemory = new Map<string, { count: number; expiresAt: number }>();

const isRedisConfigured =
  typeof process.env.UPSTASH_REDIS_REST_URL === 'string' &&
  process.env.UPSTASH_REDIS_REST_URL.length > 0;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let redis: any = null;
if (isRedisConfigured) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Redis } = require('@upstash/redis') as typeof import('@upstash/redis');
  redis = Redis.fromEnv();
}

/** How many seconds remain until the window resets for this IP. */
async function getTtl(ip: string): Promise<number> {
  if (redis) {
    const t = await redis.ttl(KEY_PREFIX + ip) as number;
    return t > 0 ? t : WINDOW_SECONDS;
  }
  const entry = inMemory.get(KEY_PREFIX + ip);
  if (!entry || Date.now() > entry.expiresAt) return WINDOW_SECONDS;
  return Math.ceil((entry.expiresAt - Date.now()) / 1000);
}

/**
 * Check whether this IP has exhausted its daily quota.
 * Returns { limited: false } if allowed, or { limited: true, ttl } if blocked.
 */
export async function checkRateLimit(
  ip: string,
  bypassToken?: string,
): Promise<{ limited: false } | { limited: true; ttl: number }> {
  // Secret bypass (admin access via ?bypass=TOKEN in URL)
  const secret = process.env.RATE_LIMIT_BYPASS_TOKEN;
  if (secret && bypassToken === secret) return { limited: false };

  const key = KEY_PREFIX + ip;
  let count = 0;

  try {
    if (redis) {
      count = ((await redis.get(key)) as number) ?? 0;
    } else {
      const entry = inMemory.get(key);
      if (entry && Date.now() <= entry.expiresAt) count = entry.count;
    }
  } catch {
    return { limited: false }; // fail open — don't block on Redis errors
  }

  if (count >= MAX_CONVERSATIONS) {
    const ttl = await getTtl(ip);
    return { limited: true, ttl };
  }

  return { limited: false };
}

/**
 * Record one new conversation for this IP.
 * Call this only when a new session is actually created.
 */
export async function incrementConversationCount(ip: string, bypassToken?: string): Promise<void> {
  const secret = process.env.RATE_LIMIT_BYPASS_TOKEN;
  if (secret && bypassToken === secret) return;

  const key = KEY_PREFIX + ip;

  try {
    if (redis) {
      const count = (await redis.incr(key)) as number;
      if (count === 1) await redis.expire(key, WINDOW_SECONDS);
    } else {
      const now = Date.now();
      const entry = inMemory.get(key);
      if (!entry || now > entry.expiresAt) {
        inMemory.set(key, { count: 1, expiresAt: now + WINDOW_SECONDS * 1000 });
      } else {
        entry.count++;
      }
    }
  } catch {
    // Ignore Redis errors for rate limiting — fail open
  }
}

/** Extract the best-available client IP from Next.js request headers. */
export function extractClientIp(req: Request): string {
  const headers = req instanceof Request ? req.headers : new Headers();
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const xri = headers.get('x-real-ip');
  if (xri) return xri.trim();
  return '127.0.0.1';
}
