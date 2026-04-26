import { NextRequest } from 'next/server';
import { extractFromFreeText, getPendingSteps } from '@/lib/chat/intake-extractor';
import { isOpenAiModerationFlagged } from '@/lib/chat/openai-moderation';
import { INTAKE_OR_OUTPUT_POLICY_MESSAGE } from '@/lib/chat/content-policy-messages';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: 'Configuración del servidor incompleta' }, { status: 500 });
    }

    const body = await req.json().catch(() => null);
    if (!body?.text || typeof body.text !== 'string') {
      return Response.json({ error: 'Texto requerido' }, { status: 400 });
    }

    if (body.text.trim().length < 5) {
      return Response.json({ error: 'Texto demasiado corto' }, { status: 400 });
    }

    const flagged = await isOpenAiModerationFlagged(body.text);
    if (flagged) {
      return Response.json({ blocked: true, message: INTAKE_OR_OUTPUT_POLICY_MESSAGE });
    }

    const { extracted, intakeApto } = await extractFromFreeText(body.text);
    if (!intakeApto) {
      return Response.json({ blocked: true, message: INTAKE_OR_OUTPUT_POLICY_MESSAGE });
    }

    const pendingSteps = getPendingSteps(extracted);

    console.log('[intake-extract] extracted:', JSON.stringify(extracted));
    console.log('[intake-extract] pending:', pendingSteps);

    return Response.json({ extracted, pendingSteps });
  } catch (err) {
    console.error('[intake-extract] error:', err);
    return Response.json({ error: 'Error al procesar el texto' }, { status: 500 });
  }
}
