import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const Body = z.object({
  sessionId: z.string().uuid().optional(),
  lastStep: z.string().min(1).max(64),
});

/**
 * best-effort: sendBeacon() desde el cliente al cerrar o salir; no bloquea UX.
 * El análisis de la conversación queda a cargo del modelo (sin persistencia de estado en servidor).
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return new NextResponse(null, { status: 400 });
  }
  return new NextResponse(null, { status: 204 });
}
