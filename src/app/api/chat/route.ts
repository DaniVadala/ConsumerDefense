import { NextRequest } from 'next/server';
import {
  streamText,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  UI_MESSAGE_STREAM_HEADERS,
  type UIMessage,
  type UIMessageChunk,
  type AsyncIterableStream,
  safeValidateUIMessages,
  stepCountIs,
} from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { v4 as randomUUID } from 'uuid';
import { z } from 'zod';

import { loadChatInstructions } from '@/lib/prompts/load-chat-instructions';
import { buildSystemPromptWithInstructions } from '@/lib/chat/reference-date';
import { sanitizeUiMessages, sanitizeUserInput } from '@/lib/chat/sanitize-user-input';
import {
  checkRateLimit,
  checkOutcomeLimits,
  incrementConversationCount,
  extractClientIp,
} from '@/lib/rate-limiter';
import {
  CHAT_TEMPERATURE,
  DEFAULT_MODEL,
  MAX_TOKENS,
  MAX_USER_MESSAGE_LENGTH,
  PROVIDER_OPTIONS,
} from '@/lib/chat/llm-config';
import {
  isOpenAiRateLimitError,
  OPENAI_RATE_LIMIT_USER_MESSAGE,
} from '@/lib/chat/openai-rate-limit';

const NewChatBodySchema = z.object({
  messages: z.array(z.unknown()).min(1),
  id: z.string().optional(),
  sessionId: z.string().uuid().optional(),
  bypassToken: z.string().optional(),
});

const OldChatBodySchema = z.object({
  message: z.string().min(1).max(6000),
  sessionId: z.string().uuid().optional(),
  bypassToken: z.string().optional(),
});

function withStreamHeaders(extra: Record<string, string> = {}) {
  return { ...UI_MESSAGE_STREAM_HEADERS, ...extra };
}

function makeOpenAI(model: string) {
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai(model);
}

function legacyJson(data: object, status = 200): Response {
  return Response.json(data, { status });
}

type EscalationPayload = {
  reason: string;
  showWhatsAppButton: boolean;
  whatsAppReason?: string;
  sessionId: string;
  currentStep: string;
};

/**
 * Algunos errores del proveedor (p. ej. 429) llegan como parte `error` en el stream
 * de UI, no como HTTP 4xx. Añadimos `data-escalation` para cierre con WhatsApp.
 */
function wrapWithOpenAiRateLimitEscalation(
  source: AsyncIterableStream<UIMessageChunk>,
  sessionId: string,
): ReadableStream<UIMessageChunk> {
  return new ReadableStream({
    async start(controller) {
      const enqueue = (chunk: UIMessageChunk) => {
        controller.enqueue(chunk);
      };
      const escalation: EscalationPayload = {
        reason: 'openai_rate_limited',
        showWhatsAppButton: true,
        whatsAppReason: 'openai_rate_limited',
        sessionId,
        currentStep: 'chat',
      };
      try {
        for await (const part of source) {
          if (
            part.type === 'error' &&
            'errorText' in part &&
            part.errorText === OPENAI_RATE_LIMIT_USER_MESSAGE
          ) {
            enqueue(part);
            enqueue(
              { type: 'data-escalation', data: escalation } as unknown as UIMessageChunk,
            );
            enqueue(
              {
                type: 'message-metadata',
                messageMetadata: { sessionId, currentStep: 'chat' } as never,
              } as UIMessageChunk,
            );
            continue;
          }
          enqueue(part);
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });
}

function makeEscalationStream(text: string, escalation: EscalationPayload): Response {
  const msgId = randomUUID();
  const textId = randomUUID();

  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      writer.write({ type: 'text-start', id: textId });
      writer.write({ type: 'text-delta', delta: text, id: textId });
      writer.write({ type: 'text-end', id: textId });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (writer as any).write({ type: 'data-escalation', data: escalation });
      writer.write({
        type: 'message-metadata',
        messageMetadata: { sessionId: escalation.sessionId, currentStep: escalation.currentStep } as never,
      });
    },
    generateId: () => msgId,
  });

  return createUIMessageStreamResponse({
    stream,
    headers: withStreamHeaders({
      'X-Session-Id': escalation.sessionId,
      'X-Current-Step': escalation.currentStep,
    }),
  });
}

export const maxDuration = 60;

