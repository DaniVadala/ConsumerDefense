import { NextRequest } from 'next/server';
import { resetRateLimitsForIp, extractClientIp } from '@/lib/rate-limiter';

/**
 * Admin endpoint: reset all rate-limit counters for a given IP.
 *
 * POST /api/admin/reset-rate-limit
 * Body: { token: string, ip?: string }
 *
 * If `ip` is omitted, resets the caller's own IP.
 * Requires RATE_LIMIT_BYPASS_TOKEN to authenticate.
 *
 * Usage for testing:
 *   curl -X POST /api/admin/reset-rate-limit \
 *     -H "Content-Type: application/json" \
 *     -d '{"token":"<RATE_LIMIT_BYPASS_TOKEN>","ip":"127.0.0.1"}'
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const { ip: targetIp, token } = (body ?? {}) as { ip?: string; token?: string };

    const adminToken = process.env.RATE_LIMIT_BYPASS_TOKEN;
    if (!adminToken || token !== adminToken) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    const ip = targetIp?.trim() || extractClientIp(req);
    await resetRateLimitsForIp(ip);

    return Response.json({
      ok: true,
      ip,
      message: `Límites reseteados para ${ip}`,
    });
  } catch {
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}
