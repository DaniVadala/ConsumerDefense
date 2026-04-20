import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { buildChatGraph } from '@/lib/chatbot/graph';
import { getSession, saveSession } from '@/lib/chatbot/session';
import { rateLimit } from '@/lib/rate-limit';
import { 
  detectInjection, 
  reportSuspicion, 
  isBlocked, 
  sanitizeForPrompt,
  maskPII 
} from '@/lib/ai/input-guard';
import type { GraphStateType } from '@/lib/chatbot/state';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const sessionId = req.headers.get('x-session-id') || uuidv4();

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               req.headers.get('x-real-ip') || 'unknown';

    // 1. Rate Limiting (Escudo de Costos)
    const { success: limitOk } = await rateLimit(ip, { maxRequests: 15, windowMs: 10 * 60 * 1000 });
    if (!limitOk) {
      return NextResponse.json(
        { error: 'Demasiados mensajes. Por favor, esperá unos minutos.' },
        { status: 429 }
      );
    }

    // 2. Verificar si la sesión está bloqueada (Seguridad con Estado)
    if (await isBlocked(sessionId)) {
      return NextResponse.json(
        { error: 'Acceso restringido por comportamiento sospechoso.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { message, sessionId: incomingSessionId, locale: bodyLocale } = body;
    const locale = bodyLocale || req.headers.get('x-locale') || 'es';
    const finalSessionId = incomingSessionId || sessionId;

    if (!message || typeof message !== 'string' || message.length > 2000) {
      return NextResponse.json({ error: 'Mensaje inválido.' }, { status: 400 });
    }

    // 3. Detección de Inyección (Stateful Security)
    const injection = detectInjection(message);
    if (injection.detected) {
      await reportSuspicion(finalSessionId);
      return NextResponse.json(
        { error: 'Contenido no permitido detectado.' },
        { status: 400 }
      );
    }

    // 4. Privacidad y Sanitización (PII Masking)
    const cleanMessage = sanitizeForPrompt(maskPII(message));
    const existingState = await getSession(finalSessionId);

    const inputState: Partial<GraphStateType> = {
      ...(existingState || {}),
      locale,
      lastUserMessage: cleanMessage,
      messages: [
        ...((existingState?.messages || []) as Array<{ role: 'user' | 'assistant'; content: string }>),
        { role: 'user' as const, content: cleanMessage },
      ],
      responseText: '',
      uiComponents: [],
    };

    if (!existingState) {
      inputState.locale = locale;
      inputState.currentNode = 'saludo';
      inputState.turnCount = 0;
      inputState.turnosSinProgreso = 0;
      inputState.intakeStep = 0;
      inputState.captured = { areaConfirmada: false };
      inputState.canDiagnose = false;
      inputState.esUrgencia = false;
      inputState.esMenor = false;
      inputState.temaFueraDeConsumo = 0;
    }

    const graph = buildChatGraph();
    const result = await graph.invoke(inputState);

    // 4. Persistencia de Sesión (Redis Checkpointing)
    const stateToSave: Partial<GraphStateType> = {
      locale,
      currentNode: result.currentNode,
      turnCount: result.turnCount,
      turnosSinProgreso: result.turnosSinProgreso,
      intakeStep: result.intakeStep,
      captured: result.captured,
      casoId: result.casoId,
      diagnosticoTexto: result.diagnosticoTexto,
      diagnosticoData: result.diagnosticoData,
      canDiagnose: result.canDiagnose,
      esUrgencia: result.esUrgencia,
      esMenor: result.esMenor,
      temaFueraDeConsumo: result.temaFueraDeConsumo,
      messages: (result.messages || []).slice(-10), // Guardamos un poco más de contexto
    };

    if (result.responseText) {
      stateToSave.messages = [
        ...(stateToSave.messages || []),
        { role: 'assistant' as const, content: result.responseText },
      ];
    }

    await saveSession(finalSessionId, stateToSave);

    return NextResponse.json({
      textResponse: result.responseText || null,
      uiComponents: result.uiComponents || [],
      sessionId: finalSessionId,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      {
        textResponse: 'Hubo un error. Te conecto con un abogado para que te ayude directamente.',
        uiComponents: [{ type: 'fallbackWhatsApp', contexto: 'Error técnico en el chatbot' }],
        sessionId,
      },
      { status: 200 }
    );
  }
}
