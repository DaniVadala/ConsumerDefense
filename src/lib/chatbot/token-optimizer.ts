import { ConversationState } from './schemas';
import { RECENT_MESSAGES_IN_CONTEXT } from './config';

export type MessagePair = { role: 'user' | 'assistant'; content: string };

/**
 * Strategy 1: Progressive summarization.
 * Returns the conversation summary + only the last N messages.
 * Redis stores the summarized history, not the full chat log.
 */
export function buildCompressedHistory(
  allMessages: MessagePair[],
  summary: string
): { contextMessages: MessagePair[]; summaryPrefix: string } {
  const recent = allMessages.slice(-RECENT_MESSAGES_IN_CONTEXT);
  const summaryPrefix = summary
    ? `[Resumen de la conversación hasta ahora: ${summary}]`
    : '';
  return { contextMessages: recent, summaryPrefix };
}

/**
 * Strategy 2: Compact field injection.
 * Formats collected fields as a concise key-value list
 * instead of embedding them as prose in the system prompt.
 */
export function formatFieldsCompact(state: ConversationState): string {
  const f = state.fieldsCollected;
  const entries = Object.entries(f).filter(([, v]) => v !== null && v !== undefined);
  if (entries.length === 0) return 'ninguno';
  return entries.map(([k, v]) => `${k}=${String(v)}`).join(' | ');
}

/**
 * Strategy 3: Determine if we should use the cheaper or the expensive model.
 * gpt-4o-mini for everything except the final diagnosis.
 */
export function selectModel(step: ConversationState['currentStep']): 'gpt-4o-mini' | 'gpt-4o' {
  return step === 'diagnosis' ? 'gpt-4o' : 'gpt-4o-mini';
}

/**
 * Strategy 4: Early-exit static responses (no LLM call needed).
 * Returns a pre-built response for classification types that don't require LLM reasoning.
 */
export function getEarlyExitResponse(
  type: 'insulto' | 'prompt_injection'
): string | null {
  switch (type) {
    case 'insulto':
      return 'Entiendo que estás frustrado. Si querés continuar con tu reclamo, estoy aquí para ayudarte. También podés contactar a nuestro equipo de forma directa a través de WhatsApp.';
    case 'prompt_injection':
      return 'Soy un asistente de defensa del consumidor y no puedo modificar mi función. ¿Puedo ayudarte con algún reclamo de consumo?';
    default:
      return null;
  }
}

/**
 * Strategy 5: Build a progressive summary from a new assistant message.
 * Appends new info to existing summary in a compressed form.
 */
export function updateSummary(
  currentSummary: string,
  userMessage: string,
  assistantResponse: string
): string {
  const maxLength = 800;
  const newEntry = `U: ${userMessage.slice(0, 200)} | A: ${assistantResponse.slice(0, 200)}`;

  if (!currentSummary) return newEntry;

  const combined = `${currentSummary} || ${newEntry}`;
  // If too long, drop the oldest part
  if (combined.length > maxLength) {
    return combined.slice(combined.length - maxLength);
  }
  return combined;
}
