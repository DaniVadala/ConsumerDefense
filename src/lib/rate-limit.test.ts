import { describe, it, expect } from 'vitest';
import { rateLimit } from './rate-limit';

// No UPSTASH env vars set in test → uses in-memory fallback automatically

describe('rateLimit', () => {
  it('permite peticiones bajo el límite', async () => {
    const result = await rateLimit('rl-allow-1', { maxRequests: 3, windowMs: 60_000 });
    expect(result.success).toBe(true);
  });

  it('bloquea al superar el límite', async () => {
    const key = 'rl-block-1';
    await rateLimit(key, { maxRequests: 2, windowMs: 60_000 });
    await rateLimit(key, { maxRequests: 2, windowMs: 60_000 });
    const result = await rateLimit(key, { maxRequests: 2, windowMs: 60_000 });
    expect(result.success).toBe(false);
  });

  it('vuelve a permitir peticiones tras expirar la ventana de tiempo', async () => {
    const key = 'rl-window-1';
    await rateLimit(key, { maxRequests: 1, windowMs: 50 });
    await new Promise((resolve) => setTimeout(resolve, 60));
    const result = await rateLimit(key, { maxRequests: 1, windowMs: 50 });
    expect(result.success).toBe(true);
  });

  it('cada clave es independiente', async () => {
    await rateLimit('rl-indep-a', { maxRequests: 1, windowMs: 60_000 });
    const result = await rateLimit('rl-indep-b', { maxRequests: 1, windowMs: 60_000 });
    expect(result.success).toBe(true);
  });
});
