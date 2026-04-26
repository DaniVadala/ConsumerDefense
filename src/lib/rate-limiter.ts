/**
 * IP-based conversation rate limiter.
 *
 * Three rolling 24-hour counters per IP (Upstash Redis when configured, else in-memory):
 *   rl:conv:{hash}  — conversations started
 *   rl:nc:{hash}    — reserved for future outcome tracking
 *   rl:ab:{hash}    — reserved for future outcome tracking
 *
 * Uses Upstash Redis when configured; falls back to an in-memory map for local dev.
 */

import { MAX_NC_CONVERSATIONS, MAX_ABUSIVE_CONVERSATIONS } from './rate-limits';
import { hashIp as _hashIp } from './hash-ip';

const WINDOW_SECONDS = 24 * 60 * 60;
const MAX_CONVERSATIONS = 3;

const KEY_PREFIX = 'rl:conv:';
const NC_KEY_PREFIX = 'rl:nc:';
const AB_KEY_PREFIX = 'rl:ab:';

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

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function getCount(key: string): Promise<number> {
  try {
    if (redis) return ((await redis.get(key)) as number) ?? 0;
    const entry = inMemory.get(key);
    if (entry && Date.now() <= entry.expiresAt) return entry.count;
    return 0;
  } catch {
    return 0;
  }
}

async function getTtlForKey(key: string): Promise<number> {
  if (redis) {
    const t = (await redis.ttl(key)) as number;
    return t > 0 ? t : WINDOW_SECONDS;
  }
  const entry = inMemory.get(key);
  if (!entry || Date.now() > entry.expiresAt) return WINDOW_SECONDS;
  return Math.ceil((entry.expiresAt - Date.now()) / 1000);
}

async function incrementKey(key: string): Promise<void> {
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
    // fail open
  }
}

async function deleteKey(key: string): Promise<void> {
  try {
    if (redis) {
      await redis.del(key);
    } else {
      inMemory.delete(key);
    }
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function checkRateLimit(
  ip: string,
  bypassToken?: string,
): Promise<{ limited: false } | { limited: true; ttl: number }> {
  const secret = process.env.RATE_LIMIT_BYPASS_TOKEN;
  if (secret && bypassToken === secret) return { limited: false };

  const key = KEY_PREFIX + _hashIp(ip);
  let count = 0;

  try {
    if (redis) {
      count = ((await redis.get(key)) as number) ?? 0;
    } else {
      const entry = inMemory.get(key);
      if (entry && Date.now() <= entry.expiresAt) count = entry.count;
    }
  } catch {
    return { limited: false };
  }

  if (count >= MAX_CONVERSATIONS) {
    const ttl = await getTtlForKey(key);
    return { limited: true, ttl };
  }

  return { limited: false };
}

export async function checkOutcomeLimits(
  ip: string,
  bypassToken?: string,
): Promise<
  | { limited: false }
  | { limited: true; reason: 'abusive' | 'non_conducent'; ttl: number }
> {
  const secret = process.env.RATE_LIMIT_BYPASS_TOKEN;
  if (secret && bypassToken === secret) return { limited: false };

  const abKey = AB_KEY_PREFIX + _hashIp(ip);
  const abCount = await getCount(abKey);
  if (abCount >= MAX_ABUSIVE_CONVERSATIONS) {
    const ttl = await getTtlForKey(abKey);
    return { limited: true, reason: 'abusive', ttl };
  }

  const ncKey = NC_KEY_PREFIX + _hashIp(ip);
  const ncCount = await getCount(ncKey);
  if (ncCount >= MAX_NC_CONVERSATIONS) {
    const ttl = await getTtlForKey(ncKey);
    return { limited: true, reason: 'non_conducent', ttl };
  }

  return { limited: false };
}

export async function incrementConversationCount(ip: string, bypassToken?: string): Promise<void> {
  const secret = process.env.RATE_LIMIT_BYPASS_TOKEN;
  if (secret && bypassToken === secret) return;
  await incrementKey(KEY_PREFIX + _hashIp(ip));
}

export async function incrementNonConducentOutcome(ip: string, bypassToken?: string): Promise<void> {
  const secret = process.env.RATE_LIMIT_BYPASS_TOKEN;
  if (secret && bypassToken === secret) return;
  await incrementKey(NC_KEY_PREFIX + _hashIp(ip));
}

export async function incrementAbusiveOutcome(ip: string, bypassToken?: string): Promise<void> {
  const secret = process.env.RATE_LIMIT_BYPASS_TOKEN;
  if (secret && bypassToken === secret) return;
  await incrementKey(AB_KEY_PREFIX + _hashIp(ip));
}

export async function resetRateLimitsForIp(ip: string): Promise<void> {
  const h = _hashIp(ip);
  await Promise.all([
    deleteKey(KEY_PREFIX + h),
    deleteKey(NC_KEY_PREFIX + h),
    deleteKey(AB_KEY_PREFIX + h),
  ]);
}

export function extractClientIp(req: Request): string {
  const headers = req instanceof Request ? req.headers : new Headers();
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const xri = headers.get('x-real-ip');
  if (xri) return xri.trim();
  return '127.0.0.1';
}
