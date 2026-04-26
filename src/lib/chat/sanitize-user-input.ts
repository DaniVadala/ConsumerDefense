import type { UIMessage } from 'ai';

import { MAX_USER_MESSAGE_LENGTH } from '@/lib/chat/llm-config';

/**
 * Trunca y atenúa patrones de prompt injection frecuentes. No sustituye arquitectura
 * (el usuario nunca escribe en system); reduce vectores obvios en el historial.
 */
export function sanitizeUserInput(text: string): string {
  const t = text
    .replace(/\[SYSTEM\]/gi, '[S]')
    .replace(/\[INST\]/gi, '[I]')
    .replace(/###\s*system/gi, '###')
    .replace(/###\s*instruction/gi, '###')
    .replace(/<\|system\|>/gi, '')
    .replace(/<\|im_start\|>/gi, '')
    .trim();
  if (t.length <= MAX_USER_MESSAGE_LENGTH) return t;
  return t.slice(0, MAX_USER_MESSAGE_LENGTH);
}

/** Aplica `sanitizeUserInput` a partes de texto de mensajes de usuario. */
export function sanitizeUiMessages(messages: UIMessage[]): UIMessage[] {
  return messages.map((m) => {
    if (m.role !== 'user' || !Array.isArray(m.parts)) return m;
    return {
      ...m,
      parts: m.parts.map((p) => {
        if (p.type === 'text' && 'text' in p && typeof p.text === 'string') {
          return { ...p, text: sanitizeUserInput(p.text) };
        }
        return p;
      }),
    };
  });
}
