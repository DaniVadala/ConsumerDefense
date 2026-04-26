import { NextRequest } from 'next/server';
import { mergeFollowupIntoAnswers, getPendingSteps, type ExtractedAnswers } from '@/lib/chat/intake-extractor';
import { isOpenAiModerationFlagged } from '@/lib/chat/openai-moderation';
import { INTAKE_OR_OUTPUT_POLICY_MESSAGE } from '@/lib/chat/content-policy-messages';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: 'Configuración del servidor incompleta' }, { status: 500 });
    }

    const body = await req.json().catch(() => null) as {
      current?: ExtractedAnswers;
      text?: string;
    } | null;

    if (!body?.current || typeof body.text !== 'string') {
      return Response.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const text = body.text.trim();
    if (text.length < 3) {
      return Response.json({ error: 'Mensaje demasiado corto' }, { status: 400 });
    }

    const flagged = await isOpenAiModerationFlagged(text);
    if (flagged) {
      return Response.json({ blocked: true, message: INTAKE_OR_OUTPUT_POLICY_MESSAGE });
    }

    const result = await mergeFollowupIntoAnswers(body.current, text);
    if (!result.ok) {
      return Response.json({ blocked: true, message: INTAKE_OR_OUTPUT_POLICY_MESSAGE });
    }

    const pendingSteps = getPendingSteps(result.merged);
    return Response.json({ extracted: result.merged, pendingSteps });
  } catch (err) {
    console.error('[intake-followup-merge] error:', err);
    return Response.json({ error: 'Error al procesar el mensaje' }, { status: 500 });
  }
}
