import crypto from 'node:crypto';

/**
 * Returns a deterministic 32-char hex hash for the given IP.
 * Uses HMAC-SHA256 with IP_HASH_SECRET so the mapping cannot be reversed
 * without the secret.
 */
export function hashIp(ip: string): string {
  const secret = process.env.IP_HASH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('IP_HASH_SECRET is required in production');
    }
    return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32);
  }
  return crypto.createHmac('sha256', secret).update(ip).digest('hex').slice(0, 32);
}
