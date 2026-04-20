import { Redis } from '@upstash/redis';

let upstashClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (upstashClient) return upstashClient;
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('Redis credentials missing in production!');
    }
    return null;
  }
  
  upstashClient = new Redis({ url, token });
  return upstashClient;
}
