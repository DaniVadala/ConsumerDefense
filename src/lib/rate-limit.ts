// SEC: In-memory sliding-window rate limiter for API routes.
// Prevents abuse of paid third-party APIs (Groq, Resend).
// For multi-instance deployments, replace with Redis-backed limiter.

interface SlidingWindow {
  timestamps: number[];
}

const windows = new Map<string, SlidingWindow>();

// Evict stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  for (const [key, win] of windows) {
    win.timestamps = win.timestamps.filter((t) => t > cutoff);
    if (win.timestamps.length === 0) windows.delete(key);
  }
}

/**
 * Check if a request should be rate-limited.
 * Returns { success: true } if allowed, { success: false } if blocked.
 */
export function rateLimit(
  key: string,
  { maxRequests, windowMs }: { maxRequests: number; windowMs: number },
): { success: boolean } {
  cleanup(windowMs);

  const now = Date.now();
  const cutoff = now - windowMs;
  let win = windows.get(key);

  if (!win) {
    win = { timestamps: [] };
    windows.set(key, win);
  }

  // Remove expired timestamps
  win.timestamps = win.timestamps.filter((t) => t > cutoff);

  if (win.timestamps.length >= maxRequests) {
    return { success: false };
  }

  win.timestamps.push(now);
  return { success: true };
}
