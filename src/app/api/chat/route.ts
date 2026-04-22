import { NextRequest } from 'next/server';
import { streamText, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { v4 as randomUUID } from 'uuid';

import { ChatRequestSchema, ConversationState, FieldsCollected } from '@/lib/chatbot/schemas';
import { getSession, saveSession, createInitialState } from '@/lib/chatbot/redis-session';
import { buildContext, buildClassificationSystemPrompt, buildDiagnosisSystemPrompt } from '@/lib/chatbot/context-builder';
import { updateSummary, getEarlyExitResponse } from '@/lib/chatbot/token-optimizer';
import { classifyResponseTool } from '@/lib/chatbot/tools/classify-response';
import { extractFieldsTool } from '@/lib/chatbot/tools/extract-fields';
import { checkRateLimit, incrementConversationCount, extractClientIp } from '@/lib/chatbot/rate-limiter';
import {
  DEFAULT_MODEL,
  DIAGNOSIS_MODEL,
  MAX_TOKENS,
  TEMPERATURE,
  MAX_NON_CONDUCENT,
  REQUIRED_FIELDS_FOR_DIAGNOSIS,
} from '@/lib/chatbot/config';

// ---------------------------------------------------------------------------
// Post-extraction field sanitizer
// Prevents offensive/impossible values from being stored in session state,
// which could trigger OpenAI content filters on subsequent streaming calls.
// ---------------------------------------------------------------------------

const PROFANITY_RE = /\b(puta[os]?|puto[s]?|hijo[s]?\s*(de\s*)?puta|concha[os]?|laconchadet|mierda[s]?|culo[s]?|pelotud[ao]s?|boludo[as]?|sorete[s]?)\b/i;
const INVALID_CURRENCIES_RE = /\b(yuan[es]?|yen|corona[s]?|krone|marco[s]?|deutsc?h?\s*mark|ducado[s]?|doblón[es]?|rublo[s]?|ruble[s]?|franco[s]?|franc[s]?|lira[s]?|gulden|florín)\b/i;
const INVALID_DOC_RE = /\b(papiro[s]?|jeroglífico[s]?|tablilla[s]?|arcilla|cuneiforme|pergamino\s+medieval|piedra\s+labrada|runa[s]?)\b/i;
const INVALID_MEDIUM_RE = /aerosol|spray|pintando\s+(en\s+)?(vidrio|pared|muro)|grafiti|graffiti|esténcil|pintada\s+en/i;

function extractYear(s: string): number | null {
  const m = s.match(/\b([12][0-9]{3})\b/);
  return m ? parseInt(m[1]) : null;
}

function isDateStringValid(dateStr: string): boolean {
  const year = extractYear(dateStr);
  if (year === null) return true;
  const currentYear = new Date().getFullYear();
  // Rechaza fechas previas a la Ley 24.240 (1993) o futuras
  if (year < 1993 || year > currentYear + 1) return false;
  // Prescripción bajo Art. 50 Ley 24.240 = 3 años.
  // Usamos 5 años como umbral para cubrir casos donde la prescripción fue interrumpida.
  // Fechas con más de 5 años de antigüedad se consideran fuera de scope.
  if (year < currentYear - 5) return false;
  return true;
}

function isTimeSpanValid(s: string): boolean {
  const year = extractYear(s);
  if (year !== null && year < 1993) return false;
  const decadesMatch = s.match(/\b(\d+)\s*años?\b/i);
  if (decadesMatch && parseInt(decadesMatch[1]) > 10) return false;
  return true;
}

function sanitizeExtractedFields(fields: FieldsCollected): FieldsCollected {
  const s = { ...fields };
  if (s.company && PROFANITY_RE.test(s.company)) s.company = null;
  if (s.incidentDate && !isDateStringValid(s.incidentDate)) s.incidentDate = null;
  if (s.incidentDateRange && !isDateStringValid(s.incidentDateRange)) s.incidentDateRange = null;
  if (s.priorClaimDate && !isDateStringValid(s.priorClaimDate)) s.priorClaimDate = null;
  if (s.claimResponseTime && !isTimeSpanValid(s.claimResponseTime)) s.claimResponseTime = null;
  if (s.priorClaimMedium && INVALID_MEDIUM_RE.test(s.priorClaimMedium)) s.priorClaimMedium = null;
  if (s.amount && INVALID_CURRENCIES_RE.test(s.amount)) s.amount = null;
  if (s.documentationDetails && INVALID_DOC_RE.test(s.documentationDetails)) {
    s.documentationDetails = null;
    s.hasDocumentation = null; // can't trust the boolean if the detail was absurd
  }
  return s;
}

export const maxDuration = 60;

function makeOpenAI(model: string) {
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai(model);
}

function isReadyForDiagnosis(state: ConversationState): boolean {
  const f = state.fieldsCollected;
  return REQUIRED_FIELDS_FOR_DIAGNOSIS.every((key) => {
    const value = f[key as keyof typeof f];
    return value !== null && value !== undefined;
  });
}

function nextStep(state: ConversationState): ConversationState['currentStep'] {
  const f = state.fieldsCollected;
  if (!f.description) return 'description';
  if (!f.company) return 'company';
  if (!f.incidentDate && !f.incidentDateRange) return 'date';
  if (f.hasPriorClaim === null) return 'prior_claim';
  if (f.hasPriorClaim === true && !f.claimResponse) return 'claim_response';
  if (f.hasDocumentation === null) return 'documentation';
  if (!f.amount) return 'amount';
  return 'diagnosis';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Solicitud invalida' }, { status: 400 });
    }

    const { message: rawMessage, sessionId: incomingSessionId, bypassToken } = parsed.data;
    const userMessage = rawMessage.trim().slice(0, 5000);

    // ── Rate limit: only applies when starting a brand-new conversation ────────
    const clientIp = extractClientIp(req);
    const isNewConversation = !incomingSessionId;
    if (isNewConversation) {
      const rl = await checkRateLimit(clientIp, bypassToken);
      if (rl.limited) {
        const hours = Math.ceil(rl.ttl / 3600);
        return Response.json({
          rateLimited: true,
          text: `Alcanzaste tu límite de ${3} consultas gratuitas por día. Tu cuota se rehabilitará en aproximadamente ${hours} hora${hours !== 1 ? 's' : ''}. Si necesitás asistencia urgente, contactanos por WhatsApp.`,
          showWhatsAppButton: true,
          whatsAppReason: 'default',
        });
      }
    }

    const sessionId = incomingSessionId ?? randomUUID();
    let state: ConversationState =
      (await getSession(sessionId)) ?? createInitialState(sessionId);

    // Increment rate limit counter once the session object is confirmed as new
    if (isNewConversation) {
      await incrementConversationCount(clientIp, bypassToken);
    }

    // Guard: session already concluded — return persistent fallback immediately
    if (state.currentStep === 'fallback') {
      return Response.json({
        sessionId,
        text: 'Este chat ya concluyó. Iniciá un nuevo análisis o contactá a un especialista.',
        showWhatsAppButton: true,
        whatsAppReason: 'no_conducente',
        currentStep: 'fallback',
      });
    }
    if (state.currentStep === 'completed') {
      return Response.json({
        sessionId,
        text: 'Tu análisis ya fue generado. Iniciá un nuevo análisis para consultar otro caso.',
        showWhatsAppButton: true,
        whatsAppReason: 'completed',
        currentStep: 'completed',
      });
    }

    const context = buildContext(state);

    const classifyResult = await generateText({
      model: makeOpenAI(DEFAULT_MODEL),
      system: buildClassificationSystemPrompt(context.currentStep),
      prompt: `Clasifica este mensaje del usuario en el contexto del paso "${context.currentStep}":\n"${userMessage}"\n\nContexto: ${context.conversationSummary || 'inicio'}`,
      tools: { classifyResponse: classifyResponseTool },
      toolChoice: { type: 'tool', toolName: 'classifyResponse' },
      maxOutputTokens: 300,
      temperature: 0.2,
    });

    const classificationCall = classifyResult.toolCalls.find(
      (tc) => tc.toolName === 'classifyResponse'
    );

    if (!classificationCall) {
      return Response.json({ error: 'Error de clasificacion' }, { status: 500 });
    }

    const classificationInput = classificationCall.input as {
      type: string;
      fieldsAnswered?: string[];
      confidence?: number;
      reasoning?: string;
    };
    const classificationType = classificationInput.type;

    const earlyExit = getEarlyExitResponse(classificationType as 'insulto' | 'prompt_injection');
    if (earlyExit) {
      if (classificationType === 'insulto') {
        state = { ...state, currentStep: 'fallback', turnCount: state.turnCount + 1 };
        await saveSession(state);
      }
      return Response.json({
        sessionId,
        text: earlyExit,
        showWhatsAppButton: classificationType === 'insulto',
        whatsAppReason: classificationType === 'insulto' ? 'insulto' : undefined,
        currentStep: state.currentStep,
      });
    }

    if (classificationType === 'no_conducente') {
      const newCount = state.nonConducentCount + 1;
      if (newCount >= MAX_NON_CONDUCENT) {
        state = { ...state, currentStep: 'fallback', nonConducentCount: newCount, turnCount: state.turnCount + 1 };
        await saveSession(state);
        return Response.json({
          sessionId,
          text: 'Parece que estamos teniendo dificultades para avanzar. Nuestro equipo puede ayudarte de forma personalizada a través de WhatsApp.',
          showWhatsAppButton: true,
          whatsAppReason: 'no_conducente',
          currentStep: 'fallback',
        });
      }
      state = { ...state, nonConducentCount: newCount, turnCount: state.turnCount + 1 };
      await saveSession(state);
    }

    if (classificationType === 'emergencia' || classificationType === 'fuera_de_scope' || classificationType === 'fraude_etico') {
      const stateForFinish = { ...state, turnCount: state.turnCount + 1 };
      const streamResult = streamText({
        model: makeOpenAI(DEFAULT_MODEL),
        system: context.systemPrompt,
        prompt: userMessage,
        maxOutputTokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        onFinish: async ({ text }) => {
          const updatedState = {
            ...stateForFinish,
            currentStep: classificationType === 'fuera_de_scope' ? ('fallback' as const) : stateForFinish.currentStep,
            conversationSummary: updateSummary(stateForFinish.conversationSummary, userMessage, text),
          };
          await saveSession(updatedState);
        },
      });
      return streamResult.toTextStreamResponse({
        headers: { 'X-Session-Id': sessionId, 'X-Current-Step': state.currentStep },
      });
    }

    if (classificationType === 'conducente' || classificationType === 'multi_field') {
      const pendingFields = context.pendingFields;
      const stepBefore = context.currentStep;

      if (pendingFields.length > 0) {
        const extractResult = await generateText({
          model: makeOpenAI(DEFAULT_MODEL),
          system: context.systemPrompt,
          prompt: `Extrae los campos del caso del consumidor del siguiente mensaje. Establece null para campos no mencionados.\nCampos pendientes: ${pendingFields.join(', ')}\nMensaje: "${userMessage}"`,
          tools: { extractFields: extractFieldsTool },
          toolChoice: { type: 'tool', toolName: 'extractFields' },
          maxOutputTokens: 500,
          temperature: 0.1,
        });

        const extractCall = extractResult.toolCalls.find((tc) => tc.toolName === 'extractFields');
        if (extractCall) {
          const extracted = extractCall.input as Record<string, unknown>;
          const updatedFields = { ...state.fieldsCollected };
          for (const [key, val] of Object.entries(extracted)) {
            if (val !== null && val !== undefined && key in updatedFields) {
              (updatedFields as Record<string, unknown>)[key] = val;
            }
          }
          // Sanitize: reject offensive/impossible values before persisting to session.
          // nonConducentCount is intentionally NOT reset here — it accumulates across
          // the entire conversation regardless of whether non-conducent messages are
          // consecutive or alternated with conducent ones.
          state = { ...state, fieldsCollected: sanitizeExtractedFields(updatedFields) };
        }
      }

      const newStep = nextStep(state);

      // Stuck detection: if the required step didn't advance, user is not providing useful info
      const stuck = newStep === stepBefore && stepBefore !== 'diagnosis' && stepBefore !== 'completed';
      const newStuckCount = stuck ? state.stuckCount + 1 : 0;

      if (newStuckCount >= 2) {
        state = { ...state, currentStep: 'fallback', stuckCount: newStuckCount, turnCount: state.turnCount + 1 };
        await saveSession(state);
        return Response.json({
          sessionId,
          text: 'Veo que estamos teniendo dificultades para avanzar con la información. Uno de nuestros especialistas puede ayudarte directamente por WhatsApp.',
          showWhatsAppButton: true,
          whatsAppReason: 'no_conducente',
          currentStep: 'fallback',
        });
      }

      state = { ...state, currentStep: newStep, stuckCount: newStuckCount, turnCount: state.turnCount + 1 };
      await saveSession(state);

      if (newStep === 'diagnosis' || isReadyForDiagnosis(state)) {
        const diagState = { ...state, currentStep: 'diagnosis' as const };
        const diagContext = buildContext(diagState);
        const diagnosisStream = streamText({
          model: makeOpenAI(DIAGNOSIS_MODEL),
          system: buildDiagnosisSystemPrompt(),
          messages: [
            {
              role: 'user',
              content: `Por favor genera el diagnostico completo del caso con los siguientes datos:\n${diagContext.collectedFieldsCompact}\n\nResumen: ${diagState.conversationSummary}`,
            },
          ],
          maxOutputTokens: MAX_TOKENS,
          temperature: 0.3,
          onFinish: async ({ text }) => {
            const finalState = {
              ...diagState,
              currentStep: 'completed' as const,
              conversationSummary: updateSummary(diagState.conversationSummary, userMessage, text),
            };
            await saveSession(finalState);
          },
        });
        return diagnosisStream.toTextStreamResponse({
          headers: {
            'X-Session-Id': sessionId,
            'X-Current-Step': 'completed',
            'X-Show-Whatsapp-Button': 'true',
            'X-Whatsapp-Reason': 'completed',
          },
        });
      }
    }

    const finalContext = buildContext(state);
    const stateForFinish = { ...state };
    const streamResult = streamText({
      model: makeOpenAI(DEFAULT_MODEL),
      system: finalContext.systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      maxOutputTokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      onFinish: async ({ text }) => {
        const updatedState = {
          ...stateForFinish,
          conversationSummary: updateSummary(stateForFinish.conversationSummary, userMessage, text),
        };
        await saveSession(updatedState);
      },
    });

    return streamResult.toTextStreamResponse({
      headers: { 'X-Session-Id': sessionId, 'X-Current-Step': state.currentStep },
    });
  } catch (err) {
    console.error('[/api/chat] Unhandled error:', err);
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}
