import { NextRequest } from 'next/server';
import { z } from 'zod';
import { isOpenAiModerationFlagged } from '@/lib/chat/openai-moderation';

const Body = z.object({
  text: z.string().min(1).max(50_000),
});

export const maxDuration = 15;

/**
 * Uso: validar un texto largo (p. ej. salida de diagnóstico) en el cliente.
 * Devuelve { flagged: true } si la API de moderación lo marca.
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ flagged: false, skipped: true });
    }
    const body = await req.json().catch(() => null);
    const p = Body.safeParse(body);
    if (!p.success) {
      return Response.json({ error: 'Texto inválido' }, { status: 400 });
    }
    const flagged = await isOpenAiModerationFlagged(p.data.text);
    return Response.json({ flagged });
  } catch (e) {
    console.error('[moderate-content]', e);
    return Response.json({ flagged: false });
  }
}
