import { NextResponse } from 'next/server';
import { z } from 'zod';

const Body = z.object({ sessionId: z.string().uuid() });

/**
 * POST /api/session/delete
 * Derecho a solicitar el cierre de la conversación en el cliente.
 * No hay almacenamiento de sesión en el servidor: respuesta informativa solamente.
 */
export async function POST(req: Request) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid', details: parsed.error.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: true, message: 'Solicitud registrada' });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