function runChatModel(args: { system: string; messages: Awaited<ReturnType<typeof convertToModelMessages>> }) {
  return streamText({
    model: makeOpenAI(DEFAULT_MODEL),
    system: args.system,
    messages: args.messages,
    maxOutputTokens: MAX_TOKENS,
    temperature: CHAT_TEMPERATURE,
    tools: {},
    toolChoice: 'none',
    stopWhen: [stepCountIs(5)],
    providerOptions: PROVIDER_OPTIONS,
  });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);
    if (!rawBody) return legacyJson({ error: 'Solicitud inválida' }, 400);

    const newParsed = NewChatBodySchema.safeParse(rawBody);
    const oldParsed = OldChatBodySchema.safeParse(rawBody);
    const isNewFormat = newParsed.success && Array.isArray((rawBody as { messages?: unknown }).messages);

    let bypassToken: string | undefined;
    let sessionId: string;

    if (isNewFormat) {
      const data = newParsed.data!;
      bypassToken = data.bypassToken;
      sessionId = data.sessionId ?? randomUUID();
    } else if (oldParsed.success) {
      bypassToken = oldParsed.data.bypassToken;
      sessionId = oldParsed.data.sessionId ?? randomUUID();
    } else {
      return legacyJson({ error: 'Solicitud inválida' }, 400);
    }

    const clientIp = extractClientIp(req);
    const isNewConversation = isNewFormat
      ? (rawBody as { messages?: unknown[] }).messages?.length === 1
      : !(rawBody as { sessionId?: string }).sessionId;

    if (isNewConversation) {
      const ol = await checkOutcomeLimits(clientIp, bypassToken);
      if (ol.limited) {
        const hours = Math.ceil(ol.ttl / 3600);
        const isAbusive = ol.reason === 'abusive';
        const text = isAbusive
          ? `Tu acceso está temporalmente limitado debido al tipo de interacción registrada. Si tenés una consulta legítima de defensa del consumidor, podrás intentarlo nuevamente en aproximadamente ${hours} hora${hours !== 1 ? 's' : ''}.`
          : `Ya utilizaste tus consultas de hoy sin llegar a un diagnóstico. Podrás intentarlo nuevamente en aproximadamente ${hours} hora${hours !== 1 ? 's' : ''}. Si necesitás asistencia, contactanos por WhatsApp.`;
        if (isNewFormat) {
          return makeEscalationStream(text, {
            reason: 'rate_limited',
            showWhatsAppButton: !isAbusive,
            whatsAppReason: 'default',
            sessionId,
            currentStep: 'greeting',
          });
        }
        return legacyJson({ rateLimited: true, text, showWhatsAppButton: !isAbusive, whatsAppReason: 'default' });
      }

      const rl = await checkRateLimit(clientIp, bypassToken);
      if (rl.limited) {
        const hours = Math.ceil(rl.ttl / 3600);
        const text = `Alcanzaste tu límite de 3 consultas gratuitas por día. Tu cuota se rehabilitará en aproximadamente ${hours} hora${hours !== 1 ? 's' : ''}. Si necesitás asistencia urgente, contactanos por WhatsApp.`;
        if (isNewFormat) {
          return makeEscalationStream(text, {
            reason: 'rate_limited',
            showWhatsAppButton: true,
            whatsAppReason: 'default',
            sessionId,
            currentStep: 'greeting',
          });
        }
        return legacyJson({ rateLimited: true, text, showWhatsAppButton: true, whatsAppReason: 'default' });
      }
    }

    if (isNewConversation) {
      await incrementConversationCount(clientIp, bypassToken);
    }

    const apiKey = process.env.OPENAI_API_KEY ?? '';
    if (!apiKey) {
      return legacyJson({ error: 'Configuración del servidor incompleta' }, 500);
    }

    const system = await buildSystemPromptWithInstructions(loadChatInstructions);

    if (isNewFormat) {
      const msgs = (rawBody as { messages: Array<{ role: string; parts?: Array<{ type: string; text?: string }> }> })
        .messages;
      const lastUserMsg = [...msgs].reverse().find((m) => m.role === 'user');
      const lastUserText =
        lastUserMsg?.parts
          ?.filter((p) => p.type === 'text' && p.text)
          .map((p) => p.text)
          .join('') ?? '';
      if (!lastUserText.trim()) return legacyJson({ error: 'Mensaje vacío' }, 400);
      if (lastUserText.length > MAX_USER_MESSAGE_LENGTH) {
        return legacyJson({ error: 'Mensaje demasiado largo' }, 400);
      }

      const validated = await safeValidateUIMessages({
        messages: (rawBody as { messages: unknown[] }).messages,
      });
      if (!validated.success) {
        return legacyJson(
          { error: 'Mensajes inválidos', details: String(validated.error) },
          400,
        );
      }

      const sanitized = sanitizeUiMessages(validated.data as UIMessage[]);
      const modelMessages = await convertToModelMessages(sanitized);
      const result = runChatModel({ system, messages: modelMessages });

      return createUIMessageStreamResponse({
        stream: wrapWithOpenAiRateLimitEscalation(
          result.toUIMessageStream({
            onError: (err) => {
              if (isOpenAiRateLimitError(err)) {
                return OPENAI_RATE_LIMIT_USER_MESSAGE;
              }
              console.error('[/api/chat] model error:', err);
              return 'Ocurrió un error. Podés volver a intentar en un momento.';
            },
            messageMetadata: ({ part }) => {
              if (part.type === 'finish') return { sessionId };
              return undefined;
            },
          }),
          sessionId,
        ),
        headers: withStreamHeaders({ 'X-Session-Id': sessionId, 'X-Current-Step': 'chat' }),
      });
    }

    const userMessage = oldParsed.data!.message.trim();
    if (userMessage.length > MAX_USER_MESSAGE_LENGTH) {
      return legacyJson({ error: 'Mensaje demasiado largo' }, 400);
    }
    const safeLegacy = sanitizeUserInput(userMessage);
    const result = runChatModel({ system, messages: [{ role: 'user', content: safeLegacy }] });
    return result.toTextStreamResponse({ headers: { 'X-Session-Id': sessionId, 'X-Current-Step': 'chat' } });
  } catch (err) {
    console.error('[/api/chat] Unhandled error:', err);
    return legacyJson({ error: 'Error interno' }, 500);
  }
}
